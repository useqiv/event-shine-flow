import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const ZEPTOMAIL_API_KEY = Deno.env.get("ZEPTOMAIL_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type RecipientFilter = "all" | "approved" | "pending";

interface BroadcastRequest {
  subject: string;
  message: string;
  recipientFilter?: RecipientFilter;
}

const escapeHtml = (text: string) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const textToHtml = (text: string) => escapeHtml(text).replace(/\n/g, "<br>");

const sendZeptoEmail = async (to: string, toName: string, subject: string, html: string) => {
  const apiKey = ZEPTOMAIL_API_KEY?.startsWith("Zoho-enczapikey")
    ? ZEPTOMAIL_API_KEY
    : `Zoho-enczapikey ${ZEPTOMAIL_API_KEY}`;

  const response = await fetch("https://api.zeptomail.com/v1.1/email", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: apiKey,
    },
    body: JSON.stringify({
      from: { address: "noreply@useqiv.com", name: "Useqiv" },
      to: [{ email_address: { address: to, name: toName } }],
      subject,
      htmlbody: html,
    }),
  });

  const responseText = await response.text();
  if (!responseText || responseText.trim() === "") {
    if (response.ok) return { success: true };
    throw new Error(`ZeptoMail error: ${response.status} ${response.statusText}`);
  }
  const data = JSON.parse(responseText);
  if (!response.ok) throw new Error(data.message || "Failed to send email");
  return data;
};

const buildBroadcastHtml = (orgName: string, messageHtml: string) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px;">
          <tr>
            <td style="padding-bottom: 20px;">
              <img src="https://useqiv.com/logo.png" alt="Useqiv" height="32" style="height: 32px; width: auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding-bottom: 24px;">
              <p style="margin: 0; font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Message from Useqiv</p>
            </td>
          </tr>
          <tr>
            <td>
              <p style="margin: 0 0 16px; font-size: 16px; font-weight: 600; color: #111827;">Hi ${escapeHtml(orgName)},</p>
              <p style="margin: 0; font-size: 15px; color: #374151; line-height: 1.6;">${messageHtml}</p>
            </td>
          </tr>
          <tr>
            <td style="padding-top: 32px;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">© ${new Date().getFullYear()} Useqiv</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

async function verifyAdmin(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return { error: new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }) };
  }

  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: { user }, error: userError } = await anonClient.auth.getUser(
    authHeader.replace("Bearer ", ""),
  );

  if (userError || !user) {
    return { error: new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }) };
  }

  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data: roleData } = await serviceClient
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (!roleData) {
    return { error: new Response(JSON.stringify({ error: "Not an admin" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }) };
  }

  return { user, serviceClient };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!ZEPTOMAIL_API_KEY) {
      throw new Error("ZEPTOMAIL_API_KEY is not configured");
    }

    const auth = await verifyAdmin(req);
    if (auth.error) return auth.error;
    const { user, serviceClient } = auth;

    const { subject, message, recipientFilter = "all" }: BroadcastRequest = await req.json();

    if (!subject?.trim() || !message?.trim()) {
      return new Response(JSON.stringify({ error: "Subject and message are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (subject.length > 200) {
      return new Response(JSON.stringify({ error: "Subject must be 200 characters or less" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (message.length > 10000) {
      return new Response(JSON.stringify({ error: "Message must be 10,000 characters or less" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: orgRoles, error: rolesError } = await serviceClient
      .from("user_roles")
      .select("user_id")
      .eq("role", "organization");

    if (rolesError) throw rolesError;

    const orgIds = orgRoles?.map((r) => r.user_id) || [];
    if (orgIds.length === 0) {
      return new Response(JSON.stringify({ success: true, emailsSent: 0, recipientCount: 0 }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profiles, error: profilesError } = await serviceClient
      .from("profiles")
      .select("id, full_name, email")
      .in("id", orgIds);

    if (profilesError) throw profilesError;

    let eligibleProfiles = (profiles || []).filter((p) => p.email?.trim());

    if (recipientFilter !== "all") {
      const { data: approvals } = await serviceClient
        .from("organization_approvals")
        .select("organization_id, status")
        .in("organization_id", orgIds);

      const approvalMap = new Map(
        (approvals || []).map((a) => [a.organization_id, a.status]),
      );

      eligibleProfiles = eligibleProfiles.filter((p) => {
        const status = approvalMap.get(p.id) || "pending";
        return recipientFilter === "approved" ? status === "approved" : status !== "approved";
      });
    }

    const messageHtml = textToHtml(message.trim());
    let emailsSent = 0;
    const errors: string[] = [];

    for (const org of eligibleProfiles) {
      const email = org.email!.trim();
      const orgName = org.full_name || "Organization";
      try {
        await sendZeptoEmail(
          email,
          orgName,
          subject.trim(),
          buildBroadcastHtml(orgName, messageHtml),
        );
        emailsSent++;
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : "Unknown error";
        errors.push(`${orgName} (${email}): ${errMsg}`);
      }
    }

    await serviceClient.from("admin_activity_logs").insert({
      admin_id: user.id,
      action_type: "org_broadcast_email",
      entity_type: "organization",
      description: `Sent broadcast email to ${emailsSent} organization(s)`,
      metadata: {
        subject: subject.trim(),
        recipientFilter,
        emailsSent,
        recipientCount: eligibleProfiles.length,
        failedCount: errors.length,
        errors: errors.length > 0 ? errors.slice(0, 20) : undefined,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        emailsSent,
        recipientCount: eligibleProfiles.length,
        failedCount: errors.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Internal server error";
    console.error("Error sending org broadcast:", error);
    return new Response(JSON.stringify({ error: errMsg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
