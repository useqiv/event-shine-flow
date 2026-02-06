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
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
};

const generateReportEmail = (stats: OrgStats, weekStart: string, weekEnd: string) => {
  const hasActivity = stats.votes_count > 0 || stats.tickets_count > 0 || 
                      stats.donations_count > 0 || stats.form_responses_count > 0;

  const activeEntitiesBadges = [
    stats.active_contests > 0 ? `<td style="padding: 4px;"><span style="display: inline-block; background: #7c3aed; color: white; padding: 6px 14px; border-radius: 20px; font-size: 13px; white-space: nowrap;">${stats.active_contests} Contest${stats.active_contests > 1 ? 's' : ''}</span></td>` : '',
    stats.active_events > 0 ? `<td style="padding: 4px;"><span style="display: inline-block; background: #f97316; color: white; padding: 6px 14px; border-radius: 20px; font-size: 13px; white-space: nowrap;">${stats.active_events} Event${stats.active_events > 1 ? 's' : ''}</span></td>` : '',
    stats.active_campaigns > 0 ? `<td style="padding: 4px;"><span style="display: inline-block; background: #22c55e; color: white; padding: 6px 14px; border-radius: 20px; font-size: 13px; white-space: nowrap;">${stats.active_campaigns} Campaign${stats.active_campaigns > 1 ? 's' : ''}</span></td>` : '',
    stats.active_forms > 0 ? `<td style="padding: 4px;"><span style="display: inline-block; background: #3b82f6; color: white; padding: 6px 14px; border-radius: 20px; font-size: 13px; white-space: nowrap;">${stats.active_forms} Form${stats.active_forms > 1 ? 's' : ''}</span></td>` : '',
  ].filter(Boolean).join('');

  return `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>Weekly Activity Report</title>
  <style>
    * { box-sizing: border-box; }
    body, table, td, p, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f9fafb; }
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; }
      .fluid-padding { padding: 20px 16px !important; }
      .stat-cell { display: block !important; width: 100% !important; padding: 8px 0 !important; }
      .stat-box { margin-bottom: 12px !important; }
      .mobile-stack { display: block !important; width: 100% !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <div style="display: none; max-height: 0; overflow: hidden;">Your weekly activity summary: ${stats.votes_count} votes, ${stats.tickets_count} tickets, ${stats.donations_count} donations</div>
  
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f9fafb;">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px;" class="email-container">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 32px 24px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; line-height: 1.3;">📊 Weekly Activity Report</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 15px;">${weekStart} - ${weekEnd}</p>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="background-color: #ffffff; padding: 32px 24px; border-radius: 0 0 12px 12px;" class="fluid-padding">
              <p style="color: #374151; font-size: 16px; margin: 0 0 20px; line-height: 1.5;">Hi ${stats.org_name || 'there'},</p>
              
              <p style="color: #6b7280; font-size: 15px; margin: 0 0 24px; line-height: 1.6;">
                Here's your weekly summary of activity across your active contests, events, campaigns, and forms.
              </p>

              <!-- Active Entities -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #f3f4f6; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="margin: 0 0 12px; color: #374151; font-size: 13px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Active Entities</p>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>${activeEntitiesBadges}</tr>
                    </table>
                  </td>
                </tr>
              </table>

              ${hasActivity ? `
              <!-- Stats Grid -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px;">
                <tr>
                  <td width="50%" style="padding: 6px;" class="stat-cell">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 10px;" class="stat-box">
                      <tr>
                        <td style="padding: 20px; text-align: center;">
                          <p style="font-size: 32px; font-weight: 700; color: #7c3aed; margin: 0;">${stats.votes_count}</p>
                          <p style="color: #6b7280; font-size: 13px; margin: 6px 0 0;">Votes Received</p>
                          <p style="color: #7c3aed; font-size: 15px; font-weight: 600; margin: 6px 0 0;">${formatCurrency(stats.votes_revenue)}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td width="50%" style="padding: 6px;" class="stat-cell">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 10px;" class="stat-box">
                      <tr>
                        <td style="padding: 20px; text-align: center;">
                          <p style="font-size: 32px; font-weight: 700; color: #f97316; margin: 0;">${stats.tickets_count}</p>
                          <p style="color: #6b7280; font-size: 13px; margin: 6px 0 0;">Tickets Sold</p>
                          <p style="color: #f97316; font-size: 15px; font-weight: 600; margin: 6px 0 0;">${formatCurrency(stats.tickets_revenue)}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td width="50%" style="padding: 6px;" class="stat-cell">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px;" class="stat-box">
                      <tr>
                        <td style="padding: 20px; text-align: center;">
                          <p style="font-size: 32px; font-weight: 700; color: #22c55e; margin: 0;">${stats.donations_count}</p>
                          <p style="color: #6b7280; font-size: 13px; margin: 6px 0 0;">Donations</p>
                          <p style="color: #22c55e; font-size: 15px; font-weight: 600; margin: 6px 0 0;">${formatCurrency(stats.donations_amount)}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td width="50%" style="padding: 6px;" class="stat-cell">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px;" class="stat-box">
                      <tr>
                        <td style="padding: 20px; text-align: center;">
                          <p style="font-size: 32px; font-weight: 700; color: #3b82f6; margin: 0;">${stats.form_responses_count}</p>
                          <p style="color: #6b7280; font-size: 13px; margin: 6px 0 0;">Form Responses</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              ` : `
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #fefce8; border: 1px solid #fef08a; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px; text-align: center;">
                    <p style="color: #854d0e; margin: 0; font-size: 15px;">📭 No transactions this week. Keep promoting your active entities!</p>
                  </td>
                </tr>
              </table>
              `}

              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="https://event-shine-flow.lovable.app/org/dashboard" style="display: inline-block; background: #7c3aed; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; min-width: 200px; text-align: center;">View Full Dashboard</a>
                  </td>
                </tr>
              </table>

              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
              
              <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0; line-height: 1.6;">
                You're receiving this because you have active entities on Useqiv.<br>
                This is an automated weekly report.
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
  console.log("Weekly org report function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!ZEPTOMAIL_API_KEY) {
      throw new Error("ZEPTOMAIL_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const now = new Date();
    const weekEnd = now.toISOString().split('T')[0];
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const weekEndFormatted = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const weekStartFormatted = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const { data: activeOrgs, error: orgsError } = await supabase
      .from('profiles')
      .select(`id, full_name, email, company_email`)
      .eq('account_type', 'organization');

    if (orgsError) {
      console.error("Error fetching organizations:", orgsError);
      throw orgsError;
    }

    console.log(`Found ${activeOrgs?.length || 0} organizations`);

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

        if (activeContests + activeEvents + activeCampaigns + activeForms === 0) {
          console.log(`Skipping ${org.full_name} - no active entities`);
          continue;
        }

        const { data: contestIds } = await supabase.from('contests').select('id').eq('organization_id', org.id);
        const contestIdList = contestIds?.map(c => c.id) || [];

        let votesCount = 0;
        let votesRevenue = 0;
        if (contestIdList.length > 0) {
          const { data: contestants } = await supabase.from('contestants').select('id').in('contest_id', contestIdList);
          const contestantIds = contestants?.map(c => c.id) || [];
          
          if (contestantIds.length > 0) {
            const { data: votes, count } = await supabase
              .from('votes')
              .select('amount_paid', { count: 'exact' })
              .in('contestant_id', contestantIds)
              .gte('created_at', weekStart)
              .lte('created_at', weekEnd + 'T23:59:59')
              .in('status', ['confirmed', 'completed']);
            
            votesCount = count || 0;
            votesRevenue = votes?.reduce((sum, v) => sum + (v.amount_paid || 0), 0) || 0;
          }
        }

        const { data: eventIds } = await supabase.from('events').select('id').eq('organization_id', org.id);
        const eventIdList = eventIds?.map(e => e.id) || [];
        
        let ticketsCount = 0;
        let ticketsRevenue = 0;
        if (eventIdList.length > 0) {
          const { data: tickets, count } = await supabase
            .from('tickets')
            .select('amount_paid', { count: 'exact' })
            .in('event_id', eventIdList)
            .gte('created_at', weekStart)
            .lte('created_at', weekEnd + 'T23:59:59')
            .in('status', ['active', 'used']);
          
          ticketsCount = count || 0;
          ticketsRevenue = tickets?.reduce((sum, t) => sum + (t.amount_paid || 0), 0) || 0;
        }

        const { data: campaignIds } = await supabase.from('campaigns').select('id').eq('creator_id', org.id);
        const campaignIdList = campaignIds?.map(c => c.id) || [];
        
        let donationsCount = 0;
        let donationsAmount = 0;
        if (campaignIdList.length > 0) {
          const { data: donations, count } = await supabase
            .from('donations')
            .select('amount', { count: 'exact' })
            .in('campaign_id', campaignIdList)
            .gte('created_at', weekStart)
            .lte('created_at', weekEnd + 'T23:59:59')
            .eq('status', 'completed');
          
          donationsCount = count || 0;
          donationsAmount = donations?.reduce((sum, d) => sum + (d.amount || 0), 0) || 0;
        }

        const { data: formIds } = await supabase.from('forms').select('id').eq('user_id', org.id);
        const formIdList = formIds?.map(f => f.id) || [];
        
        let formResponsesCount = 0;
        if (formIdList.length > 0) {
          const { count } = await supabase
            .from('form_responses')
            .select('id', { count: 'exact' })
            .in('form_id', formIdList)
            .gte('submitted_at', weekStart)
            .lte('submitted_at', weekEnd + 'T23:59:59');
          
          formResponsesCount = count || 0;
        }

        const stats: OrgStats = {
          organization_id: org.id,
          org_name: org.full_name || 'Organization',
          org_email: org.company_email || org.email,
          votes_count: votesCount,
          votes_revenue: votesRevenue,
          tickets_count: ticketsCount,
          tickets_revenue: ticketsRevenue,
          donations_count: donationsCount,
          donations_amount: donationsAmount,
          form_responses_count: formResponsesCount,
          active_contests: activeContests,
          active_events: activeEvents,
          active_campaigns: activeCampaigns,
          active_forms: activeForms,
        };

        const emailHtml = generateReportEmail(stats, weekStartFormatted, weekEndFormatted);
        
        await sendZeptoEmail(
          stats.org_email,
          stats.org_name,
          `📊 Your Weekly Activity Report (${weekStartFormatted} - ${weekEndFormatted})`,
          emailHtml
        );

        console.log(`Sent weekly report to ${stats.org_email}`);
        emailsSent++;

      } catch (orgError: any) {
        console.error(`Error processing org ${org.id}:`, orgError);
        errors.push(`${org.full_name}: ${orgError.message}`);
      }
    }

    console.log(`Weekly reports complete. Sent: ${emailsSent}, Errors: ${errors.length}`);

    return new Response(
      JSON.stringify({ success: true, emailsSent, errors: errors.length > 0 ? errors : undefined }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error sending weekly reports:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
