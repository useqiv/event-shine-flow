import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get completed wallet_transactions older than 2 minutes
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    
    const { data: transactions, error: txError } = await supabase
      .from("wallet_transactions")
      .select("*")
      .eq("status", "completed")
      .lt("created_at", twoMinutesAgo);

    if (txError) {
      console.error("Error fetching transactions:", txError);
      throw txError;
    }

    if (!transactions || transactions.length === 0) {
      console.log("No transactions to check");
      return new Response(JSON.stringify({ message: "No transactions to check" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get admin users
    const { data: admins, error: adminError } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (adminError || !admins || admins.length === 0) {
      console.log("No admins found or error:", adminError);
      return new Response(JSON.stringify({ message: "No admins found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let alertCount = 0;
    let orphanCount = 0;

    for (const tx of transactions) {
      const referenceId = tx.reference_id || "";
      const isVote = referenceId.startsWith("vote-") || referenceId.startsWith("vote_");
      const isTicket = referenceId.startsWith("ticket-") || referenceId.startsWith("ticket_");

      if (!isVote && !isTicket) continue;

      // Check if notification already sent for this transaction
      const notificationRef = `orphan-tx-${tx.id}`;
      const { data: existingNotification } = await supabase
        .from("notifications")
        .select("id")
        .eq("reference_id", notificationRef)
        .maybeSingle();

      if (existingNotification) {
        console.log(`Notification already exists for transaction ${tx.id}`);
        continue;
      }

      // Check if corresponding record exists within a time window
      let recordExists = false;
      const timeWindow = 2 * 60 * 1000; // 2 minute window
      const txTime = new Date(tx.created_at).getTime();

      if (isVote) {
        const { data: votes } = await supabase
          .from("votes")
          .select("id")
          .eq("user_id", tx.user_id)
          .eq("amount_paid", tx.amount)
          .gte("created_at", new Date(txTime - timeWindow).toISOString())
          .lte("created_at", new Date(txTime + timeWindow).toISOString())
          .limit(1);

        recordExists = !!(votes && votes.length > 0);
      } else if (isTicket) {
        const { data: tickets } = await supabase
          .from("tickets")
          .select("id")
          .eq("user_id", tx.user_id)
          .eq("amount_paid", tx.amount)
          .gte("created_at", new Date(txTime - timeWindow).toISOString())
          .lte("created_at", new Date(txTime + timeWindow).toISOString())
          .limit(1);

        recordExists = !!(tickets && tickets.length > 0);
      }

      if (recordExists) {
        console.log(`Record found for transaction ${tx.id}`);
        continue;
      }
      orphanCount++;

      // Create admin notifications
      const notificationType = isVote ? "vote" : "ticket";
      console.log(`Creating alert for orphaned ${notificationType} transaction: ${tx.id}`);

      const notifications = admins.map((admin) => ({
        user_id: admin.user_id,
        title: `Orphaned ${notificationType} payment detected`,
        message: `Payment completed but no ${notificationType} record found. TX ID: ${tx.id}, Amount: ₦${tx.amount}, Ref: ${referenceId}`,
        type: "fraud_alert",
        reference_id: notificationRef,
      }));

      const { error: notifyError } = await supabase
        .from("notifications")
        .insert(notifications);

      if (notifyError) {
        console.error("Error creating notifications:", notifyError);
      } else {
        alertCount++;
      }
    }

    // Reconcile denormalized vote counters (contestants.vote_count and contests.total_votes)
    // to ensure UI numbers match authoritative votes table totals.
    let contestantFixes = 0;
    let contestFixes = 0;

    const { data: voteAgg, error: voteAggError } = await supabase
      .from("votes")
      .select("contest_id, contestant_id, quantity");

    if (voteAggError) {
      console.error("Error reading votes for reconciliation:", voteAggError);
      throw voteAggError;
    }

    const contestantTotals = new Map<string, number>();
    const contestTotals = new Map<string, number>();

    for (const vote of voteAgg || []) {
      const qty = Number(vote.quantity) || 0;
      if (!qty) continue;
      if (vote.contestant_id) {
        contestantTotals.set(vote.contestant_id, (contestantTotals.get(vote.contestant_id) || 0) + qty);
      }
      if (vote.contest_id) {
        contestTotals.set(vote.contest_id, (contestTotals.get(vote.contest_id) || 0) + qty);
      }
    }

    const { data: contestants, error: contestantsError } = await supabase
      .from("contestants")
      .select("id, vote_count");

    if (contestantsError) {
      console.error("Error reading contestants for reconciliation:", contestantsError);
      throw contestantsError;
    }

    for (const contestant of contestants || []) {
      const expected = contestantTotals.get(contestant.id) || 0;
      const current = Number(contestant.vote_count) || 0;
      if (current !== expected) {
        const { error: updateError } = await supabase
          .from("contestants")
          .update({ vote_count: expected })
          .eq("id", contestant.id);
        if (updateError) {
          console.error("Failed to reconcile contestant count:", contestant.id, updateError);
        } else {
          contestantFixes++;
        }
      }
    }

    const { data: contests, error: contestsError } = await supabase
      .from("contests")
      .select("id, total_votes");

    if (contestsError) {
      console.error("Error reading contests for reconciliation:", contestsError);
      throw contestsError;
    }

    for (const contest of contests || []) {
      const expected = contestTotals.get(contest.id) || 0;
      const current = Number(contest.total_votes) || 0;
      if (current !== expected) {
        const { error: updateError } = await supabase
          .from("contests")
          .update({ total_votes: expected })
          .eq("id", contest.id);
        if (updateError) {
          console.error("Failed to reconcile contest count:", contest.id, updateError);
        } else {
          contestFixes++;
        }
      }
    }

    console.log(`Checked ${transactions.length} transactions, found ${orphanCount} orphans, created ${alertCount} alerts, reconciled ${contestantFixes} contestant counters and ${contestFixes} contest counters`);

    return new Response(
      JSON.stringify({ 
        message: `Checked ${transactions.length} transactions, found ${orphanCount} orphans, created ${alertCount} alerts, reconciled ${contestantFixes} contestant counters and ${contestFixes} contest counters`,
        checked_transactions: transactions.length,
        orphan_transactions: orphanCount,
        alerts_created: alertCount,
        contestant_counters_reconciled: contestantFixes,
        contest_counters_reconciled: contestFixes,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error in check-orphan-transactions:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
