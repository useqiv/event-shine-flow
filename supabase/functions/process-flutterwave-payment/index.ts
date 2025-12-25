import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentRequest {
  type: "vote" | "ticket";
  amount: number;
  currency: string;
  email: string;
  phone?: string;
  name: string;
  user_id: string;
  // Vote specific
  contest_id?: string;
  contestant_id?: string;
  vote_quantity?: number;
  // Ticket specific
  event_id?: string;
  ticket_type_id?: string;
  ticket_quantity?: number;
  redirect_url?: string;
}

interface FlutterwaveInitResponse {
  status: string;
  message: string;
  data: {
    link: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Flutterwave payment function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const flutterwaveSecretKey = Deno.env.get("FLUTTERWAVE_SECRET_KEY");
    if (!flutterwaveSecretKey) {
      throw new Error("Flutterwave secret key not configured");
    }

    const payload: PaymentRequest = await req.json();
    console.log("Payment request:", payload);

    const tx_ref = `${payload.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Build meta data based on payment type
    const meta: Record<string, any> = {
      user_id: payload.user_id,
      type: payload.type,
    };

    if (payload.type === "vote") {
      meta.contest_id = payload.contest_id;
      meta.contestant_id = payload.contestant_id;
      meta.vote_quantity = payload.vote_quantity;
    } else if (payload.type === "ticket") {
      meta.event_id = payload.event_id;
      meta.ticket_type_id = payload.ticket_type_id;
      meta.ticket_quantity = payload.ticket_quantity;
    }

    const flutterwavePayload = {
      tx_ref,
      amount: payload.amount,
      currency: payload.currency || "NGN",
      redirect_url: payload.redirect_url || "https://tirqmqzgksclsjxfiham.supabase.co/functions/v1/flutterwave-webhook",
      customer: {
        email: payload.email,
        phonenumber: payload.phone || "",
        name: payload.name,
      },
      meta,
      customizations: {
        title: payload.type === "vote" ? "Vote Purchase" : "Ticket Purchase",
        description: payload.type === "vote" 
          ? `Purchase ${payload.vote_quantity} vote(s)` 
          : `Purchase ${payload.ticket_quantity} ticket(s)`,
        logo: "https://tirqmqzgksclsjxfiham.supabase.co/storage/v1/object/public/avatars/logo.png",
      },
    };

    console.log("Flutterwave payload:", flutterwavePayload);

    const response = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${flutterwaveSecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(flutterwavePayload),
    });

    const data: FlutterwaveInitResponse = await response.json();
    console.log("Flutterwave response:", data);

    if (data.status !== "success") {
      throw new Error(data.message || "Failed to initialize payment");
    }

    // Store pending transaction in database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: wallet } = await supabase
      .from("wallets")
      .select("id")
      .eq("user_id", payload.user_id)
      .single();

    if (wallet) {
      await supabase.from("wallet_transactions").insert({
        user_id: payload.user_id,
        wallet_id: wallet.id,
        amount: payload.amount,
        type: payload.type === "vote" ? "vote_purchase" : "ticket_purchase",
        status: "pending",
        reference_id: tx_ref,
        description: `Pending ${payload.type} payment via Flutterwave`,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        payment_link: data.data.link,
        tx_ref,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error processing Flutterwave payment:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
