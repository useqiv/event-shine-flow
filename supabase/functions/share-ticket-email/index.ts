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
      recipientEmail,
      recipientName,
      senderName,
      eventTitle,
      eventDate,
      eventTime,
      venue,
      ticketType,
      quantity,
      ticketCode,
      ticketUrl,
    }: ShareTicketRequest = await req.json();

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Ticket Shared</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 32px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🎫 Ticket Shared!</h1>
          </div>
          
          <!-- Content -->
          <div style="padding: 32px;">
            <p style="color: #374151; font-size: 16px; margin-bottom: 24px;">
              Hi ${recipientName || 'there'},<br><br>
              <strong>${senderName}</strong> has shared an event ticket with you!
            </p>
            
            <!-- Event Card -->
            <div style="background-color: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
              <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 20px;">${eventTitle}</h2>
              
              <div style="margin-bottom: 12px;">
                <span style="color: #6b7280; font-size: 14px;">📅 Date:</span>
                <span style="color: #111827; font-size: 14px; font-weight: 500; margin-left: 8px;">${eventDate}</span>
              </div>
              
              <div style="margin-bottom: 12px;">
                <span style="color: #6b7280; font-size: 14px;">🕐 Time:</span>
                <span style="color: #111827; font-size: 14px; font-weight: 500; margin-left: 8px;">${eventTime}</span>
              </div>
              
              <div style="margin-bottom: 12px;">
                <span style="color: #6b7280; font-size: 14px;">📍 Venue:</span>
                <span style="color: #111827; font-size: 14px; font-weight: 500; margin-left: 8px;">${venue}</span>
              </div>
              
              <div style="margin-bottom: 12px;">
                <span style="color: #6b7280; font-size: 14px;">🎟️ Ticket Type:</span>
                <span style="color: #111827; font-size: 14px; font-weight: 500; margin-left: 8px;">${ticketType} × ${quantity}</span>
              </div>
              
              <div style="border-top: 2px dashed #e5e7eb; margin-top: 16px; padding-top: 16px;">
                <span style="color: #6b7280; font-size: 12px;">Ticket Code:</span>
                <div style="font-family: monospace; color: #7c3aed; font-size: 14px; font-weight: 600; margin-top: 4px;">${ticketCode}</div>
              </div>
            </div>
            
            <!-- CTA Button -->
            <div style="text-align: center;">
              <a href="${ticketUrl}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                View Ticket Details
              </a>
            </div>
            
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 24px;">
              Present this ticket (or the QR code) at the event entrance for admission.
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              Powered by Useqiv • Your voting and events platform
            </p>
          </div>
        </div>
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
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
