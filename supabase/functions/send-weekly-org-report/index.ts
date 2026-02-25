import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const ZEPTOMAIL_API_KEY = Deno.env.get("ZEPTOMAIL_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrgStats {
  organization_id: string;
  org_name: string;
  org_email: string;
  votes_count: number;
  votes_revenue: number;
  tickets_count: number;
  tickets_revenue: number;
  donations_count: number;
  donations_amount: number;
  form_responses_count: number;
  active_contests: number;
  active_events: number;
  active_campaigns: number;
  active_forms: number;
}

const sendZeptoEmail = async (recipient: string, recipientName: string, subject: string, html: string) => {
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
      from: { address: "noreply@useqiv.com", name: "Useqiv Reports" },
      to: [{ email_address: { address: recipient, name: recipientName } }],
      subject,
      htmlbody: html,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("ZeptoMail error:", errorText);
    throw new Error(`Failed to send email: ${response.status}`);
  }

  return response.json();
};

const formatCurrency = (amount: number, currency = "NGN") => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency", currency, minimumFractionDigits: 0,
  }).format(amount);
};

const buildRow = (label: string, value: string) =>
  `<tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">${label}</td><td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right; font-weight: 500;">${value}</td></tr>`;

const generateReportEmail = (stats: OrgStats, weekStart: string, weekEnd: string) => {
  const hasActivity = stats.votes_count > 0 || stats.tickets_count > 0 || 
                      stats.donations_count > 0 || stats.form_responses_count > 0;

  const activeItems = [
    stats.active_contests > 0 ? `${stats.active_contests} contest${stats.active_contests > 1 ? 's' : ''}` : '',
    stats.active_events > 0 ? `${stats.active_events} event${stats.active_events > 1 ? 's' : ''}` : '',
    stats.active_campaigns > 0 ? `${stats.active_campaigns} campaign${stats.active_campaigns > 1 ? 's' : ''}` : '',
    stats.active_forms > 0 ? `${stats.active_forms} form${stats.active_forms > 1 ? 's' : ''}` : '',
  ].filter(Boolean).join(', ');

  return `
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
              <p style="margin: 0; font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Weekly Report</p>
              <p style="margin: 4px 0 0; font-size: 13px; color: #9ca3af;">${weekStart} — ${weekEnd}</p>
            </td>
          </tr>

          <tr>
            <td>
              <p style="margin: 0 0 16px; font-size: 16px; color: #111827;">Hi ${stats.org_name || 'there'},</p>
              <p style="margin: 0 0 8px; font-size: 15px; color: #374151; line-height: 1.6;">
                Here's your weekly summary.
              </p>
              ${activeItems ? `<p style="margin: 0 0 24px; font-size: 14px; color: #6b7280;">Active: ${activeItems}</p>` : ''}
            </td>
          </tr>

          ${hasActivity ? `
          <tr>
            <td style="border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; padding: 20px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${buildRow('Votes', `${stats.votes_count} (${formatCurrency(stats.votes_revenue)})`)}
                ${buildRow('Tickets', `${stats.tickets_count} (${formatCurrency(stats.tickets_revenue)})`)}
                ${buildRow('Donations', `${stats.donations_count} (${formatCurrency(stats.donations_amount)})`)}
                ${buildRow('Form Responses', String(stats.form_responses_count))}
              </table>
            </td>
          </tr>
          ` : `
          <tr>
            <td style="border-top: 1px solid #e5e7eb; padding: 20px 0;">
              <p style="margin: 0; font-size: 14px; color: #6b7280; text-align: center;">No transactions this week. Keep promoting your active entities.</p>
            </td>
          </tr>
          `}

          <tr>
            <td align="center" style="padding: 24px 0;">
              <a href="https://www.useqiv.com/org/dashboard" style="display: inline-block; background-color: #111827; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 15px;">
                View Dashboard
              </a>
            </td>
          </tr>

          <tr>
            <td style="border-top: 1px solid #e5e7eb; padding-top: 20px;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center; line-height: 1.5;">
                Automated weekly report · © ${new Date().getFullYear()} Useqiv
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
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!ZEPTOMAIL_API_KEY) throw new Error("ZEPTOMAIL_API_KEY is not configured");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const now = new Date();
    const weekEnd = now.toISOString().split('T')[0];
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const weekEndFormatted = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const weekStartFormatted = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const { data: activeOrgs, error: orgsError } = await supabase
      .from('profiles')
      .select('id, full_name, email, company_email')
      .eq('account_type', 'organization');

    if (orgsError) throw orgsError;

    let emailsSent = 0;
    const errors: string[] = [];

    for (const org of activeOrgs || []) {
      try {
        const [contestsRes, eventsRes, campaignsRes, formsRes] = await Promise.all([
          supabase.from('contests').select('id', { count: 'exact' }).eq('organization_id', org.id).eq('is_active', true),
          supabase.from('events').select('id', { count: 'exact' }).eq('organization_id', org.id).eq('is_active', true),
          supabase.from('campaigns').select('id', { count: 'exact' }).eq('creator_id', org.id).eq('status', 'active'),
          supabase.from('forms').select('id', { count: 'exact' }).eq('user_id', org.id).eq('is_active', true),
        ]);

        const activeContests = contestsRes.count || 0;
        const activeEvents = eventsRes.count || 0;
        const activeCampaigns = campaignsRes.count || 0;
        const activeForms = formsRes.count || 0;

        if (activeContests + activeEvents + activeCampaigns + activeForms === 0) continue;

        const { data: contestIds } = await supabase.from('contests').select('id').eq('organization_id', org.id);
        const contestIdList = contestIds?.map(c => c.id) || [];

        let votesCount = 0, votesRevenue = 0;
        if (contestIdList.length > 0) {
          const { data: contestants } = await supabase.from('contestants').select('id').in('contest_id', contestIdList);
          const contestantIds = contestants?.map(c => c.id) || [];
          if (contestantIds.length > 0) {
            const { data: votes, count } = await supabase
              .from('votes').select('amount_paid', { count: 'exact' })
              .in('contestant_id', contestantIds)
              .gte('created_at', weekStart).lte('created_at', weekEnd + 'T23:59:59')
              .in('status', ['confirmed', 'completed']);
            votesCount = count || 0;
            votesRevenue = votes?.reduce((sum, v) => sum + (v.amount_paid || 0), 0) || 0;
          }
        }

        const { data: eventIds } = await supabase.from('events').select('id').eq('organization_id', org.id);
        const eventIdList = eventIds?.map(e => e.id) || [];
        let ticketsCount = 0, ticketsRevenue = 0;
        if (eventIdList.length > 0) {
          const { data: tickets, count } = await supabase
            .from('tickets').select('amount_paid', { count: 'exact' })
            .in('event_id', eventIdList)
            .gte('created_at', weekStart).lte('created_at', weekEnd + 'T23:59:59')
            .in('status', ['active', 'used']);
          ticketsCount = count || 0;
          ticketsRevenue = tickets?.reduce((sum, t) => sum + (t.amount_paid || 0), 0) || 0;
        }

        const { data: campaignIds } = await supabase.from('campaigns').select('id').eq('creator_id', org.id);
        const campaignIdList = campaignIds?.map(c => c.id) || [];
        let donationsCount = 0, donationsAmount = 0;
        if (campaignIdList.length > 0) {
          const { data: donations, count } = await supabase
            .from('donations').select('amount', { count: 'exact' })
            .in('campaign_id', campaignIdList)
            .gte('created_at', weekStart).lte('created_at', weekEnd + 'T23:59:59')
            .eq('status', 'completed');
          donationsCount = count || 0;
          donationsAmount = donations?.reduce((sum, d) => sum + (d.amount || 0), 0) || 0;
        }

        const { data: formIds } = await supabase.from('forms').select('id').eq('user_id', org.id);
        const formIdList = formIds?.map(f => f.id) || [];
        let formResponsesCount = 0;
        if (formIdList.length > 0) {
          const { count } = await supabase
            .from('form_responses').select('id', { count: 'exact' })
            .in('form_id', formIdList)
            .gte('submitted_at', weekStart).lte('submitted_at', weekEnd + 'T23:59:59');
          formResponsesCount = count || 0;
        }

        const stats: OrgStats = {
          organization_id: org.id,
          org_name: org.full_name || 'Organization',
          org_email: org.company_email || org.email,
          votes_count: votesCount, votes_revenue: votesRevenue,
          tickets_count: ticketsCount, tickets_revenue: ticketsRevenue,
          donations_count: donationsCount, donations_amount: donationsAmount,
          form_responses_count: formResponsesCount,
          active_contests: activeContests, active_events: activeEvents,
          active_campaigns: activeCampaigns, active_forms: activeForms,
        };

        const emailHtml = generateReportEmail(stats, weekStartFormatted, weekEndFormatted);
        
        await sendZeptoEmail(
          stats.org_email,
          stats.org_name,
          `Weekly Report (${weekStartFormatted} — ${weekEndFormatted})`,
          emailHtml
        );

        emailsSent++;
      } catch (orgError: any) {
        errors.push(`${org.full_name}: ${orgError.message}`);
      }
    }

    return new Response(
      JSON.stringify({ message: "Weekly reports sent", emailsSent, errors: errors.length > 0 ? errors : undefined }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in weekly org report:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
