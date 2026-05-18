import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type VoteLookupRequest = {
  tx_ref: string;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { tx_ref } = (await req.json()) as VoteLookupRequest;

    if (!tx_ref || typeof tx_ref !== "string") {
      return new Response(JSON.stringify({ error: "Missing tx_ref" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: walletTx, error: walletTxError } = await supabase
      .from("wallet_transactions")
      .select(
        "id, status, amount, currency, reference_id, gateway_transaction_id, gateway_provider_reference",
      )
      .eq("reference_id", tx_ref)
      .maybeSingle();

    if (walletTxError) {
      return new Response(JSON.stringify({ error: walletTxError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!walletTx?.id) {
      return new Response(JSON.stringify({ data: null, payment_status: "unknown" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: vote, error: voteError } = await supabase
      .from("votes")
      .select(
        `
        id,
        quantity,
        amount_paid,
        currency,
        payment_reference_id,
        guest_name,
        guest_email,
        created_at,
        contest:contests(title),
        contestant:contestants(name)
      `,
      )
      .eq("transaction_id", walletTx.id)
      .maybeSingle();

    if (voteError) {
      return new Response(JSON.stringify({ error: voteError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        data: vote,
        payment_status: vote ? "fulfilled" : walletTx.status,
        wallet_transaction_id: walletTx.id,
        transaction_reference:
          vote?.payment_reference_id || walletTx.reference_id || tx_ref,
        gateway_transaction_id: walletTx.gateway_transaction_id,
        gateway_provider_reference: walletTx.gateway_provider_reference,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
