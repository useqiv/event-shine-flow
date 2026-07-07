import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CRYPTO_MIN_USD = 5;
const SUPPORTED_NETWORK = "polygon";
const TOKEN_CONTRACTS: Record<string, string> = {
  USDT: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
  USDC: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
};

const FALLBACK_EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  NGN: 1550,
  EUR: 0.92,
  GBP: 0.79,
  GHS: 15.5,
  KES: 153,
  ZAR: 18.5,
  XAF: 605,
  XOF: 605,
  TZS: 2500,
  UGX: 3700,
  RWF: 1300,
};

let cachedExchangeRates: { rates: Record<string, number>; timestamp: number } | null = null;

interface CryptoPaymentRequest {
  type: "vote" | "ticket" | "donation" | "form";
  crypto_currency: "USDT" | "USDC";
  network: "polygon";
  amount_usd: number;
  amount?: number;
  currency?: string;
  user_id: string;
  email?: string;
  name?: string;
  contest_id?: string;
  contestant_id?: string;
  vote_quantity?: number;
  event_id?: string;
  ticket_type_id?: string;
  ticket_quantity?: number;
  campaign_id?: string;
  is_anonymous?: boolean;
  donor_message?: string;
  form_id?: string;
  response_data?: Record<string, unknown>;
  influencer_link_id?: string;
}

async function getExchangeRates(): Promise<Record<string, number>> {
  if (cachedExchangeRates && Date.now() - cachedExchangeRates.timestamp < 60 * 60 * 1000) {
    return cachedExchangeRates.rates;
  }
  try {
    const response = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
    if (!response.ok) throw new Error(`Exchange rate API error: ${response.status}`);
    const data = await response.json();
    const rates: Record<string, number> = {};
    for (const currency of Object.keys(FALLBACK_EXCHANGE_RATES)) {
      if (data.rates?.[currency]) rates[currency] = data.rates[currency];
    }
    if (Object.keys(rates).length === 0) throw new Error("No supported exchange rates returned");
    cachedExchangeRates = { rates, timestamp: Date.now() };
    return rates;
  } catch (error) {
    console.warn("Using fallback exchange rates:", error);
    return FALLBACK_EXCHANGE_RATES;
  }
}

function convertToUsd(amount: number, currency: string, rates: Record<string, number>): number {
  if (currency === "USD") return Math.round(amount * 100) / 100;
  const usdRate = rates["USD"] || 1;
  const sourceRate = rates[currency] || 1;
  return Math.round(((amount * usdRate) / sourceRate) * 100) / 100;
}

function isAmountWithinTolerance(expected: number, actual: number, tolerance = 0.02): boolean {
  if (!Number.isFinite(expected) || expected <= 0) return false;
  return Math.abs(actual - expected) / expected <= tolerance;
}

function computeCryptoFees(baseUsd: number, feePct: number, surcharge: number): number {
  const methodFee = Math.round(((baseUsd * feePct) / 100 + surcharge) * 100) / 100;
  return methodFee;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: CryptoPaymentRequest = await req.json();
    const { crypto_currency, network, user_id, type } = payload;

    if (network !== SUPPORTED_NETWORK) {
      throw new Error("Only Polygon network is supported for crypto payments");
    }
    if (!["USDT", "USDC"].includes(crypto_currency)) {
      throw new Error("Only USDT and USDC wallets are supported");
    }
    if (!user_id || !type) {
      throw new Error("Missing required payment fields");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: settings } = await supabase
      .from("platform_settings")
      .select("setting_key, setting_value")
      .in("setting_key", [
        "crypto_payment_enabled",
        "crypto_fee_percentage",
        "crypto_network_surcharge",
        "crypto_wallet_polygon_usdt",
        "crypto_wallet_polygon_usdc",
        "flutterwave_default_currency",
      ]);

    const getSetting = (key: string) =>
      settings?.find((s) => s.setting_key === key)?.setting_value || "";

    if (getSetting("crypto_payment_enabled") !== "true") {
      throw new Error("Cryptocurrency payments are currently disabled");
    }

    const walletKey = `crypto_wallet_${network}_${crypto_currency.toLowerCase()}`;
    const wallet_address = getSetting(walletKey);
    if (!wallet_address || wallet_address === "0x0000000000000000000000000000000000000000") {
      throw new Error(`${crypto_currency} wallet on Polygon is not configured. Please contact support.`);
    }

    const defaultCurrency = getSetting("flutterwave_default_currency") || "NGN";
    const cryptoFeePct = parseFloat(getSetting("crypto_fee_percentage")) || 0;
    const cryptoSurcharge = parseFloat(getSetting("crypto_network_surcharge")) || 0;
    const rates = await getExchangeRates();

    let baseAmount = 0;
    let baseCurrency = "USD";
    const paymentMetadata: Record<string, unknown> = {
      type,
      user_id,
      crypto_currency,
      network,
      purchaser_email: payload.email?.trim().toLowerCase() || null,
      purchaser_name: payload.name?.trim() || null,
      influencer_link_id: payload.influencer_link_id || null,
    };

    if (type === "vote" && payload.contest_id && payload.contestant_id && payload.vote_quantity) {
      const { data: contest, error: contestErr } = await supabase
        .from("contests")
        .select("vote_price, vote_currency, start_date, end_date, is_active")
        .eq("id", payload.contest_id)
        .single();

      if (contestErr || !contest) throw new Error("Contest not found");

      const nowTs = new Date();
      const startTs = contest.start_date ? new Date(contest.start_date) : null;
      const endTs = contest.end_date ? new Date(contest.end_date) : null;
      if (startTs && nowTs < startTs) throw new Error("Voting has not started yet");
      if (endTs && nowTs > endTs) throw new Error("Voting has ended for this contest");
      if (contest.is_active === false && startTs && nowTs >= startTs) {
        throw new Error("Voting is currently closed for this contest");
      }

      const { data: voteOptions } = await supabase
        .from("contest_vote_options")
        .select("vote_quantity, price")
        .eq("contest_id", payload.contest_id);

      const normalizedOptions = (voteOptions || [])
        .map((o) => ({ vote_quantity: Number(o.vote_quantity), price: Number(o.price) }))
        .filter((o) => Number.isFinite(o.vote_quantity) && o.vote_quantity > 0 && Number.isFinite(o.price))
        .sort((a, b) => a.vote_quantity - b.vote_quantity);

      const matchingOption = normalizedOptions.find((o) => o.vote_quantity === payload.vote_quantity);
      let fallbackUnitPrice = Number(contest.vote_price);
      if (!Number.isFinite(fallbackUnitPrice) || fallbackUnitPrice <= 0) {
        const smallest = normalizedOptions[0];
        if (smallest) fallbackUnitPrice = smallest.price / smallest.vote_quantity;
      }
      baseAmount = matchingOption ? matchingOption.price : fallbackUnitPrice * payload.vote_quantity;
      baseCurrency = contest.vote_currency || defaultCurrency;

      paymentMetadata.contest_id = payload.contest_id;
      paymentMetadata.contestant_id = payload.contestant_id;
      paymentMetadata.vote_quantity = payload.vote_quantity;
    } else if (type === "ticket" && payload.event_id && payload.ticket_type_id && payload.ticket_quantity) {
      const { data: ticketType, error: ticketErr } = await supabase
        .from("ticket_types")
        .select("price, currency")
        .eq("id", payload.ticket_type_id)
        .single();
      if (ticketErr || !ticketType) throw new Error("Ticket type not found");

      baseAmount = Number(ticketType.price) * payload.ticket_quantity;
      baseCurrency = ticketType.currency || defaultCurrency;

      paymentMetadata.event_id = payload.event_id;
      paymentMetadata.ticket_type_id = payload.ticket_type_id;
      paymentMetadata.ticket_quantity = payload.ticket_quantity;
    } else if (type === "donation" && payload.campaign_id) {
      const donationAmount = Number(payload.amount);
      if (!donationAmount || donationAmount <= 0) throw new Error("Invalid donation amount");

      const { data: campaign, error: campaignErr } = await supabase
        .from("campaigns")
        .select("currency, status, end_date")
        .eq("id", payload.campaign_id)
        .single();
      if (campaignErr || !campaign) throw new Error("Campaign not found");

      baseAmount = donationAmount;
      baseCurrency = payload.currency || campaign.currency || defaultCurrency;

      paymentMetadata.campaign_id = payload.campaign_id;
      paymentMetadata.is_anonymous = payload.is_anonymous || false;
      paymentMetadata.donor_message = payload.donor_message || null;
    } else if (type === "form" && payload.form_id) {
      const { data: form, error: formErr } = await supabase
        .from("forms")
        .select("payment_amount, payment_currency, requires_payment")
        .eq("id", payload.form_id)
        .single();
      if (formErr || !form) throw new Error("Form not found");
      if (!form.requires_payment || Number(form.payment_amount) <= 0) {
        throw new Error("This form does not require payment");
      }

      baseAmount = Number(form.payment_amount);
      baseCurrency = form.payment_currency || defaultCurrency;

      paymentMetadata.form_id = payload.form_id;
      paymentMetadata.response_data = payload.response_data || {};
    } else {
      throw new Error("Invalid payment type or missing required fields");
    }

    const baseAmountUsd = convertToUsd(baseAmount, baseCurrency, rates);
    const cryptoFees = computeCryptoFees(baseAmountUsd, cryptoFeePct, cryptoSurcharge);
    const crypto_amount = Math.round((baseAmountUsd + cryptoFees) * 100) / 100;

    if (crypto_amount < CRYPTO_MIN_USD) {
      throw new Error(`Minimum funding amount is ${CRYPTO_MIN_USD} ${crypto_currency} on Polygon`);
    }

    if (!isAmountWithinTolerance(crypto_amount, payload.amount_usd)) {
      throw new Error("Price verification failed. Please refresh and try again.");
    }

    paymentMetadata.base_amount = baseAmount;
    paymentMetadata.base_currency = baseCurrency;
    paymentMetadata.base_amount_usd = baseAmountUsd;
    paymentMetadata.crypto_amount = crypto_amount;
    paymentMetadata.crypto_fees = cryptoFees;
    paymentMetadata.payment_currency = "USD";
    paymentMetadata.payment_amount = baseAmountUsd;

    const payment_ref = `CRYPTO_${type.toUpperCase()}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const isGuestUser = !user_id || String(user_id).startsWith("guest_");

    let walletId: string | null = null;
    if (!isGuestUser) {
      const { data: wallet } = await supabase
        .from("wallets")
        .select("id")
        .eq("user_id", user_id)
        .maybeSingle();
      walletId = wallet?.id || null;
    }

    const txInsert: Record<string, unknown> = {
      amount: baseAmountUsd,
      currency: "USD",
      type,
      status: "pending",
      reference_id: payment_ref,
      payment_metadata: paymentMetadata,
      description: `Pending ${type} - ${crypto_amount} ${crypto_currency} on ${network}`,
    };

    if (!isGuestUser && walletId) {
      txInsert.user_id = user_id;
      txInsert.wallet_id = walletId;
    } else if (!isGuestUser) {
      txInsert.user_id = user_id;
    }

    const { error: txError } = await supabase.from("wallet_transactions").insert(txInsert);
    if (txError) {
      console.error("Failed to create pending transaction:", txError.message);
      throw new Error("Unable to initialize crypto payment. Please try again.");
    }

    return new Response(
      JSON.stringify({
        success: true,
        payment_ref,
        wallet_address,
        crypto_currency,
        network,
        amount: crypto_amount,
        amount_usd: crypto_amount,
        token_contract: TOKEN_CONTRACTS[crypto_currency],
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        user_id,
        instructions: {
          step1: `Send exactly ${crypto_amount} ${crypto_currency} to the wallet address below`,
          step2: `Use Polygon network only`,
          step3: `Minimum amount: ${CRYPTO_MIN_USD} ${crypto_currency}`,
          step4: "After sending, enter your transaction hash and click Verify Payment",
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error processing crypto payment:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
};

serve(handler);
