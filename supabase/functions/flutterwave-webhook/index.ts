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
    device_fingerprint: string;
    amount: number;
    currency: string;
    charged_amount: number;
    app_fee: number;
    merchant_fee: number;
    processor_response: string;
    auth_model: string;
    ip: string;
    narration: string;
    status: string;
    payment_type: string;
    created_at: string;
    account_id: number;
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
  console.log("Flutterwave webhook called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Handle redirect from Flutterwave (GET request after payment)
  if (req.method === "GET") {
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const tx_ref = url.searchParams.get("tx_ref");
    const transaction_id = url.searchParams.get("transaction_id");

    console.log("Redirect params:", { status, tx_ref, transaction_id });

    if (status === "successful" && transaction_id) {
      // Verify the transaction
      const flutterwaveSecretKey = Deno.env.get("FLUTTERWAVE_SECRET_KEY");
      const verifyResponse = await fetch(
        `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`,
        {
          headers: {
            Authorization: `Bearer ${flutterwaveSecretKey}`,
          },
        }
      );

      const verifyData = await verifyResponse.json();
      console.log("Verification response:", verifyData);

      if (verifyData.status === "success" && verifyData.data.status === "successful") {
        await processSuccessfulPayment(verifyData.data);
      }
    }

    // Redirect to app
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        Location: `https://lovable.dev/projects/vote-app?payment=${status}&ref=${tx_ref}`,
      },
    });
  }

  try {
    const webhookData: FlutterwaveWebhookData = await req.json();
    console.log("Webhook data:", webhookData);

    if (webhookData.event === "charge.completed" && webhookData.data.status === "successful") {
      await processSuccessfulPayment(webhookData.data);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

async function processSuccessfulPayment(paymentData: any) {
  console.log("Processing successful payment:", paymentData);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const meta = paymentData.meta || {};
  const { user_id, type, contest_id, contestant_id, vote_quantity, event_id, ticket_type_id, ticket_quantity } = meta;

  // Update transaction status
  await supabase
    .from("wallet_transactions")
    .update({ status: "completed" })
    .eq("reference_id", paymentData.tx_ref);

  if (type === "vote" && contest_id && contestant_id) {
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
      console.error("Error recording vote:", voteError);
    } else {
      console.log("Vote recorded successfully");
    }

    // Create notification
    await supabase.from("notifications").insert({
      user_id,
      title: "Vote Successful",
      message: `Your ${vote_quantity} vote(s) have been recorded successfully.`,
      type: "vote",
      reference_id: contest_id,
    });
  } else if (type === "ticket" && event_id && ticket_type_id) {
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
      console.error("Error recording ticket:", ticketError);
    } else {
      console.log("Ticket recorded successfully");
    }

    // Create notification
    await supabase.from("notifications").insert({
      user_id,
      title: "Ticket Purchase Successful",
      message: `Your ${ticket_quantity} ticket(s) have been purchased successfully.`,
      type: "ticket",
      reference_id: event_id,
    });
  }
}

serve(handler);
