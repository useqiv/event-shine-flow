import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const ZEPTOMAIL_API_KEY = Deno.env.get("ZEPTOMAIL_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AdminNotificationRequest {
  type: "fraud_alert" | "payout_request" | "payout_approved" | "payout_rejected" | "new_organization" | "content_moderation";
  data: Record<string, any>;
  adminEmails?: string[];
}

const sendZeptoEmail = async (recipients: string[], subject: string, html: string) => {
  const toList = recipients.map(email => ({
    email_address: { address: email, name: "Admin" }
  }));

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
      from: { address: "noreply@useqiv.com", name: "Useqiv Admin" },
      to: toList,
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

const buildRow = (label: string, value: string) =>
  `<tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">${label}</td><td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right; font-weight: 500;">${value}</td></tr>`;

const wrapEmail = (label: string, rows: string, ctaUrl?: string, ctaText?: string) => `
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
              <p style="margin: 0; font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">${label}</p>
            </td>
          </tr>
          <tr>
            <td style="border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; padding: 20px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
            </td>
          </tr>
          ${ctaUrl ? `
          <tr>
            <td align="center" style="padding: 24px 0;">
              <a href="${ctaUrl}" style="display: inline-block; background-color: #111827; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 15px;">${ctaText || 'View in Dashboard'}</a>
            </td>
          </tr>
          ` : ''}
          <tr>
            <td><p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">© ${new Date().getFullYear()} Useqiv</p></td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const getEmailTemplate = (type: string, data: Record<string, any>) => {
  const templates: Record<string, { subject: string; html: string }> = {
    fraud_alert: {
      subject: `Fraud Alert: ${data.alert_type || "Suspicious Activity"}`,
      html: wrapEmail('Fraud Alert',
        buildRow('Type', data.alert_type) +
        buildRow('Severity', data.severity?.toUpperCase() || 'Unknown') +
        buildRow('Description', data.description || 'N/A') +
        buildRow('Entity', `${data.entity_type} (${data.entity_id})`) +
        buildRow('Time', new Date().toISOString()),
        data.dashboard_url, 'Review Alert'
      ),
    },
    payout_request: {
      subject: `Payout Request — ${data.amount} ${data.currency || "NGN"}`,
      html: wrapEmail('Payout Request',
        buildRow('Organization', data.organization_name || 'N/A') +
        buildRow('Amount', `${data.amount} ${data.currency || 'NGN'}`) +
        buildRow('Method', data.payment_method || 'N/A') +
        (data.payment_method === 'bank' ?
          buildRow('Bank', data.bank_name || '') + buildRow('Account', data.account_number || '') + buildRow('Name', data.account_name || '') :
          buildRow('USDT Address', data.usdt_address || '')),
        data.dashboard_url, 'Review Request'
      ),
    },
    payout_approved: {
      subject: `Payout Approved — ${data.amount} ${data.currency || "NGN"}`,
      html: wrapEmail('Payout Approved',
        buildRow('Amount', `${data.amount} ${data.currency || 'NGN'}`) +
        buildRow('Method', data.payment_method || 'N/A') +
        buildRow('Reference', data.reference_id || 'N/A'),
      ),
    },
    payout_rejected: {
      subject: `Payout Rejected — ${data.amount} ${data.currency || "NGN"}`,
      html: wrapEmail('Payout Rejected',
        buildRow('Amount', `${data.amount} ${data.currency || 'NGN'}`) +
        buildRow('Reason', data.rejection_reason || 'No reason provided'),
      ),
    },
    new_organization: {
      subject: `New Organization: ${data.company_name}`,
      html: wrapEmail('New Organization',
        buildRow('Company', data.company_name || '') +
        buildRow('Email', data.email || '') +
        buildRow('Phone', data.phone || 'N/A'),
        data.dashboard_url, 'Review Application'
      ),
    },
    content_moderation: {
      subject: `Content Review — ${data.content_type}`,
      html: wrapEmail('Content Pending Review',
        buildRow('Type', data.content_type || '') +
        buildRow('Entity', data.entity_type || '') +
        buildRow('Submitted By', data.submitted_by || 'N/A'),
        data.dashboard_url, 'Review Content'
      ),
    },
  };

  return templates[type] || { subject: "Admin Notification", html: wrapEmail('Notification', `<tr><td style="padding: 8px 0; color: #374151; font-size: 14px;">${JSON.stringify(data)}</td></tr>`) };
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!ZEPTOMAIL_API_KEY) {
      throw new Error("ZEPTOMAIL_API_KEY is not configured");
    }

    const { type, data, adminEmails }: AdminNotificationRequest = await req.json();

    let recipients = adminEmails;
    if (!recipients || recipients.length === 0) {
      const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const { data: adminUsers } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
      if (adminUsers && adminUsers.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("email").in("id", adminUsers.map(u => u.user_id));
        recipients = profiles?.map(p => p.email).filter(Boolean) || [];
      }
    }

    if (!recipients || recipients.length === 0) {
      return new Response(JSON.stringify({ success: true, message: "No recipients found" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const template = getEmailTemplate(type, data);
    const emailResponse = await sendZeptoEmail(recipients, template.subject, template.html);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error sending admin notification:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
