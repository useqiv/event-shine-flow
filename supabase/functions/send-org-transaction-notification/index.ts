import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const ZEPTOMAIL_API_KEY = Deno.env.get("ZEPTOMAIL_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TransactionNotificationRequest {
  type: 'vote' | 'ticket' | 'donation';
  organization_id: string;
  amount: number;
  currency: string;
  quantity?: number;
  contest_title?: string;
  contestant_name?: string;
  voter_name?: string;
  voter_email?: string;
  event_title?: string;
  ticket_type?: string;
  buyer_name?: string;
  buyer_email?: string;
  campaign_title?: string;
  donor_name?: string;
  donor_email?: string;
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

const buildRow = (label: string, value: string) =>
  `<tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">${label}</td><td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right; font-weight: 500;">${value}</td></tr>`;

const wrapNotification = (label: string, rows: string) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px;">
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
          <tr>
            <td style="padding-top: 20px;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">Transaction notifications · Useqiv</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!ZEPTOMAIL_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const data: TransactionNotificationRequest = await req.json();

    const { data: orgSettings } = await supabase
      .from('organization_settings')
      .select('notify_on_vote, notify_on_ticket, notify_on_donation, company_email')
      .eq('organization_id', data.organization_id)
      .maybeSingle();

    const notificationEnabled = 
      (data.type === 'vote' && orgSettings?.notify_on_vote) ||
      (data.type === 'ticket' && orgSettings?.notify_on_ticket) ||
      (data.type === 'donation' && orgSettings?.notify_on_donation);

    if (!notificationEnabled) {
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: 'Notifications not enabled' }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let orgEmail = orgSettings?.company_email;
    let orgName = 'Organization';

    if (!orgEmail) {
      const { data: profile } = await supabase
        .from('profiles').select('email, full_name').eq('id', data.organization_id).single();
      orgEmail = profile?.email;
      orgName = profile?.full_name || 'Organization';
    }

    if (!orgEmail) {
      return new Response(
        JSON.stringify({ success: false, error: 'No organization email found' }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let html: string;
    let subject: string;

    switch (data.type) {
      case 'vote':
        html = wrapNotification('New Vote',
          buildRow('Contest', data.contest_title || '') +
          buildRow('Contestant', data.contestant_name || '') +
          buildRow('Voter', data.voter_name || 'Anonymous') +
          buildRow('Votes', String(data.quantity || 1)) +
          buildRow('Amount', `${data.currency} ${data.amount.toLocaleString()}`)
        );
        subject = `New Vote: ${data.contestant_name} — ${data.contest_title}`;
        break;
      case 'ticket':
        html = wrapNotification('New Ticket Sale',
          buildRow('Event', data.event_title || '') +
          buildRow('Buyer', data.buyer_name || 'Anonymous') +
          buildRow('Type', data.ticket_type || 'Standard') +
          buildRow('Qty', String(data.quantity || 1)) +
          buildRow('Amount', `${data.currency} ${data.amount.toLocaleString()}`)
        );
        subject = `New Ticket Sale: ${data.event_title}`;
        break;
      case 'donation':
        html = wrapNotification('New Donation',
          buildRow('Campaign', data.campaign_title || '') +
          buildRow('Donor', data.donor_name || 'Anonymous') +
          buildRow('Amount', `${data.currency} ${data.amount.toLocaleString()}`)
        );
        subject = `New Donation: ${data.campaign_title}`;
        break;
      default:
        throw new Error(`Unknown transaction type: ${data.type}`);
    }

    const emailResponse = await sendZeptoEmail(orgEmail, orgName, subject, html);

    return new Response(
      JSON.stringify({ success: true, ...emailResponse }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error sending notification:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
