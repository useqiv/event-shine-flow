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
  // Vote specific
  contest_title?: string;
  contestant_name?: string;
  voter_name?: string;
  // Ticket specific
  event_title?: string;
  ticket_type?: string;
  buyer_name?: string;
  // Donation specific
  campaign_title?: string;
  donor_name?: string;
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
  
  if (!response.ok) {
    console.error("ZeptoMail API error:", data);
    throw new Error(data.message || "Failed to send email");
  }
  
  return data;
};

const generateVoteNotificationHtml = (data: TransactionNotificationRequest) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
  <div style="max-width: 500px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 24px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 20px;">🗳️ New Vote Received!</h1>
    </div>
    <div style="padding: 24px;">
      <p style="color: #374151; font-size: 15px; margin: 0 0 16px;">
        <strong>${data.voter_name || 'Someone'}</strong> just voted for <strong>${data.contestant_name}</strong> in <strong>${data.contest_title}</strong>
      </p>
      <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Votes</td>
            <td style="padding: 6px 0; color: #111827; font-size: 14px; text-align: right; font-weight: 600;">${data.quantity || 1}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Amount</td>
            <td style="padding: 6px 0; color: #7c3aed; font-size: 16px; text-align: right; font-weight: 700;">${data.currency} ${data.amount.toLocaleString()}</td>
          </tr>
        </table>
      </div>
      <p style="color: #9ca3af; font-size: 12px; margin: 0; text-align: center;">
        You're receiving this because transaction notifications are enabled for your organization.
      </p>
    </div>
  </div>
</body>
</html>
`;

const generateTicketNotificationHtml = (data: TransactionNotificationRequest) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
  <div style="max-width: 500px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #f97316 0%, #fb923c 100%); padding: 24px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 20px;">🎫 New Ticket Sale!</h1>
    </div>
    <div style="padding: 24px;">
      <p style="color: #374151; font-size: 15px; margin: 0 0 16px;">
        <strong>${data.buyer_name || 'Someone'}</strong> just purchased ${data.quantity || 1} ticket(s) for <strong>${data.event_title}</strong>
      </p>
      <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Ticket Type</td>
            <td style="padding: 6px 0; color: #111827; font-size: 14px; text-align: right; font-weight: 600;">${data.ticket_type || 'Standard'}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Quantity</td>
            <td style="padding: 6px 0; color: #111827; font-size: 14px; text-align: right; font-weight: 600;">${data.quantity || 1}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Amount</td>
            <td style="padding: 6px 0; color: #f97316; font-size: 16px; text-align: right; font-weight: 700;">${data.currency} ${data.amount.toLocaleString()}</td>
          </tr>
        </table>
      </div>
      <p style="color: #9ca3af; font-size: 12px; margin: 0; text-align: center;">
        You're receiving this because transaction notifications are enabled for your organization.
      </p>
    </div>
  </div>
</body>
</html>
`;

const generateDonationNotificationHtml = (data: TransactionNotificationRequest) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
  <div style="max-width: 500px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #10b981 0%, #34d399 100%); padding: 24px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 20px;">💚 New Donation!</h1>
    </div>
    <div style="padding: 24px;">
      <p style="color: #374151; font-size: 15px; margin: 0 0 16px;">
        <strong>${data.donor_name || 'Someone'}</strong> just donated to <strong>${data.campaign_title}</strong>
      </p>
      <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Amount</td>
            <td style="padding: 6px 0; color: #10b981; font-size: 16px; text-align: right; font-weight: 700;">${data.currency} ${data.amount.toLocaleString()}</td>
          </tr>
        </table>
      </div>
      <p style="color: #9ca3af; font-size: 12px; margin: 0; text-align: center;">
        You're receiving this because transaction notifications are enabled for your organization.
      </p>
    </div>
  </div>
</body>
</html>
`;

const handler = async (req: Request): Promise<Response> => {
  console.log("Org transaction notification function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!ZEPTOMAIL_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const data: TransactionNotificationRequest = await req.json();
    
    console.log("Transaction notification request:", JSON.stringify(data));

    // Get organization settings to check if notifications are enabled
    const { data: orgSettings, error: settingsError } = await supabase
      .from('organization_settings')
      .select('notify_on_vote, notify_on_ticket, notify_on_donation, company_email')
      .eq('organization_id', data.organization_id)
      .maybeSingle();

    if (settingsError) {
      console.error("Error fetching org settings:", settingsError);
      throw settingsError;
    }

    // Check if notifications are enabled for this type
    const notificationEnabled = 
      (data.type === 'vote' && orgSettings?.notify_on_vote) ||
      (data.type === 'ticket' && orgSettings?.notify_on_ticket) ||
      (data.type === 'donation' && orgSettings?.notify_on_donation);

    if (!notificationEnabled) {
      console.log(`Notifications not enabled for ${data.type} for org ${data.organization_id}`);
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: 'Notifications not enabled' }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get organization email (prefer company_email, fallback to profile email)
    let orgEmail = orgSettings?.company_email;
    let orgName = 'Organization';

    if (!orgEmail) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', data.organization_id)
        .single();
      
      orgEmail = profile?.email;
      orgName = profile?.full_name || 'Organization';
    }

    if (!orgEmail) {
      console.log("No email found for organization");
      return new Response(
        JSON.stringify({ success: false, error: 'No organization email found' }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate email based on type
    let html: string;
    let subject: string;

    switch (data.type) {
      case 'vote':
        html = generateVoteNotificationHtml(data);
        subject = `New Vote: ${data.contestant_name} - ${data.contest_title}`;
        break;
      case 'ticket':
        html = generateTicketNotificationHtml(data);
        subject = `New Ticket Sale: ${data.event_title}`;
        break;
      case 'donation':
        html = generateDonationNotificationHtml(data);
        subject = `New Donation: ${data.campaign_title}`;
        break;
      default:
        throw new Error(`Unknown transaction type: ${data.type}`);
    }

    console.log("Sending notification email to:", orgEmail);

    const emailResponse = await sendZeptoEmail(orgEmail, orgName, subject, html);

    console.log("Email sent successfully:", JSON.stringify(emailResponse));

    return new Response(
      JSON.stringify({ success: true, ...emailResponse }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error sending notification:", error.message, error.stack);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
