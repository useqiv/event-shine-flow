import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const ZEPTOMAIL_API_KEY = Deno.env.get("ZEPTOMAIL_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReceiptRequest {
  type: 'vote' | 'ticket' | 'wallet';
  user_email: string;
  user_name: string;
  amount: number;
  currency: string;
  quantity?: number;
  payment_method: string;
  transaction_ref: string;
  contest_title?: string;
  contestant_name?: string;
  event_title?: string;
  event_date?: string;
  event_venue?: string;
  ticket_type?: string;
  qr_code?: string;
  new_balance?: number;
  wallet_currency?: string;
  admin_fee?: number;
  total_charged?: number;
  total_credited?: number;
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

const buildRow = (label: string, value: string, bold = false) =>
  `<tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">${label}</td><td style="padding: 8px 0; color: #111827; font-size: ${bold ? '18px' : '14px'}; text-align: right; font-weight: ${bold ? '700' : '500'};">${value}</td></tr>`;

const wrapReceipt = (label: string, greeting: string, rows: string, refId: string, footerNote: string) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  @media only screen and (max-width: 600px) {
    .email-container { width: 100% !important; }
    .fluid-padding { padding: 24px 16px !important; }
  }
</style>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff;">
    <tr>
      <td align="center" style="padding: 40px 20px;" class="fluid-padding">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px;" class="email-container">
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
            <td>
              <p style="margin: 0 0 24px; font-size: 16px; color: #111827;">${greeting}</p>
            </td>
          </tr>
          <tr>
            <td style="border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; padding: 20px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 0; text-align: center;">
              <p style="margin: 0 0 4px; font-size: 12px; color: #6b7280;">Reference</p>
              <p style="margin: 0; font-size: 13px; font-family: monospace; color: #111827; word-break: break-all;">${refId}</p>
            </td>
          </tr>
          <tr>
            <td style="border-top: 1px solid #e5e7eb; padding-top: 20px;">
              <p style="margin: 0; font-size: 13px; color: #9ca3af; text-align: center; line-height: 1.5;">
                ${footerNote}<br>
                <a href="mailto:support@useqiv.com" style="color: #6b7280; text-decoration: none;">support@useqiv.com</a> · © ${new Date().getFullYear()} Useqiv
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

const generateVoteReceiptHtml = (data: ReceiptRequest) => {
  return wrapReceipt(
    'Vote Receipt',
    `Hi ${data.user_name}, your vote has been confirmed.`,
    buildRow('Contest', data.contest_title || '') +
    buildRow('Contestant', data.contestant_name || '') +
    buildRow('Votes', String(data.quantity || 1)) +
    buildRow('Payment', data.payment_method) +
    buildRow('Total', `${data.currency} ${data.amount.toLocaleString()}`, true),
    data.transaction_ref,
    'Thank you for supporting your favorite contestant.'
  );
};

const generateTicketReceiptHtml = (data: ReceiptRequest) => {
  let rows = buildRow('Event', data.event_title || '') +
    buildRow('Date', data.event_date || '') +
    buildRow('Venue', data.event_venue || '') +
    buildRow('Ticket', `${data.ticket_type || 'Standard'} × ${data.quantity || 1}`) +
    buildRow('Payment', data.payment_method) +
    buildRow('Total', `${data.currency} ${data.amount.toLocaleString()}`, true);

  if (data.qr_code) {
    rows += `
    <tr>
      <td colspan="2" style="padding: 16px 0 0; text-align: center; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0 0 12px; font-size: 13px; color: #6b7280;">Your ticket QR code</p>
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(data.qr_code)}" alt="QR Code" width="150" height="150" style="display: inline-block;"/>
        <p style="margin: 8px 0 0; font-size: 11px; font-family: monospace; color: #9ca3af; word-break: break-all;">${data.qr_code}</p>
      </td>
    </tr>`;
  }

  return wrapReceipt(
    'Ticket Receipt',
    `Hi ${data.user_name}, your tickets are confirmed.`,
    rows,
    data.transaction_ref,
    'Show your QR code at the venue entrance.'
  );
};

const generateWalletReceiptHtml = (data: ReceiptRequest) => {
  const adminFee = data.admin_fee || 0;
  const totalCharged = data.total_charged || (data.amount + adminFee);
  const totalCredited = data.total_credited || data.amount;

  let rows = buildRow('Wallet Credit', `${data.currency} ${data.amount.toLocaleString()}`) +
    buildRow('Admin Fee (3%)', `+ ${data.currency} ${adminFee.toLocaleString()}`) +
    buildRow('Payment', data.payment_method) +
    buildRow('Total Charged', `${data.currency} ${totalCharged.toLocaleString()}`, true) +
    buildRow('Credited', `${data.currency} ${totalCredited.toLocaleString()}`, true);

  if (data.new_balance !== undefined) {
    rows += buildRow('New Balance', `${data.wallet_currency || data.currency} ${data.new_balance.toLocaleString()}`, true);
  }

  return wrapReceipt(
    'Wallet Funding Receipt',
    `Hi ${data.user_name}, your wallet has been funded.`,
    rows,
    data.transaction_ref,
    'Thank you for funding your wallet.'
  );
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!ZEPTOMAIL_API_KEY) throw new Error("ZEPTOMAIL_API_KEY is not configured");

    const data: ReceiptRequest = await req.json();
    if (!data.user_email) throw new Error("user_email is required");
    if (!data.type) throw new Error("type is required");

    let html: string;
    let subject: string;

    if (data.type === 'vote') {
      html = generateVoteReceiptHtml(data);
      subject = `Vote Receipt — ${data.contest_title}`;
    } else if (data.type === 'ticket') {
      html = generateTicketReceiptHtml(data);
      subject = `Ticket Receipt — ${data.event_title}`;
    } else if (data.type === 'wallet') {
      html = generateWalletReceiptHtml(data);
      subject = `Wallet Funding Receipt — ${data.currency} ${data.total_credited?.toLocaleString() || data.amount.toLocaleString()}`;
    } else {
      throw new Error("Invalid receipt type");
    }

    const emailResponse = await sendZeptoEmail(data.user_email, data.user_name, subject, html);

    return new Response(
      JSON.stringify({ success: true, ...emailResponse }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error sending receipt:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
