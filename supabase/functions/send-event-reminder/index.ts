import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const ZEPTOMAIL_API_KEY = Deno.env.get("ZEPTOMAIL_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sendZeptoEmail(to: string, toName: string, subject: string, html: string) {
  const response = await fetch("https://api.zeptomail.com/v1.1/email", {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": `Zoho-enczapikey ${ZEPTOMAIL_API_KEY}`,
    },
    body: JSON.stringify({
      from: { address: "noreply@useqiv.com", name: "Useqiv" },
      to: [{ email_address: { address: to, name: toName } }],
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
}

function formatEventDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatEventTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function buildReminderEmailHtml(
  userName: string,
  eventTitle: string,
  eventDate: string,
  venue: string,
  address: string | null,
  ticketType: string,
  ticketQuantity: number,
  ticketCode: string,
  hoursUntil: number
): string {
  const urgencyText = hoursUntil <= 2 ? "Starting Soon!" : "Tomorrow!";
  const urgencyColor = hoursUntil <= 2 ? "#ef4444" : "#8b5cf6";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); padding: 40px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">🎉 Your Event is ${urgencyText}</h1>
                  <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Don't forget to attend!</p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">Hi ${userName},</p>
                  
                  <p style="color: #374151; font-size: 16px; margin: 0 0 30px 0;">
                    This is a friendly reminder that <strong>${eventTitle}</strong> is happening ${hoursUntil <= 2 ? "in about " + hoursUntil + " hour(s)" : "tomorrow"}!
                  </p>
                  
                  <!-- Event Details Card -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                    <tr>
                      <td>
                        <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 20px;">${eventTitle}</h2>
                        
                        <table cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="padding: 8px 0;">
                              <span style="color: #6b7280; font-size: 14px;">📅 Date:</span>
                              <span style="color: #111827; font-size: 14px; font-weight: 600; margin-left: 8px;">${formatEventDate(eventDate)}</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0;">
                              <span style="color: #6b7280; font-size: 14px;">⏰ Time:</span>
                              <span style="color: #111827; font-size: 14px; font-weight: 600; margin-left: 8px;">${formatEventTime(eventDate)}</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0;">
                              <span style="color: #6b7280; font-size: 14px;">📍 Venue:</span>
                              <span style="color: #111827; font-size: 14px; font-weight: 600; margin-left: 8px;">${venue}</span>
                            </td>
                          </tr>
                          ${address ? `
                          <tr>
                            <td style="padding: 8px 0;">
                              <span style="color: #6b7280; font-size: 14px;">🏠 Address:</span>
                              <span style="color: #111827; font-size: 14px; margin-left: 8px;">${address}</span>
                            </td>
                          </tr>
                          ` : ""}
                        </table>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Ticket Details -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #faf5ff; border: 2px solid #e9d5ff; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                    <tr>
                      <td>
                        <h3 style="color: #7c3aed; margin: 0 0 12px 0; font-size: 16px;">🎫 Your Ticket</h3>
                        <p style="color: #374151; margin: 0; font-size: 14px;">
                          <strong>${ticketType}</strong> × ${ticketQuantity}<br>
                          <span style="color: #6b7280;">Code: ${ticketCode}</span>
                        </p>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- CTA Button -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" style="padding: 20px 0;">
                        <a href="https://useqiv.com/my-tickets" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                          View My Tickets
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Tips -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0fdf4; border-radius: 8px; padding: 16px; margin-top: 20px;">
                    <tr>
                      <td>
                        <p style="color: #166534; margin: 0; font-size: 14px;">
                          💡 <strong>Quick Tips:</strong><br>
                          • Have your ticket QR code ready for scanning<br>
                          • Arrive at least 15 minutes early<br>
                          • Check the event page for any last-minute updates
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="color: #6b7280; font-size: 14px; margin: 0;">
                    Need help? Contact us at <a href="mailto:support@useqiv.com" style="color: #8b5cf6;">support@useqiv.com</a>
                  </p>
                  <p style="color: #9ca3af; font-size: 12px; margin: 16px 0 0 0;">
                    © 2024 Useqiv. All rights reserved.
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
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!ZEPTOMAIL_API_KEY) {
      throw new Error("ZEPTOMAIL_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Get events happening in the next 24 hours and 1 hour
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const twentyThreeHoursFromNow = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const twentyFiveHoursFromNow = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    // Query for events in the reminder windows
    const { data: upcomingEvents, error: eventsError } = await supabase
      .from("events")
      .select("id, title, event_date, venue, address")
      .eq("is_active", true)
      .or(`and(event_date.gte.${oneHourFromNow.toISOString()},event_date.lte.${twoHoursFromNow.toISOString()}),and(event_date.gte.${twentyThreeHoursFromNow.toISOString()},event_date.lte.${twentyFiveHoursFromNow.toISOString()})`);

    if (eventsError) {
      console.error("Error fetching events:", eventsError);
      throw eventsError;
    }

    console.log(`Found ${upcomingEvents?.length || 0} events for reminders`);

    if (!upcomingEvents || upcomingEvents.length === 0) {
      return new Response(
        JSON.stringify({ message: "No events requiring reminders", emailsSent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let emailsSent = 0;
    const errors: string[] = [];

    for (const event of upcomingEvents) {
      // Get tickets for this event
      const { data: tickets, error: ticketsError } = await supabase
        .from("tickets")
        .select(`
          id,
          quantity,
          ticket_code,
          user_id,
          ticket_type_id,
          ticket_types!inner(name),
          profiles!inner(email, full_name)
        `)
        .eq("event_id", event.id)
        .eq("status", "confirmed");

      if (ticketsError) {
        console.error(`Error fetching tickets for event ${event.id}:`, ticketsError);
        errors.push(`Failed to fetch tickets for event ${event.id}`);
        continue;
      }

      if (!tickets || tickets.length === 0) {
        console.log(`No confirmed tickets for event ${event.id}`);
        continue;
      }

      // Calculate hours until event
      const eventDate = new Date(event.event_date);
      const hoursUntil = Math.round((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60));

      for (const ticket of tickets) {
        const profile = ticket.profiles as any;
        const ticketType = ticket.ticket_types as any;

        if (!profile?.email) {
          console.log(`No email for ticket ${ticket.id}`);
          continue;
        }

        try {
          const html = buildReminderEmailHtml(
            profile.full_name || "Attendee",
            event.title,
            event.event_date,
            event.venue,
            event.address,
            ticketType?.name || "General",
            ticket.quantity,
            ticket.ticket_code,
            hoursUntil
          );

          const subject = hoursUntil <= 2
            ? `⏰ Starting Soon: ${event.title}`
            : `🎉 Tomorrow: ${event.title}`;

          await sendZeptoEmail(
            profile.email,
            profile.full_name || "Attendee",
            subject,
            html
          );

          emailsSent++;
          console.log(`Sent reminder to ${profile.email} for event ${event.title}`);

          // Create notification
          await supabase.from("notifications").insert({
            user_id: ticket.user_id,
            title: hoursUntil <= 2 ? "Event Starting Soon!" : "Event Tomorrow!",
            message: `Don't forget: ${event.title} is ${hoursUntil <= 2 ? "starting soon" : "tomorrow"}!`,
            type: "event_reminder",
            reference_id: event.id,
          });
        } catch (emailError) {
          console.error(`Failed to send email to ${profile.email}:`, emailError);
          errors.push(`Failed to send to ${profile.email}`);
        }
      }
    }

    return new Response(
      JSON.stringify({
        message: "Event reminders processed",
        emailsSent,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-event-reminder function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
