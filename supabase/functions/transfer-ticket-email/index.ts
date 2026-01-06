import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const ZEPTOMAIL_API_KEY = Deno.env.get("ZEPTOMAIL_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TransferEmailRequest {
  recipientEmail: string;
  recipientName?: string;
  senderName: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  venue: string;
  ticketType: string;
  quantity: number;
  transferCode: string;
  acceptUrl: string;
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
    throw new Error(`ZeptoMail error: ${response.status}`);
  }
  const data = JSON.parse(responseText);
  if (!response.ok) throw new Error(data.message || "Failed to send email");
  return data;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!ZEPTOMAIL_API_KEY) {
      throw new Error("ZEPTOMAIL_API_KEY is not configured");
    }

    const {
      recipientEmail,
      recipientName,
      senderName,
      eventTitle,
      eventDate,
      eventTime,
      venue,
      ticketType,
      quantity,
      transferCode,
      acceptUrl,
    }: TransferEmailRequest = await req.json();

    console.log("Sending transfer email to:", recipientEmail);

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Ticket Transfer</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; padding: 32px; text-align: center;">
            <h1 style="margin: 0 0 8px 0; font-size: 24px;">🎟️ Ticket Transfer</h1>
            <p style="margin: 0; opacity: 0.9;">You've received a ticket!</p>
          </div>
          
          <div style="padding: 32px;">
            <p style="font-size: 16px; color: #374151; margin: 0 0 24px 0;">
              Hi${recipientName ? ` ${recipientName}` : ''},<br><br>
              <strong>${senderName}</strong> wants to transfer a ticket to you!
            </p>
            
            <div style="background: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
              <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #111827;">${eventTitle}</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Ticket Type</td>
                  <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right; font-weight: 600;">${ticketType} × ${quantity}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Date</td>
                  <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right; font-weight: 600;">${eventDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Time</td>
                  <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right; font-weight: 600;">${eventTime}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Venue</td>
                  <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right; font-weight: 600;">${venue}</td>
                </tr>
              </table>
            </div>
            
            <div style="text-align: center; margin-bottom: 24px;">
              <p style="font-size: 14px; color: #6b7280; margin: 0 0 8px 0;">Your transfer code:</p>
              <p style="font-size: 24px; font-weight: bold; color: #7c3aed; font-family: monospace; margin: 0; letter-spacing: 2px;">${transferCode}</p>
            </div>
            
            <a href="${acceptUrl}" style="display: block; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; text-align: center; font-weight: 600; font-size: 16px;">
              Accept Ticket Transfer
            </a>
            
            <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 24px 0 0 0;">
              This transfer expires in 48 hours. If you don't have an account, you'll need to sign up first.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await sendZeptoEmail(
      recipientEmail,
      recipientName || "User",
      `${senderName} wants to transfer a ticket to you! - ${eventTitle}`,
      emailHtml
    );

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Error sending transfer email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
