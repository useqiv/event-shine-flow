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
      funding_amount?: number;
      // Donation specific
      campaign_id?: string;
      is_anonymous?: boolean;
      donor_message?: string;
      // Influencer tracking
      influencer_link_id?: string;
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
    const rawRedirect = url.searchParams.get("redirect") || "";

    // SECURITY: Validate redirect URL to prevent open redirects
    const ALLOWED_REDIRECT_ORIGINS = [
      "https://www.useqiv.com",
      "https://useqiv.com",
      "https://event-shine-flow.lovable.app",
      "https://id-preview--74593814-f7ac-474b-bfdc-a5df535f275e.lovable.app",
    ];
    
    let redirectUrl = "https://www.useqiv.com/payment-callback";
    try {
      const parsedRedirect = new URL(rawRedirect);
      // Only allow HTTPS and whitelisted origins (or *.lovable.app)
      if (
        parsedRedirect.protocol === "https:" &&
        (ALLOWED_REDIRECT_ORIGINS.includes(parsedRedirect.origin) ||
         parsedRedirect.hostname.endsWith(".lovable.app"))
      ) {
        redirectUrl = rawRedirect;
      } else {
        console.warn("Blocked untrusted redirect origin:", parsedRedirect.origin);
      }
    } catch {
      console.warn("Invalid redirect URL, using default:", rawRedirect);
    }

    console.log("Redirect params:", { status, tx_ref, transaction_id });

    // Flutterwave returns either "successful" or "completed" depending on context
    const isSuccessful = status === "successful" || status === "completed";
    
    if (isSuccessful && (transaction_id || tx_ref)) {
      try {
        // Prefer DB setting (platform_settings) to avoid env mismatches
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data: settings, error: settingsError } = await supabase
          .from("platform_settings")
          .select("setting_key, setting_value")
          .in("setting_key", ["flutterwave_secret_key"]);

        if (settingsError) {
          console.error("Failed to fetch Flutterwave secret key from DB:", settingsError.message);
        }

        // Use secure RPC to decrypt the key
        const { data: decryptedKey, error: decryptError } = await supabase
          .rpc("get_decrypted_platform_setting", { p_key: "flutterwave_secret_key" });
        
        let flutterwaveSecretKey = "";
        if (!decryptError && decryptedKey) {
          flutterwaveSecretKey = decryptedKey;
        } else {
          // Fallback to plain value then env
          const dbSecret = settings?.find((s) => s.setting_key === "flutterwave_secret_key")?.setting_value || "";
          flutterwaveSecretKey = (dbSecret && !dbSecret.includes("****")) ? dbSecret : (Deno.env.get("FLUTTERWAVE_SECRET_KEY") || "");
        }

        const verifyUrl = transaction_id
          ? `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`
          : `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(tx_ref!)}`;

        console.log("Verifying transaction via:", transaction_id ? "id" : "tx_ref", transaction_id || tx_ref);

        const verifyResponse = await fetch(verifyUrl, {
          headers: {
            Authorization: `Bearer ${flutterwaveSecretKey}`,
          },
        });

        const verifyData = await verifyResponse.json();
        console.log("Verification response:", JSON.stringify(verifyData));

        // Flutterwave API returns status "success" and data.status "successful"
        if (verifyData.status === "success" && verifyData.data.status === "successful") {
          console.log("Processing verified payment...");
          await processSuccessfulPayment(verifyData.data);
          console.log("Payment processing completed");
        } else {
          console.log("Payment verification failed:", verifyData.status, verifyData.data?.status);
        }
      } catch (error: any) {
        console.error("Verification error:", error.message);
      }
    } else {
      console.log("Payment not successful or missing transaction_id/tx_ref:", { status, transaction_id, tx_ref });
      
      // Mark transaction as failed/cancelled if we have a tx_ref
      if (tx_ref && (status === "cancelled" || status === "failed" || !isSuccessful)) {
        try {
          const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
          const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
          const supabase = createClient(supabaseUrl, supabaseKey);
          
          const { error: updateError } = await supabase
            .from("wallet_transactions")
            .update({ status: "failed" })
            .eq("reference_id", tx_ref)
            .eq("status", "pending");
            
          if (updateError) {
            console.error("Failed to mark transaction as failed:", updateError.message);
          } else {
            console.log("Marked transaction as failed for tx_ref:", tx_ref);
          }
        } catch (e: any) {
          console.error("Error updating failed transaction:", e.message);
        }
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
    // CRITICAL: Verify webhook signature - this is MANDATORY to prevent forged payments
    const flutterwaveSecretHash = Deno.env.get("FLUTTERWAVE_SECRET_HASH");
    const signature = req.headers.get("verif-hash");
    
    // Signature verification is mandatory - reject if not configured
    if (!flutterwaveSecretHash) {
      console.error("CRITICAL: FLUTTERWAVE_SECRET_HASH not configured - webhook verification disabled");
      // In production, we should reject unsigned webhooks
      // Check if this appears to be a production environment
      const isProduction = !Deno.env.get("SUPABASE_URL")?.includes("localhost");
      if (isProduction) {
        console.error("Rejecting webhook in production without signature verification");
        return new Response(JSON.stringify({ 
          error: "Webhook signature verification not configured. Please set FLUTTERWAVE_SECRET_HASH." 
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
    
    if (flutterwaveSecretHash && signature) {
      if (signature !== flutterwaveSecretHash) {
        console.error("Invalid webhook signature - possible forgery attempt");
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.log("Webhook signature verified successfully");
    } else if (flutterwaveSecretHash && !signature) {
      // Secret is configured but no signature provided - reject
      console.error("Webhook missing signature header");
      return new Response(JSON.stringify({ error: "Missing signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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

async function recordInfluencerConversion(supabase: any, influencerLinkId: string, amount: number) {
  try {
    console.log("Recording influencer conversion for link:", influencerLinkId, "amount:", amount);

    // Get the influencer link to calculate commission
    const { data: link, error: linkError } = await supabase
      .from("influencer_links")
      .select("*")
      .eq("id", influencerLinkId)
      .single();

    if (linkError || !link) {
      console.error("Could not find influencer link:", linkError?.message);
      return;
    }

    // Calculate commission
    let commission = 0;
    if (link.commission_type === "percentage") {
      commission = (amount * link.commission_value) / 100;
    } else {
      commission = link.commission_value;
    }

    console.log("Calculated commission:", commission, "for amount:", amount, "commission_type:", link.commission_type, "commission_value:", link.commission_value);

    // Find the most recent untracked click for this link
    const { data: clicks, error: clickError } = await supabase
      .from("influencer_clicks")
      .select("id")
      .eq("link_id", influencerLinkId)
      .eq("converted", false)
      .order("clicked_at", { ascending: false })
      .limit(1);

    if (clickError) {
      console.error("Error finding influencer click:", clickError.message);
    }

    if (clicks && clicks.length > 0) {
      // Update the click as converted
      const { error: updateClickError } = await supabase
        .from("influencer_clicks")
        .update({
          converted: true,
          conversion_amount: amount,
          converted_at: new Date().toISOString(),
        })
        .eq("id", clicks[0].id);

      if (updateClickError) {
        console.error("Error updating click conversion:", updateClickError.message);
      } else {
        console.log("Marked click as converted:", clicks[0].id);
      }
    }

    // Update link totals
    const { error: updateLinkError } = await supabase
      .from("influencer_links")
      .update({
        total_conversions: link.total_conversions + 1,
        total_revenue: link.total_revenue + amount,
        total_commission: link.total_commission + commission,
      })
      .eq("id", influencerLinkId);

    if (updateLinkError) {
      console.error("Error updating influencer link stats:", updateLinkError.message);
    } else {
      console.log("Updated influencer link stats - conversions:", link.total_conversions + 1, "revenue:", link.total_revenue + amount, "commission:", link.total_commission + commission);
    }

    // Credit commission to influencer's profile if they have claimed the link
    if (link.influencer_user_id && commission > 0) {
      console.log("Crediting commission to influencer:", link.influencer_user_id);

      // Check if influencer profile exists
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from("influencer_profiles")
        .select("id, pending_earnings, total_earnings")
        .eq("user_id", link.influencer_user_id)
        .maybeSingle();

      if (profileCheckError) {
        console.error("Error checking influencer profile:", profileCheckError.message);
      }

      if (existingProfile) {
        // Update existing profile - add to pending_earnings and total_earnings
        const newPendingEarnings = (existingProfile.pending_earnings || 0) + commission;
        const newTotalEarnings = (existingProfile.total_earnings || 0) + commission;

        const { error: updateProfileError } = await supabase
          .from("influencer_profiles")
          .update({
            pending_earnings: newPendingEarnings,
            total_earnings: newTotalEarnings,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingProfile.id);

        if (updateProfileError) {
          console.error("Error updating influencer profile earnings:", updateProfileError.message);
        } else {
          console.log("Credited", commission, "to influencer profile. New pending:", newPendingEarnings, "Total:", newTotalEarnings);
        }
      } else {
        // Create new profile with the commission
        const { error: insertProfileError } = await supabase
          .from("influencer_profiles")
          .insert({
            user_id: link.influencer_user_id,
            pending_earnings: commission,
            total_earnings: commission,
            paid_earnings: 0,
          });

        if (insertProfileError) {
          console.error("Error creating influencer profile:", insertProfileError.message);
        } else {
          console.log("Created influencer profile with initial commission:", commission);
        }
      }

      // Send notification to the influencer about their earned commission
      const commissionCurrency = link.commission_currency || "NGN";
      await supabase.from("notifications").insert({
        user_id: link.influencer_user_id,
        title: "Commission Earned!",
        message: `You earned ${commissionCurrency} ${commission.toFixed(2)} commission from a referral purchase.`,
        type: "influencer",
        reference_id: link.id,
      });

      console.log("Sent commission notification to influencer:", link.influencer_user_id);
    } else if (!link.influencer_user_id) {
      console.log("Influencer link not yet claimed by any user, commission tracked but not credited to profile");
    }

  } catch (error: any) {
    console.error("Error recording influencer conversion:", error.message);
  }
}

async function sendReceipt(receiptData: any, userId?: string, supabaseClient?: any) {
  try {
    // Fallback to profile email if customer email is missing
    if (!receiptData.user_email && userId && supabaseClient) {
      console.log("No customer email provided, looking up profile for user:", userId);
      const { data: profile, error: profileError } = await supabaseClient
        .from("profiles")
        .select("email, full_name")
        .eq("id", userId)
        .single();
      
      if (profileError) {
        console.error("Failed to fetch profile for email fallback:", profileError.message);
      } else if (profile?.email) {
        receiptData.user_email = profile.email;
        receiptData.user_name = profile.full_name || receiptData.user_name || "Valued Customer";
        console.log("Using profile email for receipt:", profile.email);
      }
    }

    if (!receiptData.user_email) {
      console.error("Cannot send receipt - no email address available. Receipt data:", JSON.stringify(receiptData));
      return;
    }

    console.log("Sending receipt email to:", receiptData.user_email, "Type:", receiptData.type);
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const response = await fetch(`${supabaseUrl}/functions/v1/send-payment-receipt`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
      body: JSON.stringify(receiptData),
    });

    const responseText = await response.text();
    
    if (response.ok) {
      console.log("Receipt email sent successfully. Response:", responseText);
    } else {
      console.error("Failed to send receipt. Status:", response.status, "Response:", responseText);
    }
  } catch (error: any) {
    console.error("Error sending receipt:", error.message, error.stack);
  }
}

async function sendOrgTransactionNotification(notificationData: {
  type: 'vote' | 'ticket' | 'donation';
  organization_id: string;
  amount: number;
  currency: string;
  quantity?: number;
  contest_title?: string;
  contestant_name?: string;
  voter_name?: string;
  voter_email?: string;
  event_title?: string;
  ticket_type?: string;
  buyer_name?: string;
  buyer_email?: string;
  campaign_title?: string;
  donor_name?: string;
  donor_email?: string;
}) {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const response = await fetch(`${supabaseUrl}/functions/v1/send-org-transaction-notification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
      body: JSON.stringify(notificationData),
    });

    const responseText = await response.text();
    
    if (response.ok) {
      console.log("Org transaction notification sent successfully. Response:", responseText);
    } else {
      console.error("Failed to send org notification. Status:", response.status, "Response:", responseText);
    }
  } catch (error: any) {
    console.error("Error sending org transaction notification:", error.message);
  }
}

/** Flutterwave sometimes returns meta as an object or as [{ meta_name, meta_value }]. */
function normalizeFlutterwaveMeta(raw: unknown): Record<string, unknown> {
  if (!raw) return {};
  if (Array.isArray(raw)) {
    const out: Record<string, unknown> = {};
    for (const item of raw) {
      if (item && typeof item === "object" && "meta_name" in item && "meta_value" in item) {
        const row = item as { meta_name: string; meta_value: unknown };
        out[row.meta_name] = row.meta_value;
      }
    }
    return out;
  }
  if (typeof raw === "object") return { ...(raw as Record<string, unknown>) };
  return {};
}

function inferPaymentType(txRef: string | undefined, storedType: unknown): string | undefined {
  if (typeof storedType === "string" && storedType) return storedType;
  if (!txRef) return undefined;
  const prefix = txRef.split("_")[0];
  if (["vote", "ticket", "wallet", "donation", "form"].includes(prefix)) return prefix;
  return undefined;
}

/** Fields required for vote/ticket fulfillment — DB copy wins over Flutterwave meta. */
const FULFILLMENT_META_KEYS = [
  "type",
  "user_id",
  "contest_id",
  "contestant_id",
  "vote_quantity",
  "event_id",
  "ticket_type_id",
  "ticket_quantity",
  "base_amount",
  "base_currency",
  "payment_amount",
  "payment_currency",
  "campaign_id",
  "funding_amount",
  "form_id",
  "purchaser_email",
  "purchaser_name",
  "influencer_link_id",
  "is_anonymous",
  "donor_message",
] as const;

function hasMetaValue(value: unknown): boolean {
  return value !== undefined && value !== null && value !== "";
}

function mergePaymentMeta(
  paymentData: { tx_ref?: string; meta?: unknown },
  walletTx: { payment_metadata?: unknown } | null,
): Record<string, unknown> {
  const fromFlutterwave = normalizeFlutterwaveMeta(paymentData.meta);
  const fromDb = normalizeFlutterwaveMeta(walletTx?.payment_metadata);
  const merged = { ...fromFlutterwave, ...fromDb };

  // Prefer our stored payment_metadata for fulfillment (Flutterwave may omit or alter meta)
  for (const key of FULFILLMENT_META_KEYS) {
    if (hasMetaValue(fromDb[key])) {
      merged[key] = fromDb[key];
    }
  }

  const type = inferPaymentType(paymentData.tx_ref, merged.type);
  if (type) merged.type = type;
  return merged;
}

async function notifyAdminsOfFailure(
  supabase: any,
  errorType: "vote" | "ticket",
  errorMessage: string,
  paymentData: any,
  meta: any
) {
  try {
    // Fetch all admin user ids
    const { data: adminRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (rolesError || !adminRoles?.length) {
      console.error("Could not fetch admin users for failure alert:", rolesError?.message);
      return;
    }

    const notifications = adminRoles.map((r: { user_id: string }) => ({
      user_id: r.user_id,
      title: `Payment Recorded but ${errorType === "vote" ? "Vote" : "Ticket"} Insert Failed`,
      message: `tx_ref: ${paymentData.tx_ref}, amount: ${paymentData.amount} ${paymentData.currency || "NGN"}. Error: ${errorMessage}`,
      type: "system",
      reference_id: meta.contest_id || meta.event_id || null,
    }));

    const { error: notifError } = await supabase.from("notifications").insert(notifications);
    if (notifError) {
      console.error("Failed to insert admin failure notifications:", notifError.message);
    } else {
      console.log(`Notified ${notifications.length} admin(s) about ${errorType} insert failure`);
    }
  } catch (err: any) {
    console.error("Error notifying admins:", err.message);
  }
}

async function processSuccessfulPayment(paymentData: any) {
  console.log("Processing successful payment, tx_ref:", paymentData.tx_ref);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Find the wallet transaction created during payment initialization (includes stored payment_metadata)
  const { data: walletTx, error: walletTxError } = await supabase
    .from("wallet_transactions")
    .select("id, user_id, wallet_id, status, amount, payment_metadata")
    .eq("reference_id", paymentData.tx_ref)
    .maybeSingle();

  if (walletTxError) {
    console.error("Failed to load wallet transaction:", walletTxError.message);
  }

  const meta = mergePaymentMeta(paymentData, walletTx);
  const {
    user_id,
    type,
    contest_id,
    contestant_id,
    vote_quantity,
    event_id,
    ticket_type_id,
    ticket_quantity,
    funding_amount,
    campaign_id,
    is_anonymous,
    donor_message,
    influencer_link_id,
  } = meta as {
    user_id?: string;
    type?: string;
    contest_id?: string;
    contestant_id?: string;
    vote_quantity?: number | string;
    event_id?: string;
    ticket_type_id?: string;
    ticket_quantity?: number | string;
    funding_amount?: number;
    campaign_id?: string;
    is_anonymous?: boolean;
    donor_message?: string;
    influencer_link_id?: string;
  };
  const customer = paymentData.customer || {};

  // Flutterwave transaction id (numeric) – useful for logging but NOT a FK to our DB
  const flw_transaction_id = String(paymentData.id || "");

  console.log("Payment meta:", JSON.stringify(meta));
  console.log("Flutterwave transaction id:", flw_transaction_id);

  // Fetch platform commission settings
  const { data: commissionSettings, error: commissionError } = await supabase
    .from("platform_settings")
    .select("setting_key, setting_value")
    .in("setting_key", [
      "vote_commission_percentage",
      "ticket_commission_percentage",
      "campaign_commission_percentage",
      "influencer_commission_percentage"
    ]);

  if (commissionError) {
    console.error("Failed to fetch commission settings:", commissionError.message);
  }

  // Parse commission rates (default to 10% if not set)
  const getCommissionRate = (key: string): number => {
    const setting = commissionSettings?.find(s => s.setting_key === key);
    if (setting?.setting_value) {
      const rate = parseFloat(setting.setting_value);
      return isNaN(rate) ? 10 : rate;
    }
    return 10; // Default 10%
  };

  const voteCommissionRate = getCommissionRate("vote_commission_percentage");
  const ticketCommissionRate = getCommissionRate("ticket_commission_percentage");
  const campaignCommissionRate = getCommissionRate("campaign_commission_percentage");

  console.log("Commission rates - Vote:", voteCommissionRate, "Ticket:", ticketCommissionRate, "Campaign:", campaignCommissionRate);

  // Helper to calculate commission and net amount
  const calculateCommission = (amount: number, rate: number): { commission: number; netAmount: number } => {
    const commission = Math.round((amount * rate / 100) * 100) / 100; // Round to 2 decimal places
    const netAmount = Math.round((amount - commission) * 100) / 100;
    return { commission, netAmount };
  };

  const resolvePaymentMethod = (pd: any): "wallet" | "card" | "bank_transfer" | "usdt" => {
    const allowed = new Set(["wallet", "card", "bank_transfer", "usdt"]);

    const raw = String(pd?.payment_type || "").toLowerCase().trim();
    if (allowed.has(raw)) return raw as any;

    // Common Flutterwave values
    if (raw.includes("bank") || raw.includes("transfer")) return "bank_transfer";
    if (raw.includes("usdt") || String(pd?.currency || "").toUpperCase() === "USDT") return "usdt";

    // Default to card to satisfy DB constraint
    return "card";
  };

  const toPositiveInt = (value: unknown, fallback: number) => {
    const n = typeof value === "number" ? value : Number(String(value ?? "").trim());
    if (!Number.isFinite(n)) return fallback;
    const i = Math.floor(n);
    return i > 0 ? i : fallback;
  };

  const payment_method = resolvePaymentMethod(paymentData);

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  const runWithRetry = async <T>(
    label: string,
    operation: () => Promise<T>,
    maxAttempts = 3,
    delayMs = 400
  ): Promise<T> => {
    let lastError: unknown = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        console.error(`${label} attempt ${attempt}/${maxAttempts} failed:`, error);
        if (attempt < maxAttempts) {
          await sleep(delayMs * attempt);
        }
      }
    }
    throw lastError instanceof Error ? lastError : new Error(`${label} failed after ${maxAttempts} attempts`);
  };

  const updateWalletTxStatus = async (status: "pending" | "completed" | "failed") => {
    if (!walletTx?.id) {
      console.log("No wallet_transactions row found for tx_ref:", paymentData.tx_ref);
      return;
    }

    const updatePayload: Record<string, unknown> = { status };
    if (status === "completed") {
      const gateway_transaction_id =
        paymentData.id != null && paymentData.id !== ""
          ? String(paymentData.id)
          : null;
      const gateway_provider_reference =
        paymentData.flw_ref != null && paymentData.flw_ref !== ""
          ? String(paymentData.flw_ref)
          : null;
      if (gateway_transaction_id) updatePayload.gateway_transaction_id = gateway_transaction_id;
      if (gateway_provider_reference) updatePayload.gateway_provider_reference = gateway_provider_reference;
    }

    const { error: updateError } = await supabase
      .from("wallet_transactions")
      .update(updatePayload)
      .eq("id", walletTx.id);

    if (updateError) {
      console.log(`Transaction status update error (${status}):`, updateError.message);
      return;
    }

    console.log(`Transaction marked as ${status}:`, walletTx.id);
  };

  // IMPORTANT: votes.transaction_id & tickets.transaction_id reference wallet_transactions.id (UUID)
  const db_transaction_id: string | null = walletTx?.id ?? null;

  const hasVoteIdentity = Boolean(
    user_id ||
    meta.purchaser_email ||
    meta.purchaser_name ||
    customer.email ||
    customer.name,
  );

  if (type === "vote" && contest_id && contestant_id && hasVoteIdentity) {
    console.log("Recording vote...");
    const grossAmount = Number(paymentData.amount) || 0;
    const baseAmount = Number(meta.base_amount ?? walletTx?.amount ?? grossAmount);
    const voteCurrency =
      (typeof meta.base_currency === "string" && meta.base_currency) ||
      paymentData.currency ||
      "NGN";
    const recordedVoteQuantity = toPositiveInt(vote_quantity, 1);
    console.log(
      `Vote fulfillment: quantity=${recordedVoteQuantity}, amount_paid=${baseAmount} ${voteCurrency}, contest=${contest_id}, contestant=${contestant_id}`,
    );

    // Get contest and contestant details
    const { data: contest } = await supabase
      .from("contests")
      .select("title, organization_id, start_date, end_date, is_active")
      .eq("id", contest_id)
      .single();

    if (contest) {
      const nowTs = new Date();
      const startTs = contest.start_date ? new Date(contest.start_date) : null;
      const endTs = contest.end_date ? new Date(contest.end_date) : null;

      if (startTs && nowTs < startTs) {
        console.error("Vote rejected: contest has not started yet", contest_id);
        await updateWalletTxStatus("failed");
        return;
      }
      if (endTs && nowTs > endTs) {
        console.error("Vote rejected: contest has ended", contest_id);
        await updateWalletTxStatus("failed");
        return;
      }
      if (contest.is_active === false && startTs && nowTs >= startTs) {
        console.error("Vote rejected: contest voting is closed", contest_id);
        await updateWalletTxStatus("failed");
        return;
      }
    }

    const { data: contestant } = await supabase
      .from("contestants")
      .select("name")
      .eq("id", contestant_id)
      .single();

    // Idempotency: if we already inserted a vote for this wallet transaction, do nothing
    if (db_transaction_id) {
      const { data: existingVote, error: existingVoteError } = await supabase
        .from("votes")
        .select("id")
        .eq("transaction_id", db_transaction_id)
        .maybeSingle();

      if (existingVoteError) {
        console.error("Failed to check existing vote:", existingVoteError.message);
      }

      if (existingVote?.id) {
        console.log("Vote already recorded for wallet transaction:", db_transaction_id);
        await updateWalletTxStatus("completed");
        return;
      }
    }

    // Calculate commission for vote purchase
    const voteCommission = calculateCommission(baseAmount, voteCommissionRate);
    console.log("Vote commission calculated:", voteCommission.commission, "Net amount:", voteCommission.netAmount);

    // Check if this is a guest purchase (user_id starts with "guest_" or is not a valid UUID)
    const isGuestVotePurchase = !user_id || String(user_id).startsWith("guest_");
    const actualVoteUserId = isGuestVotePurchase ? null : user_id;

    // Get guest info from meta if guest purchase
    const voteMetaPurchaserName = typeof meta.purchaser_name === "string" ? meta.purchaser_name.trim() : "";
    const voteMetaPurchaserEmail = typeof meta.purchaser_email === "string" ? meta.purchaser_email.trim().toLowerCase() : "";
    const voteGuestName = voteMetaPurchaserName || customer.name || null;
    const voteGuestEmail = voteMetaPurchaserEmail || customer.email || null;

    console.log("Is guest vote purchase:", isGuestVotePurchase, "User ID:", actualVoteUserId);

    // Record vote – use wallet_transactions.id for idempotency/FK
    let voteError: any = null;
    try {
      await runWithRetry("Vote insert", async () => {
        const { error } = await supabase.from("votes").insert({
          user_id: actualVoteUserId,
          contest_id,
          contestant_id,
          quantity: recordedVoteQuantity,
          amount_paid: baseAmount,
          currency: voteCurrency,
          payment_method,
          transaction_id: db_transaction_id,
          payment_reference_id: paymentData.tx_ref || null,
          platform_commission: voteCommission.commission,
          net_amount: voteCommission.netAmount,
          guest_email: voteGuestEmail,
          guest_name: voteGuestName,
        });
        if (error) throw error;
      });
    } catch (error) {
      voteError = error;
    }

    if (voteError) {
      // Check if duplicate (unique constraint violation)
      const isDuplicate = voteError.message.includes("duplicate") || voteError.code === "23505";
      if (isDuplicate) {
        console.log("Vote already recorded for this transaction (idempotency check)");
        await updateWalletTxStatus("completed");
      } else {
        console.error("Error recording vote:", voteError.message);
        await updateWalletTxStatus("failed");
        // Alert admins about the failure
        await notifyAdminsOfFailure(supabase, "vote", voteError.message, paymentData, meta);
      }
    } else {
      console.log("Vote recorded successfully");

      // Record influencer conversion if applicable
      if (influencer_link_id) {
        await recordInfluencerConversion(supabase, influencer_link_id, baseAmount);
      }

      // Create notification - only for logged in users
      if (actualVoteUserId) {
        await supabase.from("notifications").insert({
          user_id: actualVoteUserId,
          title: "Vote Successful",
          message: `Your ${recordedVoteQuantity} vote(s) have been recorded successfully.`,
          type: "vote",
          reference_id: contest_id,
        });
      }

      // Send email receipt - pass user_id and supabase for email fallback
      await sendReceipt({
        type: "vote",
        user_email: voteGuestEmail || customer.email,
        user_name: voteGuestName || customer.name || "Valued Customer",
        amount: baseAmount,
        currency: voteCurrency,
        quantity: recordedVoteQuantity,
        payment_method: `Flutterwave (${payment_method.replace(/_/g, " ")})`,
        transaction_ref: paymentData.tx_ref,
        contest_title: contest?.title || "Contest",
        contestant_name: contestant?.name || "Contestant",
      }, actualVoteUserId, supabase);

      // Send organization transaction notification
      if (contest?.organization_id) {
        await sendOrgTransactionNotification({
          type: 'vote',
          organization_id: contest.organization_id,
          amount: baseAmount,
          currency: voteCurrency,
          quantity: recordedVoteQuantity,
          contest_title: contest?.title || "Contest",
          contestant_name: contestant?.name || "Contestant",
          voter_name: voteGuestName || customer.name || "Anonymous",
          voter_email: voteGuestEmail || customer.email || "",
        });
      }

      await updateWalletTxStatus("completed");
    }
  } else if (type === "ticket" && event_id && ticket_type_id) {
    console.log("Recording ticket purchase...");
    const grossAmount = Number(paymentData.amount) || 0;
    const baseAmount = Number(meta.base_amount ?? walletTx?.amount ?? grossAmount);

    // Check if this is a guest purchase (user_id starts with "guest_" or is not a valid UUID)
    const isGuestPurchase = !user_id || String(user_id).startsWith("guest_");
    const actualUserId = isGuestPurchase ? null : user_id;

    console.log("Is guest purchase:", isGuestPurchase, "User ID:", actualUserId);

    // Get event and ticket type details
    const { data: event } = await supabase
      .from("events")
      .select("title, event_date, venue, organization_id")
      .eq("id", event_id)
      .single();

    const { data: ticketType } = await supabase
      .from("ticket_types")
      .select("name")
      .eq("id", ticket_type_id)
      .single();

    // Ticket holder details: trust the values we set at payment init time (meta),
    // because Flutterwave may normalize/replace `customer.name`.
    const metaPurchaserName = typeof meta.purchaser_name === "string" ? meta.purchaser_name.trim() : "";
    const metaPurchaserEmail = typeof meta.purchaser_email === "string" ? meta.purchaser_email.trim().toLowerCase() : "";

    let ticketHolderName = metaPurchaserName || customer.name || null;
    let ticketHolderEmail = metaPurchaserEmail || customer.email || null;

    if ((!ticketHolderName || !ticketHolderEmail) && !isGuestPurchase && actualUserId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", actualUserId)
        .maybeSingle();

      if (profile) {
        if (!ticketHolderName) ticketHolderName = profile.full_name || null;
        if (!ticketHolderEmail) ticketHolderEmail = profile.email || null;
      }
    }
    console.log("Ticket holder name:", ticketHolderName);

    // Generate cryptographically secure unique QR code
    const randomBytes = crypto.getRandomValues(new Uint8Array(16));
    const randomHex = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    const qr_code = `TKT_${Date.now()}_${randomHex}`;

    // Idempotency: if we already inserted a ticket for this wallet transaction, do nothing
    if (db_transaction_id) {
      const { data: existingTicket, error: existingTicketError } = await supabase
        .from("tickets")
        .select("id")
        .eq("transaction_id", db_transaction_id)
        .maybeSingle();

      if (existingTicketError) {
        console.error("Failed to check existing ticket:", existingTicketError.message);
      }

      if (existingTicket?.id) {
        console.log("Ticket already recorded for wallet transaction:", db_transaction_id);
        await updateWalletTxStatus("completed");
        return;
      }
    }

    // Record ticket purchase – store holder name for both guest and authenticated users
    // Calculate commission for ticket purchase
    const ticketCommission = calculateCommission(baseAmount, ticketCommissionRate);
    console.log("Ticket commission calculated:", ticketCommission.commission, "Net amount:", ticketCommission.netAmount);

    let ticketError: any = null;
    try {
      await runWithRetry("Ticket insert", async () => {
        const { error } = await supabase.from("tickets").insert({
          user_id: actualUserId,
          event_id,
          ticket_type_id,
          quantity: toPositiveInt(ticket_quantity, 1),
          amount_paid: baseAmount,
          payment_method,
          qr_code,
          status: "active",
          transaction_id: db_transaction_id,
          payment_reference_id: paymentData.tx_ref,
          guest_email: ticketHolderEmail,
          guest_name: ticketHolderName,
          platform_commission: ticketCommission.commission,
          net_amount: ticketCommission.netAmount,
        });
        if (error) throw error;
      });
    } catch (error) {
      ticketError = error;
    }

    if (ticketError) {
      // Check if duplicate (unique constraint violation)
      const isDuplicate = ticketError.message.includes("duplicate") || ticketError.code === "23505";
      if (isDuplicate) {
        console.log("Ticket already recorded for this transaction (idempotency check)");
        await updateWalletTxStatus("completed");
      } else {
        console.error("Error recording ticket:", ticketError.message);
        await updateWalletTxStatus("failed");
        // Alert admins about the failure
        await notifyAdminsOfFailure(supabase, "ticket", ticketError.message, paymentData, meta);
      }
    } else {
      console.log("Ticket recorded successfully");

      // Record influencer conversion if applicable
      if (influencer_link_id) {
        await recordInfluencerConversion(supabase, influencer_link_id, baseAmount);
      }

      // Create notification only for logged-in users (not guests)
      if (actualUserId) {
        await supabase.from("notifications").insert({
          user_id: actualUserId,
          title: "Ticket Purchase Successful",
          message: `Your ${ticket_quantity || 1} ticket(s) have been purchased successfully.`,
          type: "ticket",
          reference_id: event_id,
        });
      }

      // Send email receipt with QR code
      await sendReceipt({
        type: "ticket",
        user_email: ticketHolderEmail || customer.email,
        user_name: ticketHolderName || "Valued Customer",
        amount: baseAmount,
        currency: paymentData.currency || "NGN",
        quantity: ticket_quantity || 1,
        payment_method: `Flutterwave (${payment_method.replace(/_/g, " ")})`,
        transaction_ref: paymentData.tx_ref,
        event_title: event?.title || "Event",
        event_date: event?.event_date
          ? new Date(event.event_date).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "TBA",
        event_venue: event?.venue || "Venue TBA",
        ticket_type: ticketType?.name || "General",
        qr_code,
      });

      // Send organization transaction notification
      if (event?.organization_id) {
        await sendOrgTransactionNotification({
          type: 'ticket',
          organization_id: event.organization_id,
          amount: baseAmount,
          currency: paymentData.currency || "NGN",
          quantity: ticket_quantity || 1,
          event_title: event?.title || "Event",
          ticket_type: ticketType?.name || "General",
          buyer_name: ticketHolderName || customer.name || "Anonymous",
          buyer_email: ticketHolderEmail || customer.email || "",
        });
      }

      await updateWalletTxStatus("completed");
    }
  } else if (type === "wallet" && user_id) {
    console.log("Processing wallet funding...");

    // Get wallet
    const { data: wallet, error: walletError } = await supabase
      .from("wallets")
      .select("id")
      .eq("user_id", user_id)
      .single();

    if (walletError || !wallet) {
      console.error("Error fetching wallet:", walletError?.message);
      return;
    }

    const paymentCurrency = paymentData.currency || "NGN";
    // The user paid amount + 3% admin fee. Only credit the base funding amount to their wallet.
    // funding_amount holds the original deposit amount (before the 3% fee was added).
    const baseAmount = Number(meta.funding_amount) || paymentData.amount;
    const WALLET_ADMIN_FEE_RATE = 0.03;
    const adminFee = Math.round(baseAmount * WALLET_ADMIN_FEE_RATE * 100) / 100;
    const amountToAdd = baseAmount; // Only credit the base amount to wallet
    console.log(`Wallet funding: base=${baseAmount}, admin fee(3%)=${adminFee}, credited to wallet=${amountToAdd}, total charged=${paymentData.amount}`);

    // Check if a currency balance already exists for this currency
    const { data: existingBalance, error: balanceError } = await supabase
      .from("wallet_currency_balances")
      .select("id, balance")
      .eq("wallet_id", wallet.id)
      .eq("currency", paymentCurrency)
      .maybeSingle();

    if (balanceError) {
      console.error("Error checking existing currency balance:", balanceError.message);
    }

    let newBalance = amountToAdd;
    let updateOrInsertError = null;

    if (existingBalance) {
      // Update existing currency balance
      newBalance = Number(existingBalance.balance) + amountToAdd;
      const { error: updateError } = await supabase
        .from("wallet_currency_balances")
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq("id", existingBalance.id);

      updateOrInsertError = updateError;
      if (updateError) {
        console.error("Error updating currency balance:", updateError.message);
      } else {
        console.log(`Updated ${paymentCurrency} balance to ${newBalance}`);
      }
    } else {
      // Insert new currency balance
      const { error: insertError } = await supabase
        .from("wallet_currency_balances")
        .insert({
          wallet_id: wallet.id,
          currency: paymentCurrency,
          balance: amountToAdd,
        });

      updateOrInsertError = insertError;
      if (insertError) {
        console.error("Error inserting new currency balance:", insertError.message);
      } else {
        console.log(`Created new ${paymentCurrency} balance with ${amountToAdd}`);
      }
    }

    // Also update the legacy wallet balance for backward compatibility
    const { data: walletFull } = await supabase
      .from("wallets")
      .select("balance")
      .eq("id", wallet.id)
      .single();

    if (walletFull) {
      await supabase
        .from("wallets")
        .update({ 
          balance: Number(walletFull.balance) + amountToAdd, 
          updated_at: new Date().toISOString() 
        })
        .eq("id", wallet.id);
    }

    if (!updateOrInsertError) {
      console.log("Wallet funded successfully with", paymentCurrency, amountToAdd);
      await updateWalletTxStatus("completed");

      // Create notification
      await supabase.from("notifications").insert({
        user_id,
        title: "Wallet Funded Successfully",
        message: `Your wallet has been credited with ${paymentCurrency} ${amountToAdd.toLocaleString()}. A 3% admin fee of ${paymentCurrency} ${adminFee.toLocaleString()} was charged.`,
        type: "system",
      });

      // Send wallet funding email receipt
      await sendReceipt({
        type: "wallet",
        user_email: customer.email,
        user_name: customer.name || "Valued Customer",
        amount: baseAmount,
        currency: paymentCurrency,
        payment_method: `Flutterwave`,
        transaction_ref: paymentData.tx_ref,
        new_balance: newBalance,
        wallet_currency: paymentCurrency,
        admin_fee: adminFee,
        total_charged: paymentData.amount,
        total_credited: amountToAdd,
      }, user_id, supabase);
    } else {
      await updateWalletTxStatus("failed");
    }
  } else if (type === "donation" && campaign_id && user_id) {
    console.log("Processing donation...");
    const grossAmount = Number(paymentData.amount) || 0;
    const baseAmount = Number(meta.base_amount ?? walletTx?.amount ?? grossAmount);

    // Get campaign details
    const { data: campaign } = await supabase
      .from("campaigns")
      .select("id, title, current_amount, donor_count, currency, creator_id")
      .eq("id", campaign_id)
      .single();

    if (!campaign) {
      console.error("Campaign not found:", campaign_id);
      return;
    }

    // Check for duplicate donation using transaction reference
    if (db_transaction_id) {
      const { data: existingDonation } = await supabase
        .from("donations")
        .select("id")
        .eq("transaction_id", db_transaction_id)
        .maybeSingle();

      if (existingDonation?.id) {
        console.log("Donation already recorded for wallet transaction:", db_transaction_id);
        return;
      }
    }

    // Calculate commission for donation
    const donationCommission = calculateCommission(baseAmount, campaignCommissionRate);
    console.log("Donation commission calculated:", donationCommission.commission, "Net amount:", donationCommission.netAmount);

    // Check if this is a guest donation (user_id starts with "guest_" or is not a valid UUID)
    const isGuestDonation = !user_id || String(user_id).startsWith("guest_");
    const actualDonorId = isGuestDonation ? null : user_id;

    // Get guest info from meta if guest donation
    const donationMetaPurchaserName = typeof meta.purchaser_name === "string" ? meta.purchaser_name.trim() : "";
    const donationMetaPurchaserEmail = typeof meta.purchaser_email === "string" ? meta.purchaser_email.trim().toLowerCase() : "";
    const donorGuestName = donationMetaPurchaserName || customer.name || null;
    const donorGuestEmail = donationMetaPurchaserEmail || customer.email || null;

    console.log("Is guest donation:", isGuestDonation, "Donor ID:", actualDonorId);

    // Record donation
    let donationData: any = null;
    let donationError: any = null;
    try {
      donationData = await runWithRetry("Donation insert", async () => {
        const { data, error } = await supabase.from("donations").insert({
          campaign_id,
          donor_id: actualDonorId,
          amount: baseAmount,
          currency: paymentData.currency || campaign.currency || "NGN",
          payment_method: payment_method,
          is_anonymous: is_anonymous || false,
          donor_message: donor_message || null,
          status: "completed",
          transaction_id: db_transaction_id,
          platform_commission: donationCommission.commission,
          net_amount: donationCommission.netAmount,
          guest_email: donorGuestEmail,
          guest_name: donorGuestName,
        }).select().single();
        if (error) throw error;
        return data;
      });
    } catch (error) {
      donationError = error;
    }

    if (donationError) {
      const isDuplicate = donationError.message.includes("duplicate") || donationError.code === "23505";
      if (isDuplicate) {
        console.log("Donation already recorded for this transaction (idempotency check)");
        await updateWalletTxStatus("completed");
      } else {
        console.error("Error recording donation:", donationError.message);
        await updateWalletTxStatus("failed");
      }
    } else {
      console.log("Donation recorded successfully");

      // Update campaign current_amount and donor_count
      const newAmount = Number(campaign.current_amount) + baseAmount;
      const newDonorCount = Number(campaign.donor_count) + 1;
      
      const { error: updateError } = await supabase
        .from("campaigns")
        .update({ 
          current_amount: newAmount, 
          donor_count: newDonorCount,
          updated_at: new Date().toISOString() 
        })
        .eq("id", campaign_id);

      if (updateError) {
        console.error("Error updating campaign totals:", updateError.message);
      } else {
        console.log("Campaign updated - new amount:", newAmount, "donors:", newDonorCount);
      }

      // Create notification - only for logged in users
      if (actualDonorId) {
        await supabase.from("notifications").insert({
          user_id: actualDonorId,
          title: "Donation Successful",
          message: `Thank you! Your donation of ${paymentData.currency || "NGN"} ${baseAmount.toLocaleString()} to "${campaign.title}" was successful.`,
          type: "system",
          reference_id: campaign_id,
        });
      }

      // Send donation receipt email
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        await fetch(`${supabaseUrl}/functions/v1/send-donation-receipt`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({
            donationId: donationData.id,
            donorEmail: donorGuestEmail || customer.email,
            donorName: donorGuestName || customer.name || "Supporter",
            campaignTitle: campaign.title,
            amount: baseAmount,
            currency: paymentData.currency || campaign.currency || "NGN",
            donationDate: new Date().toISOString(),
            isAnonymous: is_anonymous || false,
          }),
        });
        console.log("Donation receipt email sent");
      } catch (emailError: any) {
        console.error("Failed to send donation receipt:", emailError.message);
      }

      // Send organization transaction notification
      if (campaign?.creator_id) {
        await sendOrgTransactionNotification({
          type: 'donation',
          organization_id: campaign.creator_id,
          amount: baseAmount,
          currency: paymentData.currency || campaign.currency || "NGN",
          campaign_title: campaign.title,
          donor_name: (is_anonymous ? "Anonymous" : (donorGuestName || customer.name || "Anonymous")),
          donor_email: is_anonymous ? "" : (donorGuestEmail || customer.email || ""),
        });
      }

      await updateWalletTxStatus("completed");
    }
  } else {
    console.error(
      "Unable to process payment - missing required meta fields",
      JSON.stringify({
        type,
        tx_ref: paymentData.tx_ref,
        contest_id: !!contest_id,
        contestant_id: !!contestant_id,
        event_id: !!event_id,
        hasVoteIdentity,
      }),
    );
    await notifyAdminsOfFailure(
      supabase,
      type === "ticket" ? "ticket" : "vote",
      `Missing fulfillment fields for tx_ref ${paymentData.tx_ref}. Meta: ${JSON.stringify(meta)}`,
      paymentData,
      meta,
    );
    // Keep pending so a retry/webhook replay can still fulfill; do not mark failed while customer was charged.
    if (walletTx?.status === "pending") {
      console.log("Leaving wallet transaction pending for manual/retry fulfillment:", walletTx.id);
    } else {
      await updateWalletTxStatus("failed");
    }
  }
}

serve(handler);
