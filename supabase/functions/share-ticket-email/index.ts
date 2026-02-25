import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ZEPTOMAIL_API_KEY = Deno.env.get("ZEPTOMAIL_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ShareTicketRequest {
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  venue: string;
  ticketType: string;
  quantity: number;
  ticketCode: string;
  ticketUrl: string;
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

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!ZEPTOMAIL_API_KEY) {
      throw new Error("ZEPTOMAIL_API_KEY is not configured");
    }

    const {
      recipientEmail, recipientName, senderName, eventTitle,
      eventDate, eventTime, venue, ticketType, quantity,
      ticketCode, ticketUrl,
    }: ShareTicketRequest = await req.json();

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
              <p style="margin: 0; font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Ticket Shared</p>
            </td>
          </tr>

          <tr>
            <td>
              <p style="margin: 0 0 16px; font-size: 16px; color: #111827; line-height: 1.5;">
                Hi ${recipientName || 'there'},
              </p>
              <p style="margin: 0 0 24px; font-size: 15px; color: #374151; line-height: 1.6;">
                <strong>${senderName}</strong> shared an event ticket with you.
              </p>
            </td>
          </tr>

          <tr>
            <td style="border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; padding: 20px 0;">
              <p style="margin: 0 0 12px; font-size: 18px; font-weight: 600; color: #111827;">${eventTitle}</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Date</td>
                  <td style="padding: 6px 0; color: #111827; font-size: 14px; text-align: right; font-weight: 500;">${eventDate}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Time</td>
                  <td style="padding: 6px 0; color: #111827; font-size: 14px; text-align: right; font-weight: 500;">${eventTime}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Venue</td>
                  <td style="padding: 6px 0; color: #111827; font-size: 14px; text-align: right; font-weight: 500;">${venue}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Ticket</td>
                  <td style="padding: 6px 0; color: #111827; font-size: 14px; text-align: right; font-weight: 500;">${ticketType} × ${quantity}</td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 20px 0; text-align: center;">
              <p style="margin: 0 0 4px; font-size: 12px; color: #6b7280;">Ticket code</p>
              <p style="margin: 0; font-size: 14px; font-family: monospace; color: #111827; font-weight: 600;">${ticketCode}</p>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <a href="${ticketUrl}" style="display: inline-block; background-color: #111827; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 15px;">
                View Ticket
              </a>
            </td>
          </tr>

          <tr>
            <td style="border-top: 1px solid #e5e7eb; padding-top: 20px;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">
                Present this ticket at the event entrance for admission.
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
      recipientEmail,
      recipientName || "User",
      `${senderName} shared a ticket with you: ${eventTitle}`,
      emailHtml
    );

    console.log("Ticket shared via email successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in share-ticket-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
