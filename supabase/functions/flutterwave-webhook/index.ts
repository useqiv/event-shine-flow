import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FlutterwaveWebhookData {
  event: string;
  data: {
    id: number;
    tx_ref: string;
    flw_ref: string;
    amount: number;
    currency: string;
    charged_amount: number;
    status: string;
    payment_type: string;
    created_at: string;
    customer: {
      id: number;
      name: string;
      phone_number: string;
      email: string;
    };
    meta: {
      user_id: string;
      type: string;
      contest_id?: string;
      contestant_id?: string;
      vote_quantity?: number;
      event_id?: string;
      ticket_type_id?: string;
      ticket_quantity?: number;
    };
  };
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Flutterwave webhook called, method:", req.method);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);

  // Handle redirect from Flutterwave (GET request after payment)
  if (req.method === "GET") {
    const status = url.searchParams.get("status");
    const tx_ref = url.searchParams.get("tx_ref");
    const transaction_id = url.searchParams.get("transaction_id");
    const redirectUrl = url.searchParams.get("redirect") || "https://preview--lovable-voting-platform.lovable.app";

    console.log("Redirect params:", { status, tx_ref, transaction_id });

    if (status === "successful" && transaction_id) {
      try {
        const flutterwaveSecretKey = Deno.env.get("FLUTTERWAVE_SECRET_KEY");
        console.log("Verifying transaction:", transaction_id);
        
        const verifyResponse = await fetch(
          `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`,
          {
            headers: {
              Authorization: `Bearer ${flutterwaveSecretKey}`,
            },
          }
        );

        const verifyData = await verifyResponse.json();
        console.log("Verification response status:", verifyData.status);

        if (verifyData.status === "success" && verifyData.data.status === "successful") {
          await processSuccessfulPayment(verifyData.data);
        }
      } catch (error: any) {
        console.error("Verification error:", error.message);
      }
    }

    // Redirect to app with payment status
    const finalRedirect = new URL(redirectUrl);
    finalRedirect.searchParams.set("payment_status", status || "unknown");
    finalRedirect.searchParams.set("tx_ref", tx_ref || "");

    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        Location: finalRedirect.toString(),
      },
    });
  }

  // Handle webhook POST from Flutterwave (IPN)
  try {
    // Verify webhook signature
    const flutterwaveSecretHash = Deno.env.get("FLUTTERWAVE_SECRET_HASH");
    const signature = req.headers.get("verif-hash");
    
    if (flutterwaveSecretHash && signature) {
      if (signature !== flutterwaveSecretHash) {
        console.error("Invalid webhook signature");
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.log("Webhook signature verified");
    } else {
      console.log("Skipping signature verification (secret hash not configured)");
    }

    const webhookData: FlutterwaveWebhookData = await req.json();
    console.log("Webhook event:", webhookData.event);
    console.log("Webhook tx_ref:", webhookData.data?.tx_ref);
    console.log("Webhook status:", webhookData.data?.status);

    if (webhookData.event === "charge.completed" && webhookData.data.status === "successful") {
      await processSuccessfulPayment(webhookData.data);
      console.log("Payment processed successfully via webhook");
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Webhook error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

async function processSuccessfulPayment(paymentData: any) {
  console.log("Processing successful payment, tx_ref:", paymentData.tx_ref);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const meta = paymentData.meta || {};
  const { user_id, type, contest_id, contestant_id, vote_quantity, event_id, ticket_type_id, ticket_quantity } = meta;

  console.log("Payment meta:", JSON.stringify(meta));

  // Update transaction status
  const { error: updateError } = await supabase
    .from("wallet_transactions")
    .update({ status: "completed" })
    .eq("reference_id", paymentData.tx_ref);

  if (updateError) {
    console.log("Transaction update error (may not exist):", updateError.message);
  }

  if (type === "vote" && contest_id && contestant_id && user_id) {
    console.log("Recording vote...");
    
    // Record vote
    const { error: voteError } = await supabase.from("votes").insert({
      user_id,
      contest_id,
      contestant_id,
      quantity: vote_quantity || 1,
      amount_paid: paymentData.amount,
      payment_method: "flutterwave",
    });

    if (voteError) {
      console.error("Error recording vote:", voteError.message);
    } else {
      console.log("Vote recorded successfully");

      // Create notification
      await supabase.from("notifications").insert({
        user_id,
        title: "Vote Successful",
        message: `Your ${vote_quantity || 1} vote(s) have been recorded successfully.`,
        type: "vote",
        reference_id: contest_id,
      });
    }
  } else if (type === "ticket" && event_id && ticket_type_id && user_id) {
    console.log("Recording ticket purchase...");
    
    // Generate QR code
    const qr_code = `TKT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Record ticket purchase
    const { error: ticketError } = await supabase.from("tickets").insert({
      user_id,
      event_id,
      ticket_type_id,
      quantity: ticket_quantity || 1,
      amount_paid: paymentData.amount,
      payment_method: "flutterwave",
      qr_code,
      status: "active",
    });

    if (ticketError) {
      console.error("Error recording ticket:", ticketError.message);
    } else {
      console.log("Ticket recorded successfully");

      // Create notification
      await supabase.from("notifications").insert({
        user_id,
        title: "Ticket Purchase Successful",
        message: `Your ${ticket_quantity || 1} ticket(s) have been purchased successfully.`,
        type: "ticket",
        reference_id: event_id,
      });
    }
  } else {
    console.log("Unable to process payment - missing required meta fields");
  }
}

serve(handler);
