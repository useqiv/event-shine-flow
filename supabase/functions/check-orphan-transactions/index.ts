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

    for (const tx of transactions) {
      const referenceId = tx.reference_id || "";
      const isVote = referenceId.startsWith("vote-");
      const isTicket = referenceId.startsWith("ticket-");

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

    console.log(`Checked ${transactions.length} transactions, created ${alertCount} alerts`);

    return new Response(
      JSON.stringify({ 
        message: `Checked ${transactions.length} transactions, created ${alertCount} alerts` 
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
