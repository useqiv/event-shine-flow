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
}

function formatEventDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

function formatEventTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}

function buildReminderEmailHtml(
  userName: string, eventTitle: string, eventDate: string,
  venue: string, address: string | null, ticketType: string,
  ticketQuantity: number, ticketCode: string, hoursUntil: number
): string {
  const urgencyText = hoursUntil <= 2 ? "starting soon" : "tomorrow";

  return `
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
              <p style="margin: 0; font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Event Reminder</p>
            </td>
          </tr>

          <tr>
            <td>
              <p style="margin: 0 0 16px; font-size: 16px; color: #111827;">Hi ${userName},</p>
              <p style="margin: 0 0 24px; font-size: 15px; color: #374151; line-height: 1.6;">
                <strong>${eventTitle}</strong> is ${urgencyText}${hoursUntil <= 2 ? ` (in about ${hoursUntil} hour${hoursUntil > 1 ? 's' : ''})` : ''}.
              </p>
            </td>
          </tr>

          <tr>
            <td style="border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; padding: 20px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Date</td>
                  <td style="padding: 6px 0; color: #111827; font-size: 14px; text-align: right; font-weight: 500;">${formatEventDate(eventDate)}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Time</td>
                  <td style="padding: 6px 0; color: #111827; font-size: 14px; text-align: right; font-weight: 500;">${formatEventTime(eventDate)}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Venue</td>
                  <td style="padding: 6px 0; color: #111827; font-size: 14px; text-align: right; font-weight: 500;">${venue}</td>
                </tr>
                ${address ? `
                <tr>
                  <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Address</td>
                  <td style="padding: 6px 0; color: #111827; font-size: 14px; text-align: right; font-weight: 500;">${address}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Ticket</td>
                  <td style="padding: 6px 0; color: #111827; font-size: 14px; text-align: right; font-weight: 500;">${ticketType} × ${ticketQuantity}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Code</td>
                  <td style="padding: 6px 0; color: #111827; font-size: 14px; text-align: right; font-family: monospace; font-weight: 500;">${ticketCode}</td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 20px 0;">
              <p style="margin: 0; font-size: 14px; color: #374151; line-height: 1.5;">
                Have your ticket QR code ready for scanning. Arrive at least 15 minutes early.
              </p>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <a href="https://useqiv.com/my-tickets" style="display: inline-block; background-color: #111827; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 15px;">
                View My Tickets
              </a>
            </td>
          </tr>

          <tr>
            <td style="border-top: 1px solid #e5e7eb; padding-top: 20px;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">
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

    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const twentyThreeHoursFromNow = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const twentyFiveHoursFromNow = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    const { data: upcomingEvents, error: eventsError } = await supabase
      .from("events")
      .select("id, title, event_date, venue, address")
      .eq("is_active", true)
      .or(`and(event_date.gte.${oneHourFromNow.toISOString()},event_date.lte.${twoHoursFromNow.toISOString()}),and(event_date.gte.${twentyThreeHoursFromNow.toISOString()},event_date.lte.${twentyFiveHoursFromNow.toISOString()})`);

    if (eventsError) throw eventsError;

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
      const { data: tickets, error: ticketsError } = await supabase
        .from("tickets")
        .select(`id, quantity, ticket_code, user_id, ticket_type_id, ticket_types!inner(name), profiles!inner(email, full_name)`)
        .eq("event_id", event.id)
        .eq("status", "confirmed");

      if (ticketsError) {
        errors.push(`Failed to fetch tickets for event ${event.id}`);
        continue;
      }

      if (!tickets || tickets.length === 0) continue;

      const eventDate = new Date(event.event_date);
      const hoursUntil = Math.round((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60));

      for (const ticket of tickets) {
        const profile = ticket.profiles as any;
        const ticketType = ticket.ticket_types as any;
        if (!profile?.email) continue;

        try {
          const html = buildReminderEmailHtml(
            profile.full_name || "Attendee", event.title, event.event_date,
            event.venue, event.address, ticketType?.name || "General",
            ticket.quantity, ticket.ticket_code, hoursUntil
          );

          const subject = hoursUntil <= 2
            ? `Starting soon: ${event.title}`
            : `Tomorrow: ${event.title}`;

          await sendZeptoEmail(profile.email, profile.full_name || "Attendee", subject, html);
          emailsSent++;

          await supabase.from("notifications").insert({
            user_id: ticket.user_id,
            title: hoursUntil <= 2 ? "Event Starting Soon" : "Event Tomorrow",
            message: `${event.title} is ${hoursUntil <= 2 ? "starting soon" : "tomorrow"}.`,
            type: "event_reminder",
            reference_id: event.id,
          });
        } catch (emailError) {
          errors.push(`Failed to send to ${profile.email}`);
        }
      }
    }

    return new Response(
      JSON.stringify({ message: "Event reminders processed", emailsSent, errors: errors.length > 0 ? errors : undefined }),
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
