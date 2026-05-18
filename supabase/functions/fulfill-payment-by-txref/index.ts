import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Admin/service retry: verify a Flutterwave charge by tx_ref and invoke flutterwave-webhook processing.
 * Use for paid votes that were not recorded (orphaned wallet_transactions).
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: isAdmin } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { tx_ref } = await req.json() as { tx_ref?: string };
    if (!tx_ref) {
      return new Response(JSON.stringify({ error: "Missing tx_ref" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: decryptedKey } = await supabase.rpc("get_decrypted_platform_setting", {
      p_key: "flutterwave_secret_key",
    });
    const flutterwaveSecretKey =
      decryptedKey || Deno.env.get("FLUTTERWAVE_SECRET_KEY") || "";

    if (!flutterwaveSecretKey) {
      return new Response(JSON.stringify({ error: "Flutterwave not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const verifyResponse = await fetch(
      `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(tx_ref)}`,
      { headers: { Authorization: `Bearer ${flutterwaveSecretKey}` } },
    );
    const verifyData = await verifyResponse.json();

    if (verifyData.status !== "success" || verifyData.data?.status !== "successful") {
      return new Response(
        JSON.stringify({
          error: "Payment not successful on Flutterwave",
          flutterwave_status: verifyData.data?.status,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const webhookResponse = await fetch(`${supabaseUrl}/functions/v1/flutterwave-webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceRoleKey}`,
        ...(Deno.env.get("FLUTTERWAVE_SECRET_HASH")
          ? { "verif-hash": Deno.env.get("FLUTTERWAVE_SECRET_HASH")! }
          : {}),
      },
      body: JSON.stringify({
        event: "charge.completed",
        data: verifyData.data,
      }),
    });

    const webhookBody = await webhookResponse.text();

    const { data: walletTx } = await supabase
      .from("wallet_transactions")
      .select("id, status")
      .eq("reference_id", tx_ref)
      .maybeSingle();

    const isTicketRef = tx_ref.startsWith("ticket_");
    const isVoteRef = tx_ref.startsWith("vote_");

    let voteRecorded = false;
    let ticketRecorded = false;

    if (walletTx?.id) {
      if (isVoteRef) {
        const { data: vote } = await supabase
          .from("votes")
          .select("id, quantity")
          .eq("transaction_id", walletTx.id)
          .maybeSingle();
        voteRecorded = !!vote?.id;
      }

      if (isTicketRef) {
        const { data: ticket } = await supabase
          .from("tickets")
          .select("id, quantity")
          .eq("transaction_id", walletTx.id)
          .maybeSingle();
        ticketRecorded = !!ticket?.id;
      }
    }

    const fulfillmentRecorded = isTicketRef ? ticketRecorded : isVoteRef ? voteRecorded : voteRecorded || ticketRecorded;

    return new Response(
      JSON.stringify({
        success: webhookResponse.ok,
        vote_recorded: voteRecorded,
        ticket_recorded: ticketRecorded,
        fulfillment_recorded: fulfillmentRecorded,
        wallet_transaction_status: walletTx?.status,
        transaction_reference: tx_ref,
        webhook_response: webhookBody,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Invalid request";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
