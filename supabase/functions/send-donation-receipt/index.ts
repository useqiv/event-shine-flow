import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const ZEPTOMAIL_API_KEY = Deno.env.get("ZEPTOMAIL_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DonationReceiptRequest {
  donationId: string;
  donorEmail: string;
  donorName: string;
  campaignTitle: string;
  amount: number;
  currency: string;
  donationDate: string;
  isAnonymous: boolean;
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

    const {
      donationId, donorEmail, donorName, campaignTitle,
      amount, currency, donationDate, isAnonymous,
    }: DonationReceiptRequest = await req.json();

    console.log(`Sending donation receipt to ${donorEmail} for donation ${donationId}`);

    const formattedAmount = `${currency} ${Number(amount).toLocaleString()}`;
    const formattedDate = new Date(donationDate).toLocaleDateString("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });

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
            <td style="padding-bottom: 20px;">
              <img src="https://useqiv.com/logo.png" alt="Useqiv" height="32" style="height: 32px; width: auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding-bottom: 24px;">
              <p style="margin: 0; font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Donation Receipt</p>
            </td>
          </tr>

          <tr>
            <td>
              <p style="margin: 0 0 16px; font-size: 16px; color: #111827; line-height: 1.5;">
                Dear ${isAnonymous ? "Generous Donor" : donorName || "Supporter"},
              </p>
              <p style="margin: 0 0 24px; font-size: 15px; color: #374151; line-height: 1.6;">
                Thank you for your donation to <strong>${campaignTitle}</strong>. Your support makes a real difference.
              </p>
            </td>
          </tr>

          <tr>
            <td style="border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; padding: 20px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Receipt ID</td>
                  <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right; font-family: monospace;">${donationId.slice(0, 8).toUpperCase()}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Date</td>
                  <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Campaign</td>
                  <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right;">${campaignTitle}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0 0; font-size: 16px; font-weight: 600; color: #111827; border-top: 1px solid #e5e7eb;">Amount</td>
                  <td style="padding: 12px 0 0; font-size: 20px; font-weight: 700; color: #111827; text-align: right; border-top: 1px solid #e5e7eb;">${formattedAmount}</td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding-top: 24px;">
              <p style="margin: 0; font-size: 13px; color: #6b7280; line-height: 1.6;">
                You'll receive updates about the campaign's progress. Questions? <a href="mailto:support@useqiv.com" style="color: #6b7280;">support@useqiv.com</a>
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
      donorEmail,
      donorName || "Donor",
      `Thank you for your donation to ${campaignTitle}!`,
      emailHtml
    );

    console.log("Donation receipt email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending donation receipt:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
