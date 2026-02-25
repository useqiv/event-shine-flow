import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const ZEPTOMAIL_API_KEY = Deno.env.get("ZEPTOMAIL_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TeamInviteRequest {
  email: string;
  name?: string;
  role: string;
  organizationName: string;
  inviterName: string;
}

const sendZeptoEmail = async (to: string, toName: string, subject: string, html: string) => {
  const apiKey = ZEPTOMAIL_API_KEY?.startsWith("Zoho-enczapikey") 
    ? ZEPTOMAIL_API_KEY 
    : `Zoho-enczapikey ${ZEPTOMAIL_API_KEY}`;

  const response = await fetch("https://api.zeptomail.com/v1.1/email", {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": apiKey,
    },
    body: JSON.stringify({
      from: { address: "noreply@useqiv.com", name: "Useqiv" },
      to: [{ email_address: { address: to, name: toName || "User" } }],
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

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!ZEPTOMAIL_API_KEY) {
      throw new Error("ZEPTOMAIL_API_KEY is not configured");
    }

    const { email, name, role, organizationName, inviterName }: TeamInviteRequest = await req.json();
    console.log(`Sending team invite to ${email} for organization ${organizationName}`);

    const roleCapabilities: Record<string, string[]> = {
      'Admin': ['Full access to all features', 'Manage team members', 'View analytics & reports', 'Process payouts'],
      'Manager': ['Create & manage events', 'View analytics & reports', 'Manage contestants', 'Handle customer support'],
      'Editor': ['Create & edit content', 'Manage events & contests', 'View basic reports', 'Upload media files'],
      'Viewer': ['View events & contests', 'Access basic reports', 'Monitor activity', 'Read-only access'],
    };

    const capabilities = roleCapabilities[role] || roleCapabilities['Viewer'];

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px;">

          <tr>
            <td style="padding-bottom: 24px;">
              <p style="margin: 0; font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Team Invitation</p>
            </td>
          </tr>

          <tr>
            <td>
              <p style="margin: 0 0 16px; font-size: 16px; color: #111827; line-height: 1.5;">
                Hello${name ? ` ${name}` : ''},
              </p>
              <p style="margin: 0 0 24px; font-size: 15px; color: #374151; line-height: 1.6;">
                <strong>${inviterName}</strong> invited you to join <strong>${organizationName}</strong> as <strong>${role}</strong>.
              </p>
            </td>
          </tr>

          <tr>
            <td style="border-top: 1px solid #e5e7eb; padding: 20px 0;">
              <p style="margin: 0 0 12px; font-size: 14px; font-weight: 600; color: #111827;">What you'll be able to do:</p>
              ${capabilities.map(cap => `
                <p style="margin: 0; padding: 6px 0; font-size: 14px; color: #374151; line-height: 1.5;">✓ ${cap}</p>
              `).join('')}
            </td>
          </tr>

          <tr>
            <td align="center" style="padding: 24px 0; border-top: 1px solid #e5e7eb;">
              <a href="https://useqiv.com/auth" style="display: inline-block; background-color: #111827; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 15px;">
                Accept Invitation
              </a>
              <p style="margin: 16px 0 0; font-size: 13px; color: #6b7280;">
                Sign up with <strong>${email}</strong> to join.
              </p>
            </td>
          </tr>

          <tr>
            <td style="border-top: 1px solid #e5e7eb; padding-top: 20px;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center; line-height: 1.5;">
                If you didn't expect this invitation, you can safely ignore this email.<br>
                © ${new Date().getFullYear()} Useqiv
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const emailResponse = await sendZeptoEmail(
      email,
      name || "User",
      `You've been invited to join ${organizationName}`,
      emailHtml
    );

    console.log("Team invite email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending team invite email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
