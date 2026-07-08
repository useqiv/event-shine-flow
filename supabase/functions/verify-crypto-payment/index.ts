import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TOKEN_CONTRACTS: Record<string, string> = {
  USDT: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
  USDC: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
};

const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const POLYGON_CHAIN_ID = "137";

interface VerifyPaymentRequest {
  payment_ref: string;
  tx_hash: string;
  user_id?: string;
}

interface PaymentMetadata {
  type?: string;
  user_id?: string;
  crypto_currency?: string;
  network?: string;
  crypto_amount?: number;
  base_amount?: number;
  base_currency?: string;
  base_amount_usd?: number;
  purchaser_email?: string;
  purchaser_name?: string;
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

interface TxReceipt {
  status?: string;
  logs?: Array<{ address: string; topics: string[]; data: string }>;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null) {
    const record = error as Record<string, unknown>;
    if (typeof record.message === "string") return record.message;
    if (typeof record.details === "string") return record.details;
    if (typeof record.hint === "string") return record.hint;
  }
  return "Unknown error";
}

function normalizeTxHash(txHash: string): string {
  const trimmed = txHash.trim();
  if (!/^0x[a-fA-F0-9]{64}$/.test(trimmed)) {
    throw new Error("Invalid transaction hash format. Expected a 0x-prefixed 66-character hash.");
  }
  return trimmed;
}

async function fetchReceiptFromEtherscanV2(txHash: string, apiKey: string): Promise<TxReceipt | null> {
  const url =
    `https://api.etherscan.io/v2/api?chainid=${POLYGON_CHAIN_ID}&module=proxy&action=eth_getTransactionReceipt&txhash=${txHash}&apikey=${apiKey}`;
  const response = await fetch(url);
  const data = await response.json();
  if (data?.result && typeof data.result === "object") {
    return data.result as TxReceipt;
  }
  return null;
}

async function fetchReceiptFromPolygonRpc(txHash: string): Promise<TxReceipt | null> {
  const response = await fetch("https://polygon-rpc.com/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "eth_getTransactionReceipt",
      params: [txHash],
      id: 1,
    }),
  });

  const data = await response.json();
  if (data?.result && typeof data.result === "object") {
    return data.result as TxReceipt;
  }
  return null;
}

async function getPolygonTransactionReceipt(txHash: string): Promise<TxReceipt | null> {
  const apiKey = Deno.env.get("ETHERSCAN_API_KEY") || Deno.env.get("POLYGONSCAN_API_KEY") || "";

  if (apiKey) {
    const fromEtherscan = await fetchReceiptFromEtherscanV2(txHash, apiKey);
    if (fromEtherscan) return fromEtherscan;
  }

  return await fetchReceiptFromPolygonRpc(txHash);
}

async function verifyPolygonTransaction(
  txHash: string,
  currency: string,
  expectedAmount: number,
  walletAddress: string,
): Promise<{ verified: boolean; amount?: number; error?: string }> {
  try {
    const receipt = await getPolygonTransactionReceipt(txHash);
    if (!receipt) {
      return { verified: false, error: "Transaction not found on Polygon. Confirm the hash and try again." };
    }

    if (receipt.status !== "0x1") {
      return { verified: false, error: "Transaction failed on Polygon" };
    }

    const tokenContract = TOKEN_CONTRACTS[currency]?.toLowerCase();
    if (!tokenContract) {
      return { verified: false, error: "Unsupported token" };
    }

    const transferLog = receipt.logs?.find(
      (log) => log.address.toLowerCase() === tokenContract && log.topics[0] === TRANSFER_TOPIC,
    );

    if (!transferLog) {
      return { verified: false, error: "No USDT/USDC transfer found in this transaction" };
    }

    if (!transferLog.topics[2]) {
      return { verified: false, error: "Could not decode transfer recipient from transaction logs" };
    }

    const amountWei = BigInt(transferLog.data);
    const amount = Number(amountWei) / 1_000_000;

    const recipient = "0x" + transferLog.topics[2].slice(26).toLowerCase();
    const expectedWallet = walletAddress.toLowerCase();

    if (recipient !== expectedWallet) {
      return { verified: false, error: "Recipient wallet mismatch" };
    }

    const tolerance = Math.max(expectedAmount * 0.01, 0.01);
    if (Math.abs(amount - expectedAmount) <= tolerance) {
      return { verified: true, amount };
    }
    return { verified: false, error: `Amount mismatch: expected ${expectedAmount}, got ${amount}` };
  } catch (error: unknown) {
    return { verified: false, error: getErrorMessage(error) || "Verification error" };
  }
}

function toPositiveInt(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : Number(String(value ?? "").trim());
  if (!Number.isFinite(n)) return fallback;
  const i = Math.floor(n);
  return i > 0 ? i : fallback;
}

function calculateCommission(amount: number, rate: number) {
  const commission = Math.round((amount * rate / 100) * 100) / 100;
  const netAmount = Math.round((amount - commission) * 100) / 100;
  return { commission, netAmount };
}

async function fulfillPayment(
  supabase: SupabaseClient,
  transaction: { id: string; amount: number; payment_metadata: PaymentMetadata | null },
  txHash: string,
) {
  const meta = (transaction.payment_metadata || {}) as PaymentMetadata;
  const type = meta.type;
  const user_id = meta.user_id;
  const crypto_currency = meta.crypto_currency || "USDT";
  const payment_method = "crypto";

  const { data: commissionSettings } = await supabase
    .from("platform_settings")
    .select("setting_key, setting_value")
    .in("setting_key", [
      "vote_commission_percentage",
      "ticket_commission_percentage",
      "campaign_commission_percentage",
    ]);

  const getRate = (key: string) => {
    const setting = commissionSettings?.find((s) => s.setting_key === key);
    const rate = parseFloat(setting?.setting_value || "10");
    return Number.isFinite(rate) ? rate : 10;
  };

  const db_transaction_id = transaction.id;

  if (type === "vote" && meta.contest_id && meta.contestant_id) {
    const { data: existingVote } = await supabase
      .from("votes")
      .select("id")
      .eq("transaction_id", db_transaction_id)
      .maybeSingle();
    if (existingVote?.id) return;

    const baseAmount = Number(meta.base_amount ?? transaction.amount);
    const voteCurrency = meta.base_currency || "USD";
    const voteCommission = calculateCommission(baseAmount, getRate("vote_commission_percentage"));
    const isGuest = !user_id || String(user_id).startsWith("guest_");

    const { error } = await supabase.from("votes").insert({
      user_id: isGuest ? null : user_id,
      contest_id: meta.contest_id,
      contestant_id: meta.contestant_id,
      quantity: toPositiveInt(meta.vote_quantity, 1),
      amount_paid: baseAmount,
      currency: voteCurrency,
      payment_method,
      transaction_id: db_transaction_id,
      payment_reference_id: txHash,
      platform_commission: voteCommission.commission,
      net_amount: voteCommission.netAmount,
      guest_email: meta.purchaser_email || null,
      guest_name: meta.purchaser_name || null,
    });
    if (error) throw error;

    if (!isGuest && user_id) {
      await supabase.from("notifications").insert({
        user_id,
        title: "Vote Successful",
        message: `Your ${toPositiveInt(meta.vote_quantity, 1)} vote(s) via ${crypto_currency} have been recorded.`,
        type: "vote",
        reference_id: meta.contest_id,
      });
    }
    return;
  }

  if (type === "ticket" && meta.event_id && meta.ticket_type_id) {
    const { data: existingTicket } = await supabase
      .from("tickets")
      .select("id")
      .eq("transaction_id", db_transaction_id)
      .maybeSingle();
    if (existingTicket?.id) return;

    const baseAmount = Number(meta.base_amount ?? transaction.amount);
    const ticketCommission = calculateCommission(baseAmount, getRate("ticket_commission_percentage"));
    const isGuest = !user_id || String(user_id).startsWith("guest_");
    const randomBytes = crypto.getRandomValues(new Uint8Array(16));
    const randomHex = Array.from(randomBytes).map((b) => b.toString(16).padStart(2, "0")).join("");
    const qr_code = `TKT_${Date.now()}_${randomHex}`;

    const { error } = await supabase.from("tickets").insert({
      user_id: isGuest ? null : user_id,
      event_id: meta.event_id,
      ticket_type_id: meta.ticket_type_id,
      quantity: toPositiveInt(meta.ticket_quantity, 1),
      amount_paid: baseAmount,
      payment_method,
      qr_code,
      status: "active",
      transaction_id: db_transaction_id,
      payment_reference_id: txHash,
      guest_email: meta.purchaser_email || null,
      guest_name: meta.purchaser_name || null,
      platform_commission: ticketCommission.commission,
      net_amount: ticketCommission.netAmount,
    });
    if (error) throw error;

    if (!isGuest && user_id) {
      await supabase.from("notifications").insert({
        user_id,
        title: "Ticket Purchase Successful",
        message: `Your tickets via ${crypto_currency} are ready.`,
        type: "ticket",
        reference_id: meta.event_id,
      });
    }
    return;
  }

  if (type === "donation" && meta.campaign_id) {
    const { data: existingDonation } = await supabase
      .from("donations")
      .select("id")
      .eq("transaction_id", db_transaction_id)
      .maybeSingle();
    if (existingDonation?.id) return;

    const { data: campaign } = await supabase
      .from("campaigns")
      .select("id, title, current_amount, donor_count, currency, creator_id")
      .eq("id", meta.campaign_id)
      .single();
    if (!campaign) throw new Error("Campaign not found");

    const baseAmount = Number(meta.base_amount ?? transaction.amount);
    const donationCommission = calculateCommission(baseAmount, getRate("campaign_commission_percentage"));
    const isGuest = !user_id || String(user_id).startsWith("guest_");

    const { error } = await supabase.from("donations").insert({
      campaign_id: meta.campaign_id,
      donor_id: isGuest ? null : user_id,
      amount: baseAmount,
      currency: meta.base_currency || campaign.currency || "USD",
      payment_method,
      is_anonymous: meta.is_anonymous || false,
      donor_message: meta.donor_message || null,
      status: "completed",
      transaction_id: db_transaction_id,
      platform_commission: donationCommission.commission,
      net_amount: donationCommission.netAmount,
      guest_email: meta.purchaser_email || null,
      guest_name: meta.purchaser_name || null,
    });
    if (error) throw error;

    await supabase
      .from("campaigns")
      .update({
        current_amount: Number(campaign.current_amount) + baseAmount,
        donor_count: Number(campaign.donor_count) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", meta.campaign_id);

    if (!isGuest && user_id) {
      await supabase.from("notifications").insert({
        user_id,
        title: "Donation Successful",
        message: `Thank you! Your ${crypto_currency} donation to "${campaign.title}" was successful.`,
        type: "system",
        reference_id: meta.campaign_id,
      });
    }
    return;
  }

  if (type === "form" && meta.form_id) {
    const { data: existingResponse } = await supabase
      .from("form_responses")
      .select("id")
      .eq("payment_reference", txHash)
      .maybeSingle();
    if (existingResponse?.id) return;

    const { error } = await supabase.from("form_responses").insert({
      form_id: meta.form_id,
      respondent_email: meta.purchaser_email || null,
      respondent_name: meta.purchaser_name || null,
      response_data: meta.response_data || {},
      payment_status: "completed",
      payment_reference: txHash,
      payment_amount: Number(meta.base_amount ?? transaction.amount),
      status: "pending",
    });
    if (error) throw error;
    return;
  }

  throw new Error(`Unsupported or incomplete crypto payment type: ${type || "unknown"}`);
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { payment_ref, tx_hash, user_id }: VerifyPaymentRequest = await req.json();

    if (!payment_ref || !tx_hash) {
      throw new Error("Payment reference and transaction hash are required");
    }

    const normalizedTxHash = normalizeTxHash(tx_hash);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Payment verification service is not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: transaction, error: txError } = await supabase
      .from("wallet_transactions")
      .select("id, user_id, amount, status, payment_metadata, description")
      .eq("reference_id", payment_ref)
      .in("status", ["pending", "pending_verification"])
      .maybeSingle();

    if (txError) {
      console.error("Transaction lookup failed:", txError.message);
      throw new Error("Unable to look up payment. Please try again.");
    }
    if (!transaction) {
      throw new Error("Payment not found or already processed");
    }

    const meta = (transaction.payment_metadata || {}) as PaymentMetadata;

    if (user_id && meta.user_id && user_id !== meta.user_id) {
      throw new Error("Payment session mismatch. Please use the same session that initiated the payment.");
    }

    const currency = meta.crypto_currency || "USDT";
    const network = meta.network || "polygon";
    const expectedAmount = Number(meta.crypto_amount);

    if (network !== "polygon") {
      throw new Error("Only Polygon network payments can be verified");
    }
    if (!Number.isFinite(expectedAmount) || expectedAmount < 5) {
      throw new Error("Invalid payment amount");
    }

    const { data: walletSetting, error: walletError } = await supabase
      .from("platform_settings")
      .select("setting_value")
      .eq("setting_key", `crypto_wallet_polygon_${currency.toLowerCase()}`)
      .maybeSingle();

    if (walletError) {
      console.error("Wallet lookup failed:", walletError.message);
    }

    const walletAddress = walletSetting?.setting_value || "";
    if (!walletAddress) {
      await supabase
        .from("wallet_transactions")
        .update({
          status: "pending_verification",
          description: `${transaction.description} | TX: ${normalizedTxHash} | Awaiting manual verification`,
        })
        .eq("id", transaction.id);

      return new Response(
        JSON.stringify({
          success: true,
          status: "pending_verification",
          message: "Wallet not configured. Payment submitted for manual review.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const verificationResult = await verifyPolygonTransaction(
      normalizedTxHash,
      currency,
      expectedAmount,
      walletAddress,
    );

    if (verificationResult.verified) {
      try {
        await fulfillPayment(supabase, transaction, normalizedTxHash);
      } catch (fulfillError) {
        console.error("Crypto fulfillment failed:", fulfillError);
        await supabase
          .from("wallet_transactions")
          .update({
            status: "pending_verification",
            description: `${transaction.description} | TX: ${normalizedTxHash} | Fulfillment failed: ${getErrorMessage(fulfillError)}`,
            payment_metadata: { ...meta, tx_hash: normalizedTxHash, fulfillment_error: getErrorMessage(fulfillError) },
          })
          .eq("id", transaction.id);

        throw new Error(
          `Payment was detected on Polygon but could not be completed: ${getErrorMessage(fulfillError)}. Support has been notified.`,
        );
      }

      const { error: updateError } = await supabase
        .from("wallet_transactions")
        .update({
          status: "completed",
          gateway_transaction_id: normalizedTxHash,
          description: `${transaction.description} | TX: ${normalizedTxHash} | Verified on Polygon`,
          payment_metadata: { ...meta, tx_hash: normalizedTxHash, verified_amount: verificationResult.amount },
        })
        .eq("id", transaction.id);

      if (updateError) {
        console.error("Failed to mark transaction completed:", updateError.message);
        throw new Error("Payment verified but final update failed. Contact support with your payment reference.");
      }

      const notifyUserId = meta.user_id && !String(meta.user_id).startsWith("guest_") ? meta.user_id : null;
      if (notifyUserId) {
        await supabase.from("notifications").insert({
          user_id: notifyUserId,
          title: "Crypto Payment Verified",
          message: `Your ${currency} payment on Polygon has been verified and processed.`,
          type: "payment",
          reference_id: transaction.id,
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          status: "completed",
          message: "Payment verified successfully!",
          verified_amount: verificationResult.amount,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    await supabase
      .from("wallet_transactions")
      .update({
        status: "pending_verification",
        description: `${transaction.description} | TX: ${normalizedTxHash} | Auto-verify failed: ${verificationResult.error}`,
        payment_metadata: { ...meta, tx_hash: normalizedTxHash, verification_error: verificationResult.error },
      })
      .eq("id", transaction.id);

    await supabase.from("fraud_alerts").insert({
      alert_type: "crypto_payment_verification",
      severity: "medium",
      entity_type: "transaction",
      entity_id: transaction.id,
      description: `Auto-verification failed: ${verificationResult.error}`,
      metadata: {
        payment_ref,
        tx_hash: normalizedTxHash,
        user_id: meta.user_id,
        expected_amount: expectedAmount,
        currency,
        network,
        error: verificationResult.error,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        status: "pending_verification",
        message: "Auto-verification could not confirm payment. Submitted for manual review.",
        error: verificationResult.error,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    console.error("Error verifying crypto payment:", message, error);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
};

serve(handler);
