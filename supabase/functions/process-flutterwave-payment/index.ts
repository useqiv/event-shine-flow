import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Must match client-side conversion in currency-selector.tsx
const CURRENCY_MARKUP_PERCENT = 0.10;
const EXCHANGE_RATE_CACHE_MS = 60 * 60 * 1000;
const DECIMAL_CURRENCIES = new Set(["USD", "EUR", "GBP", "GHS", "ZAR"]);

const PAYMENT_MIN_AMOUNTS: Record<string, number> = {
  USD: 0.01,
  EUR: 0.01,
  GBP: 0.01,
  GHS: 0.01,
  ZAR: 0.01,
  NGN: 1,
  KES: 1,
  XAF: 1,
  XOF: 1,
  TZS: 1,
  UGX: 1,
  RWF: 1,
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

async function getExchangeRates(): Promise<Record<string, number>> {
  if (cachedExchangeRates && Date.now() - cachedExchangeRates.timestamp < EXCHANGE_RATE_CACHE_MS) {
    return cachedExchangeRates.rates;
  }

  try {
    const response = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
    if (!response.ok) {
      throw new Error(`Exchange rate API error: ${response.status}`);
    }

    const data = await response.json();
    const supportedCurrencies = Object.keys(FALLBACK_EXCHANGE_RATES);
    const rates: Record<string, number> = {};

    for (const currency of supportedCurrencies) {
      if (data.rates?.[currency]) {
        rates[currency] = data.rates[currency];
      }
    }

    if (Object.keys(rates).length === 0) {
      throw new Error("No supported exchange rates returned");
    }

    cachedExchangeRates = { rates, timestamp: Date.now() };
    return rates;
  } catch (error) {
    console.warn("Using fallback exchange rates:", error);
    return FALLBACK_EXCHANGE_RATES;
  }
}

function getPaymentMinAmount(currency: string): number {
  return PAYMENT_MIN_AMOUNTS[currency] ?? 0.01;
}

function roundPaymentAmount(amount: number, currency: string): number {
  if (DECIMAL_CURRENCIES.has(currency)) {
    return Math.round(amount * 100) / 100;
  }
  return Math.round(amount);
}

function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number>
): number {
  if (fromCurrency === toCurrency) return amount;

  const fromRate = rates[fromCurrency] || 1;
  const toRate = rates[toCurrency] || 1;
  const amountInUSD = amount / fromRate;
  const convertedAmount = amountInUSD * toRate;
  const withMarkup = convertedAmount * (1 + CURRENCY_MARKUP_PERCENT);
  const rounded = roundPaymentAmount(withMarkup, toCurrency);
  if (rounded <= 0) return getPaymentMinAmount(toCurrency);
  return rounded;
}

function formatChargeAmountForFlutterwave(amount: number, currency: string): number {
  const rounded = roundPaymentAmount(amount, currency);
  const minAmount = getPaymentMinAmount(currency);
  return Math.max(rounded, minAmount);
}

async function getExpectedPaymentAmount(
  baseAmount: number,
  baseCurrency: string,
  paymentCurrency: string
): Promise<number> {
  if (baseCurrency === paymentCurrency) return baseAmount;
  const rates = await getExchangeRates();
  return convertCurrency(baseAmount, baseCurrency, paymentCurrency, rates);
}

function isAmountWithinTolerance(actual: number, expected: number, isCrossCurrency: boolean): boolean {
  if (expected <= 0) return false;
  const relativeTolerance = isCrossCurrency ? 0.05 : 0.01;
  const absoluteTolerance = isCrossCurrency ? 0.02 : 0.01;
  const deviation = Math.abs(actual - expected);
  return deviation <= Math.max(expected * relativeTolerance, absoluteTolerance);
}

/** Flutterwave Standard: meta is limited (~10 keys) and values must be strings. */
const FLUTTERWAVE_META_LIMIT = 10;
const FLUTTERWAVE_META_PRIORITY = [
  "type",
  "user_id",
  "contest_id",
  "contestant_id",
  "vote_quantity",
  "event_id",
  "ticket_type_id",
  "ticket_quantity",
  "campaign_id",
  "influencer_link_id",
  "purchaser_email",
  "purchaser_name",
  "form_id",
] as const;

function buildFlutterwaveMeta(meta: Record<string, unknown>): Record<string, string> {
  const fwMeta: Record<string, string> = {};
  for (const key of FLUTTERWAVE_META_PRIORITY) {
    if (Object.keys(fwMeta).length >= FLUTTERWAVE_META_LIMIT) break;
    const value = meta[key];
    if (value === undefined || value === null || value === "") continue;
    fwMeta[key] = String(value);
  }
  return fwMeta;
}

function parseEnabledCurrencies(raw: string): string[] {
  return raw
    .split(",")
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean);
}

interface PaymentRequest {
  type: "vote" | "ticket" | "wallet" | "donation" | "form";
  amount: number;
  currency: string;
  email: string;
  phone?: string;
  name?: string;
  user_id?: string;
  // Vote specific
  contest_id?: string;
  contestant_id?: string;
  vote_quantity?: number;
  // Ticket specific
  event_id?: string;
  ticket_type_id?: string;
  ticket_quantity?: number;
  // Donation specific
  campaign_id?: string;
  is_anonymous?: boolean;
  donor_message?: string;
  // Form specific
  form_id?: string;
  redirect_url?: string;
  // Influencer tracking
  influencer_link_id?: string;
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
        "flutterwave_default_currency",
        "flutterwave_fee_percentage",
        "flutterwave_fee_fixed",
        "convenience_fee_type",
        "convenience_fee_value",
        "convenience_fee_cap",
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

    // Get secret key: try decrypted RPC first, fallback to plain setting, then env
    let flutterwaveSecretKey = "";
    
    // Use the secure RPC to decrypt the key from platform_settings
    const { data: decryptedKey, error: decryptError } = await supabase
      .rpc("get_decrypted_platform_setting", { p_key: "flutterwave_secret_key" });
    
    if (!decryptError && decryptedKey) {
      flutterwaveSecretKey = decryptedKey;
      console.log("Secret key from DB (decrypted): Found (length:", flutterwaveSecretKey.length, ")");
    } else {
      // Fallback to plain setting_value (for backward compat during migration)
      flutterwaveSecretKey = getSetting("flutterwave_secret_key");
      console.log("Secret key from DB (plain):", flutterwaveSecretKey ? "Found" : "Not found");
    }
    
    if (!flutterwaveSecretKey || flutterwaveSecretKey.includes("****")) {
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
    
    console.log(
      "Payment request received:",
      JSON.stringify({
        type: payload.type,
        amount: payload.amount,
        currency: payload.currency,
        user_id: payload.user_id,
      })
    );

    const purchaserEmailRaw = typeof payload.email === "string" ? payload.email : String(payload.email ?? "");
    const purchaserEmail = purchaserEmailRaw.trim().toLowerCase().slice(0, 255);

    const purchaserNameRaw = typeof payload.name === "string" ? payload.name : String(payload.name ?? "");
    const purchaserName = purchaserNameRaw.trim().slice(0, 100);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const requiresUserId = payload.type !== "form";

    // Validate required fields (server-side)
    if ((requiresUserId && !payload.user_id) || !purchaserEmail || !emailRegex.test(purchaserEmail)) {
      console.error("Missing/invalid required fields");
      return new Response(
        JSON.stringify({ error: requiresUserId ? "Missing or invalid required fields: user_id, email" : "Missing or invalid required fields: email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const paymentCurrency = (payload.currency || defaultCurrency).toUpperCase();
    const paymentMinAmount = getPaymentMinAmount(paymentCurrency);

    const enabledCurrencies = parseEnabledCurrencies(getSetting("flutterwave_currencies"));
    if (enabledCurrencies.length > 0 && !enabledCurrencies.includes(paymentCurrency)) {
      return new Response(
        JSON.stringify({
          error: `Payments in ${paymentCurrency} are not enabled. Supported currencies: ${enabledCurrencies.join(", ")}.`,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!Number.isFinite(payload.amount) || payload.amount < paymentMinAmount) {
      return new Response(
        JSON.stringify({
          error: `Amount must be at least ${paymentMinAmount} ${paymentCurrency}`,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // SERVER-SIDE PRICE VERIFICATION: Recalculate expected price from DB
    let serverVerifiedAmount = payload.amount;
    let itemBaseCurrency: string | null = null;
    let itemBaseAmount: number | null = null;
    
    if (payload.type === "vote" && payload.contest_id && payload.vote_quantity) {
      const { data: contest, error: contestErr } = await supabase
        .from("contests")
        .select("vote_price, vote_currency, start_date, end_date, is_active")
        .eq("id", payload.contest_id)
        .single();
      
      if (contestErr || !contest) {
        console.error("Contest not found for price verification:", contestErr?.message);
        return new Response(
          JSON.stringify({ error: "Contest not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const nowTs = new Date();
      const startTs = contest.start_date ? new Date(contest.start_date) : null;
      const endTs = contest.end_date ? new Date(contest.end_date) : null;

      if (startTs && nowTs < startTs) {
        return new Response(
          JSON.stringify({
            error: `Voting has not started yet. Voting opens on ${startTs.toLocaleString()}.`,
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (endTs && nowTs > endTs) {
        return new Response(
          JSON.stringify({ error: "Voting has ended for this contest." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (contest.is_active === false && startTs && nowTs >= startTs) {
        return new Response(
          JSON.stringify({ error: "Voting is currently closed for this contest." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const { data: voteOptions } = await supabase
        .from("contest_vote_options")
        .select("vote_quantity, price")
        .eq("contest_id", payload.contest_id);

      const normalizedOptions = (voteOptions || [])
        .map((option) => ({
          vote_quantity: Number(option.vote_quantity),
          price: Number(option.price),
        }))
        .filter((option) => Number.isFinite(option.vote_quantity) && option.vote_quantity > 0 && Number.isFinite(option.price))
        .sort((a, b) => a.vote_quantity - b.vote_quantity);

      const matchingOption = normalizedOptions.find((option) => option.vote_quantity === payload.vote_quantity);

      let fallbackUnitPrice = Number(contest.vote_price);
      if (!Number.isFinite(fallbackUnitPrice) || fallbackUnitPrice <= 0) {
        const smallestOption = normalizedOptions[0];
        if (smallestOption) {
          fallbackUnitPrice = smallestOption.price / smallestOption.vote_quantity;
        }
      }

      const expectedBaseAmount = matchingOption
        ? matchingOption.price
        : fallbackUnitPrice * payload.vote_quantity;
      const baseCurrency = contest.vote_currency || defaultCurrency;
      itemBaseCurrency = baseCurrency;
      itemBaseAmount = expectedBaseAmount;
      const isCrossCurrency = baseCurrency !== payload.currency;
      const expectedPaymentAmount = await getExpectedPaymentAmount(
        expectedBaseAmount,
        baseCurrency,
        payload.currency
      );
      if (!isAmountWithinTolerance(payload.amount, expectedPaymentAmount, isCrossCurrency)) {
        const deviation = Math.abs(payload.amount - expectedPaymentAmount) / expectedPaymentAmount;
        console.error(
          `Price manipulation detected! Expected ${expectedPaymentAmount} ${payload.currency} ` +
          `(base ${expectedBaseAmount} ${baseCurrency}), got ${payload.amount} ${payload.currency}, ` +
          `deviation ${(deviation * 100).toFixed(2)}%, cross-currency: ${isCrossCurrency}`
        );
        return new Response(
          JSON.stringify({ error: "Price verification failed. Please refresh and try again." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (!isCrossCurrency) {
        serverVerifiedAmount = expectedBaseAmount;
        console.log(`Using server-verified vote amount: ${serverVerifiedAmount}`);
      } else {
        serverVerifiedAmount = roundPaymentAmount(payload.amount, payload.currency);
        console.log(`Using cross-currency vote amount: ${serverVerifiedAmount} ${payload.currency}`);
      }
    }
    
    if (payload.type === "ticket" && payload.event_id && payload.ticket_type_id && payload.ticket_quantity) {
      const { data: ticketType, error: ticketErr } = await supabase
        .from("ticket_types")
        .select("price, currency")
        .eq("id", payload.ticket_type_id)
        .single();
      
      if (!ticketErr && ticketType) {
        const expectedBaseAmount = ticketType.price * payload.ticket_quantity;
        const baseCurrency = ticketType.currency || defaultCurrency;
        itemBaseCurrency = baseCurrency;
        itemBaseAmount = expectedBaseAmount;
        const isCrossCurrency = baseCurrency !== payload.currency;
        const expectedPaymentAmount = await getExpectedPaymentAmount(
          expectedBaseAmount,
          baseCurrency,
          payload.currency
        );
        if (!isAmountWithinTolerance(payload.amount, expectedPaymentAmount, isCrossCurrency)) {
          const deviation = Math.abs(payload.amount - expectedPaymentAmount) / expectedPaymentAmount;
          console.error(
            `Ticket price manipulation detected! Expected ${expectedPaymentAmount} ${payload.currency} ` +
            `(base ${expectedBaseAmount} ${baseCurrency}), got ${payload.amount} ${payload.currency}, ` +
            `deviation ${(deviation * 100).toFixed(2)}%, cross-currency: ${isCrossCurrency}`
          );
          return new Response(
            JSON.stringify({ error: "Price verification failed. Please refresh and try again." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        // For same-currency payments, use the authoritative DB price
        if (!isCrossCurrency) {
          serverVerifiedAmount = expectedBaseAmount;
          console.log(`Using server-verified ticket amount: ${serverVerifiedAmount}`);
        } else {
          serverVerifiedAmount = roundPaymentAmount(payload.amount, payload.currency);
          console.log(`Using cross-currency ticket amount: ${serverVerifiedAmount} ${payload.currency}`);
        }
      }
    }
    
    console.log("Server-side price verification passed for amount:", payload.amount);

    // Guests must provide full name for ticket purchases
    if (payload.type === "ticket" && String(payload.user_id).startsWith("guest_") && !purchaserName) {
      return new Response(
        JSON.stringify({ error: "Full name is required for guest ticket purchases" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tx_ref = `${payload.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Build meta data based on payment type
    const meta: Record<string, any> = {
      user_id: payload.user_id || "",
      type: payload.type,
      // Always include purchaser identity in meta so we can trust it later
      // even if Flutterwave normalizes/overwrites `customer.name`.
      purchaser_email: purchaserEmail,
    };

    if (purchaserName) meta.purchaser_name = purchaserName;

    // Add influencer tracking if present
    if (payload.influencer_link_id) {
      meta.influencer_link_id = payload.influencer_link_id;
    }

    if (payload.type === "vote") {
      meta.contest_id = payload.contest_id;
      meta.contestant_id = payload.contestant_id;
      meta.vote_quantity = Number(payload.vote_quantity) || 1;
    } else if (payload.type === "ticket") {
      meta.event_id = payload.event_id;
      meta.ticket_type_id = payload.ticket_type_id;
      meta.ticket_quantity = payload.ticket_quantity;
    } else if (payload.type === "wallet") {
      meta.funding_amount = payload.amount; // The actual amount to credit to wallet
    } else if (payload.type === "donation") {
      meta.campaign_id = payload.campaign_id;
      meta.is_anonymous = payload.is_anonymous;
      meta.donor_message = payload.donor_message;
    } else if (payload.type === "form") {
      meta.form_id = payload.form_id;
    }

    // Use the redirect URL from the client request - this should be the origin where the payment was initiated
    // The client MUST pass the correct redirect_url based on their current location (production or preview)
    const redirectUrl = payload.redirect_url || "https://www.useqiv.com/payment-callback";

    const getPaymentTitle = () => {
      switch (payload.type) {
        case "vote": return "Vote Purchase";
        case "ticket": return "Ticket Purchase";
        case "wallet": return "Wallet Funding";
        case "donation": return "Campaign Donation";
        case "form": return "Form Submission Payment";
        default: return "Payment";
      }
    };

    const getPaymentDescription = () => {
      switch (payload.type) {
        case "vote": return `Purchase ${payload.vote_quantity || 1} vote(s)`;
        case "ticket": return `Purchase ${payload.ticket_quantity || 1} ticket(s)`;
        case "wallet": return `Fund wallet with ${payload.currency || defaultCurrency} ${payload.amount}`;
        case "donation": return `Donate ${payload.currency || defaultCurrency} ${payload.amount} to campaign`;
        case "form": return "Payment required to submit form";
        default: return "Payment";
      }
    };

    // --- Fee Calculation (server-side) ---
    const WALLET_ADMIN_FEE_RATE = 0.03;
    const fwFeePercentage = parseFloat(getSetting("flutterwave_fee_percentage")) || 0;
    const fwFeeFixed = parseFloat(getSetting("flutterwave_fee_fixed")) || 0;
    const convFeeType = getSetting("convenience_fee_type") || "none";
    const convFeeValue = parseFloat(getSetting("convenience_fee_value")) || 0;
    const convFeeCap = parseFloat(getSetting("convenience_fee_cap")) || 0;

    const computeChargeWithFees = (baseAmount: number, currency: string): number => {
      if (payload.type === "wallet") {
        const adminFee = Math.round(baseAmount * WALLET_ADMIN_FEE_RATE * 100) / 100;
        return formatChargeAmountForFlutterwave(baseAmount + adminFee, currency);
      }

      let paymentMethodFee = (baseAmount * fwFeePercentage) / 100 + fwFeeFixed;
      paymentMethodFee = roundPaymentAmount(paymentMethodFee, currency);

      let convenienceFee = 0;
      if (convFeeType === "percentage") {
        convenienceFee = (baseAmount * convFeeValue) / 100;
      } else if (convFeeType === "fixed") {
        convenienceFee = convFeeValue;
      }
      if (convFeeCap > 0 && convenienceFee > convFeeCap) {
        convenienceFee = convFeeCap;
      }
      convenienceFee = roundPaymentAmount(convenienceFee, currency);

      const totalFees = roundPaymentAmount(paymentMethodFee + convenienceFee, currency);
      const total = formatChargeAmountForFlutterwave(baseAmount + totalFees, currency);

      if (totalFees > 0) {
        meta.platform_fees = totalFees;
      }
      return total;
    };

    // Always charge in the currency the user selected
    const chargeCurrency = paymentCurrency;
    const chargeAmount = computeChargeWithFees(serverVerifiedAmount, chargeCurrency);
    meta.charge_currency = chargeCurrency;

    if (payload.type === "wallet") {
      console.log(`Wallet funding: base=${serverVerifiedAmount}, total charged=${chargeAmount} ${chargeCurrency}`);
    } else if (meta.platform_fees) {
      console.log(`Fees applied: total fees=${meta.platform_fees}, charge=${chargeAmount} ${chargeCurrency}`);
    }

    // Listing currency for org reporting; payment currency is what Flutterwave charges
    if (
      itemBaseAmount != null &&
      itemBaseCurrency &&
      (payload.type === "vote" || payload.type === "ticket")
    ) {
      meta.base_currency = itemBaseCurrency;
      meta.base_amount = itemBaseAmount;
    } else {
      meta.base_amount = serverVerifiedAmount;
      meta.base_currency = chargeCurrency;
    }
    meta.payment_currency = chargeCurrency;
    meta.payment_amount = serverVerifiedAmount;

    if (!Number.isFinite(chargeAmount) || chargeAmount <= 0) {
      return new Response(
        JSON.stringify({ error: "Invalid payment amount. Please refresh and try again." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Flutterwave international card checkout typically requires at least 1 unit (USD/EUR/GBP)
    const internationalCardCurrencies = new Set(["USD", "EUR", "GBP"]);
    if (internationalCardCurrencies.has(chargeCurrency) && chargeAmount < 1) {
      return new Response(
        JSON.stringify({
          error: `Minimum payment for ${chargeCurrency} is 1. Please select more votes or choose another currency.`,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const customer: Record<string, string> = {
      email: purchaserEmail,
      name: purchaserName || "Customer",
    };
    if (payload.phone?.trim()) {
      customer.phonenumber = payload.phone.trim();
    }

    const flutterwavePayload = {
      tx_ref,
      amount: chargeAmount,
      currency: chargeCurrency,
      redirect_url: `https://tirqmqzgksclsjxfiham.supabase.co/functions/v1/flutterwave-webhook?redirect=${encodeURIComponent(redirectUrl)}`,
      customer,
      meta: buildFlutterwaveMeta(meta),
      customizations: {
        title: getPaymentTitle(),
        description: getPaymentDescription(),
        logo: "https://tirqmqzgksclsjxfiham.supabase.co/storage/v1/object/public/avatars/logo.png",
      },
    };

    console.log("Calling Flutterwave API...", JSON.stringify({
      currency: chargeCurrency,
      amount: chargeAmount,
      metaKeys: Object.keys(flutterwavePayload.meta),
    }));

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
      console.error("Flutterwave error:", data.message, "payload:", JSON.stringify(flutterwavePayload));
      let errorMessage = data.message || "Failed to initialize payment";
      if (String(errorMessage).toLowerCase().includes("required parameters")) {
        errorMessage =
          `Could not start ${chargeCurrency} checkout. Confirm ${chargeCurrency} is enabled in Admin > Flutterwave settings and on your Flutterwave dashboard.`;
      }
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Store pending transaction in database
    // Check if this is a guest user
    const isGuestUser = !payload.user_id || String(payload.user_id).startsWith("guest_");
    
    let walletId: string | null = null;
    
    if (!isGuestUser) {
      // Only look up wallet for authenticated users
      const { data: wallet, error: walletError } = await supabase
        .from("wallets")
        .select("id")
        .eq("user_id", payload.user_id)
        .single();

      if (walletError) {
        console.log("Wallet lookup error (non-critical):", walletError.message);
      }
      
      walletId = wallet?.id || null;
    }

    // Always create a wallet transaction record for tracking (even for guests)
    // Map wallet funding to 'deposit' type for DB constraint
    const transactionType = payload.type === "wallet" ? "deposit" : payload.type;

    // Persist fulfillment fields so webhook can record votes/tickets if Flutterwave meta is incomplete
    const paymentMetadata: Record<string, unknown> = {
      ...meta,
      base_amount: meta.base_amount ?? serverVerifiedAmount,
    };

    const txInsertData: Record<string, any> = {
      amount: serverVerifiedAmount,
      type: transactionType,
      status: "pending",
      reference_id: tx_ref,
      currency: chargeCurrency,
      payment_metadata: paymentMetadata,
      description: payload.type === "wallet" 
        ? `Wallet funding via Flutterwave (${transactionCurrency})`
        : `Pending ${payload.type} payment via Flutterwave${isGuestUser ? ' (guest)' : ''}`,
    };
    
    // Only set user_id and wallet_id for authenticated users
    if (!isGuestUser) {
      if (!walletId) {
        console.error("Wallet not found for authenticated user:", payload.user_id);
        return new Response(
          JSON.stringify({ error: "Wallet not found. Please contact support." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      txInsertData.user_id = payload.user_id;
      txInsertData.wallet_id = walletId;
    }
    
    if (payload.type !== "form") {
      const { error: txError } = await supabase.from("wallet_transactions").insert(txInsertData);

      if (txError) {
        console.error("Failed to record pending transaction:", txError.message);
        return new Response(
          JSON.stringify({ error: "Unable to initialize payment tracking. Please try again." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("Pending transaction recorded for tx_ref:", tx_ref, isGuestUser ? "(guest)" : "(authenticated)");
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
