import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentRequest {
  type: "vote" | "ticket" | "wallet";
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

const handler = async (req: Request): Promise<Response> => {
  console.log("Flutterwave payment function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Fetching Flutterwave settings from database...");

    // Fetch Flutterwave settings from platform_settings
    const { data: settings, error: settingsError } = await supabase
      .from("platform_settings")
      .select("setting_key, setting_value")
      .in("setting_key", [
        "flutterwave_enabled",
        "flutterwave_secret_key",
        "flutterwave_public_key",
        "flutterwave_test_mode",
        "flutterwave_currencies",
        "flutterwave_default_currency"
      ]);

    if (settingsError) {
      console.error("Failed to fetch settings:", settingsError.message);
      return new Response(
        JSON.stringify({ error: "Failed to load payment configuration." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Settings fetched:", settings?.length || 0, "settings found");

    const getSetting = (key: string) => settings?.find(s => s.setting_key === key)?.setting_value || "";

    const isEnabled = getSetting("flutterwave_enabled");
    console.log("Flutterwave enabled:", isEnabled);

    // Check if Flutterwave is enabled
    if (isEnabled !== "true") {
      console.error("Flutterwave payments are disabled");
      return new Response(
        JSON.stringify({ error: "Flutterwave payments are currently disabled. Please enable it in admin settings." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get secret key from platform settings first, fallback to env
    let flutterwaveSecretKey = getSetting("flutterwave_secret_key");
    console.log("Secret key from DB:", flutterwaveSecretKey ? "Found (length: " + flutterwaveSecretKey.length + ")" : "Not found");
    
    if (!flutterwaveSecretKey) {
      flutterwaveSecretKey = Deno.env.get("FLUTTERWAVE_SECRET_KEY") || "";
      console.log("Secret key from ENV:", flutterwaveSecretKey ? "Found (length: " + flutterwaveSecretKey.length + ")" : "Not found");
    }
    
    if (!flutterwaveSecretKey) {
      console.error("FLUTTERWAVE_SECRET_KEY not configured in DB or ENV");
      return new Response(
        JSON.stringify({ error: "Payment gateway not configured. Please add your Flutterwave secret key in Admin Settings > Flutterwave Configuration." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const defaultCurrency = getSetting("flutterwave_default_currency") || "NGN";

    let payload: PaymentRequest;
    try {
      payload = await req.json();
    } catch (e) {
      console.error("Invalid JSON payload:", e);
      return new Response(
        JSON.stringify({ error: "Invalid request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log("Payment request:", JSON.stringify(payload));

    // Validate required fields
    if (!payload.user_id || !payload.email || !payload.amount) {
      console.error("Missing required fields");
      return new Response(
        JSON.stringify({ error: "Missing required fields: user_id, email, or amount" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
    } else if (payload.type === "wallet") {
      meta.funding_amount = payload.amount;
    }

    // Use the current app URL for redirect
    const baseUrl = "https://preview--lovable-voting-platform.lovable.app";
    const redirectUrl = payload.redirect_url || `${baseUrl}/payment-callback`;

    const getPaymentTitle = () => {
      switch (payload.type) {
        case "vote": return "Vote Purchase";
        case "ticket": return "Ticket Purchase";
        case "wallet": return "Wallet Funding";
        default: return "Payment";
      }
    };

    const getPaymentDescription = () => {
      switch (payload.type) {
        case "vote": return `Purchase ${payload.vote_quantity || 1} vote(s)`;
        case "ticket": return `Purchase ${payload.ticket_quantity || 1} ticket(s)`;
        case "wallet": return `Fund wallet with ${payload.currency || defaultCurrency} ${payload.amount}`;
        default: return "Payment";
      }
    };

    const flutterwavePayload = {
      tx_ref,
      amount: payload.amount,
      currency: payload.currency || defaultCurrency,
      redirect_url: `https://tirqmqzgksclsjxfiham.supabase.co/functions/v1/flutterwave-webhook?redirect=${encodeURIComponent(redirectUrl)}`,
      customer: {
        email: payload.email,
        phonenumber: payload.phone || "",
        name: payload.name || "Customer",
      },
      meta,
      customizations: {
        title: getPaymentTitle(),
        description: getPaymentDescription(),
        logo: "https://tirqmqzgksclsjxfiham.supabase.co/storage/v1/object/public/avatars/logo.png",
      },
    };

    console.log("Calling Flutterwave API...");

    const response = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${flutterwaveSecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(flutterwavePayload),
    });

    const responseText = await response.text();
    console.log("Flutterwave raw response:", responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse Flutterwave response:", e);
      return new Response(
        JSON.stringify({ error: "Invalid response from payment gateway" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Flutterwave parsed response:", JSON.stringify(data));

    if (data.status !== "success") {
      console.error("Flutterwave error:", data.message);
      return new Response(
        JSON.stringify({ error: data.message || "Failed to initialize payment" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Store pending transaction in database
    const { data: wallet, error: walletError } = await supabase
      .from("wallets")
      .select("id")
      .eq("user_id", payload.user_id)
      .single();

    if (walletError) {
      console.log("Wallet lookup error (non-critical):", walletError.message);
    }

    if (wallet) {
      // Map wallet funding to 'deposit' type for DB constraint
      const transactionType = payload.type === "wallet" ? "deposit" : payload.type;
      const { error: txError } = await supabase.from("wallet_transactions").insert({
        user_id: payload.user_id,
        wallet_id: wallet.id,
        amount: payload.amount,
        type: transactionType,
        status: "pending",
        reference_id: tx_ref,
        description: payload.type === "wallet" 
          ? `Wallet funding via Flutterwave` 
          : `Pending ${payload.type} payment via Flutterwave`,
      });

      if (txError) {
        console.log("Transaction insert error (non-critical):", txError.message);
      }
    }

    console.log("Payment initialized successfully, returning link:", data.data.link);

    return new Response(
      JSON.stringify({
        success: true,
        payment_link: data.data.link,
        tx_ref,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Unexpected error processing Flutterwave payment:", error.message, error.stack);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
