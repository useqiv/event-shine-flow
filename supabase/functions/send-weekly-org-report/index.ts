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

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
      <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">📊 Weekly Activity Report</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">${weekStart} - ${weekEnd}</p>
      </div>
      
      <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <p style="color: #374151; margin-bottom: 20px;">Hi ${stats.org_name || "there"},</p>
        
        <p style="color: #6b7280; margin-bottom: 25px;">
          Here's your weekly summary of activity across your active contests, events, campaigns, and forms.
        </p>

        <!-- Active Entities Summary -->
        <div style="background: #f3f4f6; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 10px 0; color: #374151; font-size: 14px; text-transform: uppercase;">Active Entities</h3>
          <div style="display: flex; flex-wrap: wrap; gap: 10px;">
            ${stats.active_contests > 0 ? `<span style="background: #7c3aed; color: white; padding: 4px 12px; border-radius: 20px; font-size: 13px;">${stats.active_contests} Contest${stats.active_contests > 1 ? 's' : ''}</span>` : ''}
            ${stats.active_events > 0 ? `<span style="background: #f97316; color: white; padding: 4px 12px; border-radius: 20px; font-size: 13px;">${stats.active_events} Event${stats.active_events > 1 ? 's' : ''}</span>` : ''}
            ${stats.active_campaigns > 0 ? `<span style="background: #22c55e; color: white; padding: 4px 12px; border-radius: 20px; font-size: 13px;">${stats.active_campaigns} Campaign${stats.active_campaigns > 1 ? 's' : ''}</span>` : ''}
            ${stats.active_forms > 0 ? `<span style="background: #3b82f6; color: white; padding: 4px 12px; border-radius: 20px; font-size: 13px;">${stats.active_forms} Form${stats.active_forms > 1 ? 's' : ''}</span>` : ''}
          </div>
        </div>

        ${hasActivity ? `
        <!-- Stats Grid -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px;">
          <tr>
            <td width="50%" style="padding: 10px;">
              <div style="background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 8px; padding: 15px; text-align: center;">
                <div style="font-size: 28px; font-weight: bold; color: #7c3aed;">${stats.votes_count}</div>
                <div style="color: #6b7280; font-size: 13px;">Votes Received</div>
                <div style="color: #7c3aed; font-size: 14px; font-weight: 500; margin-top: 5px;">${formatCurrency(stats.votes_revenue)}</div>
              </div>
            </td>
            <td width="50%" style="padding: 10px;">
              <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 15px; text-align: center;">
                <div style="font-size: 28px; font-weight: bold; color: #f97316;">${stats.tickets_count}</div>
                <div style="color: #6b7280; font-size: 13px;">Tickets Sold</div>
                <div style="color: #f97316; font-size: 14px; font-weight: 500; margin-top: 5px;">${formatCurrency(stats.tickets_revenue)}</div>
              </div>
            </td>
          </tr>
          <tr>
            <td width="50%" style="padding: 10px;">
              <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 15px; text-align: center;">
                <div style="font-size: 28px; font-weight: bold; color: #22c55e;">${stats.donations_count}</div>
                <div style="color: #6b7280; font-size: 13px;">Donations</div>
                <div style="color: #22c55e; font-size: 14px; font-weight: 500; margin-top: 5px;">${formatCurrency(stats.donations_amount)}</div>
              </div>
            </td>
            <td width="50%" style="padding: 10px;">
              <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 15px; text-align: center;">
                <div style="font-size: 28px; font-weight: bold; color: #3b82f6;">${stats.form_responses_count}</div>
                <div style="color: #6b7280; font-size: 13px;">Form Responses</div>
              </div>
            </td>
          </tr>
        </table>
        ` : `
        <div style="background: #fefce8; border: 1px solid #fef08a; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 25px;">
          <p style="color: #854d0e; margin: 0;">📭 No transactions this week. Keep promoting your active entities!</p>
        </div>
        `}

        <div style="text-align: center; margin-top: 30px;">
          <a href="https://event-shine-flow.lovable.app/org/dashboard" style="display: inline-block; background: #7c3aed; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 500;">View Full Dashboard</a>
        </div>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
          You're receiving this because you have active entities on Useqiv.<br>
          This is an automated weekly report.
        </p>
      </div>
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

    // Calculate date range for last 7 days
    const now = new Date();
    const weekEnd = now.toISOString().split('T')[0];
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const weekEndFormatted = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const weekStartFormatted = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    // Find organizations with active entities
    const { data: activeOrgs, error: orgsError } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        company_email
      `)
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
        // Check for active entities
        const [contestsRes, eventsRes, campaignsRes, formsRes] = await Promise.all([
          supabase.from('contests').select('id', { count: 'exact' })
            .eq('organization_id', org.id).eq('is_active', true),
          supabase.from('events').select('id', { count: 'exact' })
            .eq('organization_id', org.id).eq('is_active', true),
          supabase.from('campaigns').select('id', { count: 'exact' })
            .eq('creator_id', org.id).eq('status', 'active'),
          supabase.from('forms').select('id', { count: 'exact' })
            .eq('user_id', org.id).eq('is_active', true),
        ]);

        const activeContests = contestsRes.count || 0;
        const activeEvents = eventsRes.count || 0;
        const activeCampaigns = campaignsRes.count || 0;
        const activeForms = formsRes.count || 0;

        // Skip if no active entities
        if (activeContests + activeEvents + activeCampaigns + activeForms === 0) {
          console.log(`Skipping ${org.full_name} - no active entities`);
          continue;
        }

        // Get weekly stats for this org
        const [votesRes, ticketsRes, donationsRes, formResponsesRes] = await Promise.all([
          // Votes for org's contests this week
          supabase.from('votes')
            .select('id, amount_paid')
            .gte('created_at', weekStart)
            .lte('created_at', weekEnd + 'T23:59:59')
            .in('contestant_id', 
              supabase.from('contestants')
                .select('id')
                .in('contest_id', 
                  supabase.from('contests').select('id').eq('organization_id', org.id)
                )
            ),
          // Tickets for org's events this week
          supabase.from('tickets')
            .select('id, amount_paid')
            .gte('created_at', weekStart)
            .lte('created_at', weekEnd + 'T23:59:59')
            .in('event_id', 
              supabase.from('events').select('id').eq('organization_id', org.id)
            )
            .in('status', ['active', 'used']),
          // Donations for org's campaigns this week
          supabase.from('donations')
            .select('id, amount')
            .gte('created_at', weekStart)
            .lte('created_at', weekEnd + 'T23:59:59')
            .in('campaign_id', 
              supabase.from('campaigns').select('id').eq('creator_id', org.id)
            )
            .eq('status', 'completed'),
          // Form responses for org's forms this week
          supabase.from('form_responses')
            .select('id')
            .gte('submitted_at', weekStart)
            .lte('submitted_at', weekEnd + 'T23:59:59')
            .in('form_id', 
              supabase.from('forms').select('id').eq('user_id', org.id)
            ),
        ]);

        // Calculate aggregated stats using direct queries for accuracy
        const { data: voteStats } = await supabase
          .from('votes')
          .select('amount_paid')
          .gte('created_at', weekStart)
          .lte('created_at', weekEnd + 'T23:59:59')
          .in('status', ['confirmed', 'completed']);

        const { data: contestIds } = await supabase
          .from('contests')
          .select('id')
          .eq('organization_id', org.id);

        const contestIdList = contestIds?.map(c => c.id) || [];

        // Get votes for this org's contestants
        let votesCount = 0;
        let votesRevenue = 0;
        if (contestIdList.length > 0) {
          const { data: contestants } = await supabase
            .from('contestants')
            .select('id')
            .in('contest_id', contestIdList);
          
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

        // Get tickets for this org's events
        const { data: eventIds } = await supabase
          .from('events')
          .select('id')
          .eq('organization_id', org.id);

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

        // Get donations for this org's campaigns
        const { data: campaignIds } = await supabase
          .from('campaigns')
          .select('id')
          .eq('creator_id', org.id);

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

        // Get form responses
        const { data: formIds } = await supabase
          .from('forms')
          .select('id')
          .eq('user_id', org.id);

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

        // Send the email
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
      JSON.stringify({ 
        success: true, 
        emailsSent, 
        errors: errors.length > 0 ? errors : undefined 
      }),
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
