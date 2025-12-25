import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyPaymentRequest {
  payment_ref: string;
  tx_hash: string;
  user_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Verify crypto payment function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: VerifyPaymentRequest = await req.json();
    console.log("Verify payment request:", payload);

    const { payment_ref, tx_hash, user_id } = payload;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find the pending transaction
    const { data: transaction, error: txError } = await supabase
      .from("wallet_transactions")
      .select("*")
      .eq("reference_id", payment_ref)
      .eq("user_id", user_id)
      .eq("status", "pending")
      .single();

    if (txError || !transaction) {
      throw new Error("Payment not found or already processed");
    }

    // Parse payment details from description
    const descMatch = transaction.description?.match(/(\d+\.?\d*)\s+(USDT|USDC|BTC|ETH)\s+on\s+(\w+)/);
    if (!descMatch) {
      throw new Error("Invalid payment reference");
    }

    const [, amount, currency, network] = descMatch;

    // In production, you would verify the transaction on the blockchain
    // using APIs like Etherscan, BSCScan, etc.
    // For now, we'll simulate verification with manual admin review

    // Mark transaction as pending_verification for admin review
    await supabase
      .from("wallet_transactions")
      .update({
        status: "pending_verification",
        description: `${transaction.description} | TX: ${tx_hash}`,
      })
      .eq("id", transaction.id);

    // Create notification for admin
    const { data: adminUsers } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (adminUsers && adminUsers.length > 0) {
      const notifications = adminUsers.map((admin) => ({
        user_id: admin.user_id,
        title: "Crypto Payment Verification Required",
        message: `A crypto payment of ${amount} ${currency} on ${network} needs verification. TX: ${tx_hash.slice(0, 20)}...`,
        type: "admin",
        reference_id: transaction.id,
      }));

      await supabase.from("notifications").insert(notifications);
    }

    // Create fraud alert for review
    await supabase.from("fraud_alerts").insert({
      alert_type: "crypto_payment_verification",
      severity: "low",
      entity_type: "transaction",
      entity_id: transaction.id,
      description: `Crypto payment verification: ${amount} ${currency} on ${network}. TX Hash: ${tx_hash}`,
      metadata: {
        payment_ref,
        tx_hash,
        user_id,
        amount,
        currency,
        network,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        status: "pending_verification",
        message: "Your payment has been submitted for verification. You will be notified once it's confirmed.",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error verifying crypto payment:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
