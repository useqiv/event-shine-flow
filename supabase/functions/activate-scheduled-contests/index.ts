import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Checking for contests to activate...');

    // Find contests that should be activated (start_date has passed, is_active is false)
    const now = new Date().toISOString();
    
    const { data: contestsToActivate, error: fetchError } = await supabase
      .from('contests')
      .select('id, title, start_date, organization_id')
      .eq('is_active', false)
      .lte('start_date', now)
      .gt('end_date', now);

    if (fetchError) {
      console.error('Error fetching contests:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${contestsToActivate?.length || 0} contests to activate`);

    const activatedContests = [];

    for (const contest of contestsToActivate || []) {
      // Activate the contest
      const { error: updateError } = await supabase
        .from('contests')
        .update({ is_active: true, updated_at: now })
        .eq('id', contest.id);

      if (updateError) {
        console.error(`Error activating contest ${contest.id}:`, updateError);
        continue;
      }

      console.log(`Activated contest: ${contest.title} (${contest.id})`);

      // Create notification for the organization
      await supabase.from('notifications').insert({
        user_id: contest.organization_id,
        title: 'Contest Activated',
        message: `Your contest "${contest.title}" has been automatically activated as scheduled.`,
        type: 'contest',
        reference_id: contest.id,
      });

      activatedContests.push({
        id: contest.id,
        title: contest.title,
      });
    }

    // Also check for contests that should be deactivated (end_date has passed)
    const { data: contestsToDeactivate, error: deactivateFetchError } = await supabase
      .from('contests')
      .select('id, title, organization_id')
      .eq('is_active', true)
      .lt('end_date', now);

    if (deactivateFetchError) {
      console.error('Error fetching contests to deactivate:', deactivateFetchError);
    }

    const deactivatedContests = [];

    for (const contest of contestsToDeactivate || []) {
      const { error: updateError } = await supabase
        .from('contests')
        .update({ is_active: false, updated_at: now })
        .eq('id', contest.id);

      if (updateError) {
        console.error(`Error deactivating contest ${contest.id}:`, updateError);
        continue;
      }

      console.log(`Deactivated contest: ${contest.title} (${contest.id})`);

      // Create notification for the organization
      await supabase.from('notifications').insert({
        user_id: contest.organization_id,
        title: 'Contest Ended',
        message: `Your contest "${contest.title}" has ended and been deactivated.`,
        type: 'contest',
        reference_id: contest.id,
      });

      deactivatedContests.push({
        id: contest.id,
        title: contest.title,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        activated: activatedContests,
        deactivated: deactivatedContests,
        message: `Activated ${activatedContests.length} contests, deactivated ${deactivatedContests.length} contests`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error in activate-scheduled-contests:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
