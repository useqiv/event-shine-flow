import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CryptoPaymentRequest {
  type: "vote" | "ticket";
  crypto_currency: "USDT" | "USDC" | "BTC" | "ETH";
  network: "ethereum" | "bsc" | "polygon" | "tron";
  amount_usd: number;
  user_id: string;
  // Vote specific
  contest_id?: string;
  contestant_id?: string;
  vote_quantity?: number;
  // Ticket specific
  event_id?: string;
  ticket_type_id?: string;
  ticket_quantity?: number;
}

// Platform wallet addresses for receiving crypto payments
// These should be configured in platform_settings or as environment variables
const PLATFORM_WALLETS: Record<string, Record<string, string>> = {
  ethereum: {
    USDT: "0x0000000000000000000000000000000000000000", // Replace with actual wallet
    USDC: "0x0000000000000000000000000000000000000000",
    ETH: "0x0000000000000000000000000000000000000000",
  },
  bsc: {
    USDT: "0x0000000000000000000000000000000000000000",
    USDC: "0x0000000000000000000000000000000000000000",
  },
  polygon: {
    USDT: "0x0000000000000000000000000000000000000000",
    USDC: "0x0000000000000000000000000000000000000000",
  },
  tron: {
    USDT: "T0000000000000000000000000000000000", // TRC20 address
  },
};

// Token contract addresses for verification
const TOKEN_CONTRACTS: Record<string, Record<string, string>> = {
  ethereum: {
    USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  },
  bsc: {
    USDT: "0x55d398326f99059fF775485246999027B3197955",
    USDC: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
  },
  polygon: {
    USDT: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
    USDC: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
  },
};

const handler = async (req: Request): Promise<Response> => {
  console.log("Crypto payment function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: CryptoPaymentRequest = await req.json();
    console.log("Crypto payment request:", payload);

    const { crypto_currency, network, amount_usd, user_id, type } = payload;

    // Validate network and currency combination
    if (!PLATFORM_WALLETS[network]?.[crypto_currency]) {
      throw new Error(`${crypto_currency} on ${network} network is not supported`);
    }

    // Get platform wallet address
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if custom wallet is set in platform settings
    const { data: walletSetting } = await supabase
      .from("platform_settings")
      .select("setting_value")
      .eq("setting_key", `crypto_wallet_${network}_${crypto_currency.toLowerCase()}`)
      .single();

    const wallet_address = walletSetting?.setting_value || PLATFORM_WALLETS[network][crypto_currency];

    // Generate unique payment reference
    const payment_ref = `CRYPTO_${type.toUpperCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // For USDT/USDC, amount is same as USD (1:1)
    // For BTC/ETH, you'd need to fetch current exchange rates
    let crypto_amount = amount_usd;
    if (crypto_currency === "BTC" || crypto_currency === "ETH") {
      // In production, fetch real-time prices from an API like CoinGecko
      // This is a simplified example
      const mockRates: Record<string, number> = {
        BTC: 45000, // Mock BTC price
        ETH: 2500,  // Mock ETH price
      };
      crypto_amount = amount_usd / mockRates[crypto_currency];
    }

    // Get user's wallet
    const { data: wallet } = await supabase
      .from("wallets")
      .select("id")
      .eq("user_id", user_id)
      .single();

    // Create pending transaction
    if (wallet) {
      await supabase.from("wallet_transactions").insert({
        user_id,
        wallet_id: wallet.id,
        amount: amount_usd,
        type: type === "vote" ? "vote_purchase" : "ticket_purchase",
        status: "pending",
        reference_id: payment_ref,
        description: `Pending ${type} payment - ${crypto_amount} ${crypto_currency} on ${network}`,
      });
    }

    // Store payment intent for verification
    const paymentIntent = {
      payment_ref,
      user_id,
      type,
      crypto_currency,
      network,
      amount_usd,
      crypto_amount,
      wallet_address,
      contest_id: payload.contest_id,
      contestant_id: payload.contestant_id,
      vote_quantity: payload.vote_quantity,
      event_id: payload.event_id,
      ticket_type_id: payload.ticket_type_id,
      ticket_quantity: payload.ticket_quantity,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min expiry
    };

    // In production, store this in a pending_crypto_payments table
    // For now, we'll encode it in the reference

    return new Response(
      JSON.stringify({
        success: true,
        payment_ref,
        wallet_address,
        crypto_currency,
        network,
        amount: crypto_amount,
        amount_usd,
        token_contract: TOKEN_CONTRACTS[network]?.[crypto_currency] || null,
        expires_at: paymentIntent.expires_at,
        instructions: {
          step1: `Send exactly ${crypto_amount} ${crypto_currency} to the wallet address below`,
          step2: `Use ${network} network`,
          step3: `Include payment reference: ${payment_ref} in the memo/note (if supported)`,
          step4: "After sending, click 'Verify Payment' to confirm your transaction",
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error processing crypto payment:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
