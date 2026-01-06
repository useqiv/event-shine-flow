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
  const response = await fetch("https://api.zeptomail.com/v1.1/email", {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": `Zoho-enczapikey ${ZEPTOMAIL_API_KEY}`,
    },
    body: JSON.stringify({
      from: { address: "noreply@useqiv.com", name: "Useqiv" },
      to: [{ email_address: { address: to, name: toName || "User" } }],
      subject,
      htmlbody: html,
    }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    console.error("ZeptoMail API error:", data);
    throw new Error(data.message || "Failed to send email");
  }
  
  return data;
};

const handler = async (req: Request): Promise<Response> => {
  console.log("Donation receipt email function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!ZEPTOMAIL_API_KEY) {
      throw new Error("ZEPTOMAIL_API_KEY is not configured");
    }

    const {
      donationId,
      donorEmail,
      donorName,
      campaignTitle,
      amount,
      currency,
      donationDate,
      isAnonymous,
    }: DonationReceiptRequest = await req.json();

    console.log(`Sending donation receipt to ${donorEmail} for donation ${donationId}`);

    const formattedAmount = `${currency} ${Number(amount).toLocaleString()}`;
    const formattedDate = new Date(donationDate).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Donation Receipt</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); padding: 32px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Thank You!</h1>
                    <p style="margin: 8px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">Your generosity makes a difference</p>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 32px;">
                    <p style="margin: 0 0 24px; color: #3f3f46; font-size: 16px; line-height: 1.6;">
                      Dear ${isAnonymous ? "Generous Donor" : donorName || "Supporter"},
                    </p>
                    
                    <p style="margin: 0 0 24px; color: #3f3f46; font-size: 16px; line-height: 1.6;">
                      Thank you for your generous donation to <strong>${campaignTitle}</strong>. Your support means the world to us and helps bring this campaign closer to its goal.
                    </p>
                    
                    <!-- Receipt Box -->
                    <table role="presentation" style="width: 100%; background-color: #fafafa; border-radius: 8px; margin: 24px 0;">
                      <tr>
                        <td style="padding: 24px;">
                          <h2 style="margin: 0 0 16px; color: #18181b; font-size: 18px; font-weight: 600;">Donation Receipt</h2>
                          
                          <table role="presentation" style="width: 100%;">
                            <tr>
                              <td style="padding: 8px 0; color: #71717a; font-size: 14px;">Receipt ID:</td>
                              <td style="padding: 8px 0; color: #18181b; font-size: 14px; text-align: right; font-family: monospace;">${donationId.slice(0, 8).toUpperCase()}</td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0; color: #71717a; font-size: 14px;">Date:</td>
                              <td style="padding: 8px 0; color: #18181b; font-size: 14px; text-align: right;">${formattedDate}</td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0; color: #71717a; font-size: 14px;">Campaign:</td>
                              <td style="padding: 8px 0; color: #18181b; font-size: 14px; text-align: right;">${campaignTitle}</td>
                            </tr>
                            <tr>
                              <td colspan="2" style="padding-top: 16px; border-top: 1px solid #e4e4e7;">
                                <table role="presentation" style="width: 100%;">
                                  <tr>
                                    <td style="color: #18181b; font-size: 18px; font-weight: 600;">Amount:</td>
                                    <td style="color: #8b5cf6; font-size: 24px; font-weight: bold; text-align: right;">${formattedAmount}</td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin: 24px 0 0; color: #71717a; font-size: 14px; line-height: 1.6;">
                      You'll receive updates about the campaign's progress. If you have any questions, please don't hesitate to reach out.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #fafafa; padding: 24px; text-align: center; border-top: 1px solid #e4e4e7;">
                    <p style="margin: 0 0 8px; color: #71717a; font-size: 14px;">
                      Thank you for using Useqiv
                    </p>
                    <p style="margin: 0; color: #a1a1aa; font-size: 12px;">
                      This is an automated receipt for your donation.
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
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
