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
    const redirectUrl = url.searchParams.get("redirect") || "https://preview--lovable-voting-platform.lovable.app";

    console.log("Redirect params:", { status, tx_ref, transaction_id });

    // Flutterwave returns either "successful" or "completed" depending on context
    const isSuccessful = status === "successful" || status === "completed";
    
    if (isSuccessful && transaction_id) {
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

        const dbSecret = settings?.find((s) => s.setting_key === "flutterwave_secret_key")?.setting_value || "";
        const flutterwaveSecretKey = dbSecret || Deno.env.get("FLUTTERWAVE_SECRET_KEY") || "";

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
      console.log("Payment not successful or missing transaction_id:", { status, transaction_id });
      
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

  } catch (error: any) {
    console.error("Error recording influencer conversion:", error.message);
  }
}

async function sendReceipt(receiptData: any) {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const response = await fetch(`${supabaseUrl}/functions/v1/send-payment-receipt`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
      body: JSON.stringify(receiptData),
    });

    if (response.ok) {
      console.log("Receipt email sent successfully");
    } else {
      console.error("Failed to send receipt:", await response.text());
    }
  } catch (error: any) {
    console.error("Error sending receipt:", error.message);
  }
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

  const meta = paymentData.meta || {};
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
  } = meta;
  const customer = paymentData.customer || {};

  // Flutterwave transaction id (numeric) – useful for logging but NOT a FK to our DB
  const flw_transaction_id = String(paymentData.id || "");

  console.log("Payment meta:", JSON.stringify(meta));
  console.log("Flutterwave transaction id:", flw_transaction_id);

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

  // Find the wallet transaction created during payment initialization
  const { data: walletTx, error: walletTxError } = await supabase
    .from("wallet_transactions")
    .select("id, user_id, wallet_id, status")
    .eq("reference_id", paymentData.tx_ref)
    .maybeSingle();

  if (walletTxError) {
    console.error("Failed to load wallet transaction:", walletTxError.message);
  }

  // Update transaction status (if it exists)
  if (walletTx?.id) {
    const { error: updateError } = await supabase
      .from("wallet_transactions")
      .update({ status: "completed" })
      .eq("id", walletTx.id);

    if (updateError) {
      console.log("Transaction update error:", updateError.message);
    }
  } else {
    console.log("No wallet_transactions row found for tx_ref:", paymentData.tx_ref);
  }

  // IMPORTANT: votes.transaction_id & tickets.transaction_id reference wallet_transactions.id (UUID)
  const db_transaction_id: string | null = walletTx?.id ?? null;

  if (type === "vote" && contest_id && contestant_id && user_id) {
    console.log("Recording vote...");

    // Get contest and contestant details
    const { data: contest } = await supabase
      .from("contests")
      .select("title")
      .eq("id", contest_id)
      .single();

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
        return;
      }
    }

    // Record vote – use wallet_transactions.id for idempotency/FK
    const { error: voteError } = await supabase.from("votes").insert({
      user_id,
      contest_id,
      contestant_id,
      quantity: toPositiveInt(vote_quantity, 1),
      amount_paid: paymentData.amount,
      payment_method,
      transaction_id: db_transaction_id,
    });

    if (voteError) {
      // Check if duplicate (unique constraint violation)
      const isDuplicate = voteError.message.includes("duplicate") || voteError.code === "23505";
      if (isDuplicate) {
        console.log("Vote already recorded for this transaction (idempotency check)");
      } else {
        console.error("Error recording vote:", voteError.message);
        // Alert admins about the failure
        await notifyAdminsOfFailure(supabase, "vote", voteError.message, paymentData, meta);
      }
    } else {
      console.log("Vote recorded successfully");

      // Record influencer conversion if applicable
      if (influencer_link_id) {
        await recordInfluencerConversion(supabase, influencer_link_id, paymentData.amount);
      }

      // Create notification
      await supabase.from("notifications").insert({
        user_id,
        title: "Vote Successful",
        message: `Your ${vote_quantity || 1} vote(s) have been recorded successfully.`,
        type: "vote",
        reference_id: contest_id,
      });

      // Send email receipt
      await sendReceipt({
        type: "vote",
        user_email: customer.email,
        user_name: customer.name || "Valued Customer",
        amount: paymentData.amount,
        currency: paymentData.currency || "NGN",
        quantity: vote_quantity || 1,
        payment_method: `Flutterwave (${payment_method.replace(/_/g, " ")})`,
        transaction_ref: paymentData.tx_ref,
        contest_title: contest?.title || "Contest",
        contestant_name: contestant?.name || "Contestant",
      });
    }
  } else if (type === "ticket" && event_id && ticket_type_id) {
    console.log("Recording ticket purchase...");

    // Check if this is a guest purchase (user_id starts with "guest_" or is not a valid UUID)
    const isGuestPurchase = !user_id || String(user_id).startsWith("guest_");
    const actualUserId = isGuestPurchase ? null : user_id;

    console.log("Is guest purchase:", isGuestPurchase, "User ID:", actualUserId);

    // Get event and ticket type details
    const { data: event } = await supabase
      .from("events")
      .select("title, event_date, venue")
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

    // Generate QR code
    const qr_code = `TKT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

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
        return;
      }
    }

    // Record ticket purchase – store holder name for both guest and authenticated users
    const { error: ticketError } = await supabase.from("tickets").insert({
      user_id: actualUserId,
      event_id,
      ticket_type_id,
      quantity: toPositiveInt(ticket_quantity, 1),
      amount_paid: paymentData.amount,
      payment_method,
      qr_code,
      status: "active",
      transaction_id: db_transaction_id,
      payment_reference_id: paymentData.tx_ref,
      guest_email: ticketHolderEmail,
      guest_name: ticketHolderName,
    });

    if (ticketError) {
      // Check if duplicate (unique constraint violation)
      const isDuplicate = ticketError.message.includes("duplicate") || ticketError.code === "23505";
      if (isDuplicate) {
        console.log("Ticket already recorded for this transaction (idempotency check)");
      } else {
        console.error("Error recording ticket:", ticketError.message);
        // Alert admins about the failure
        await notifyAdminsOfFailure(supabase, "ticket", ticketError.message, paymentData, meta);
      }
    } else {
      console.log("Ticket recorded successfully");

      // Record influencer conversion if applicable
      if (influencer_link_id) {
        await recordInfluencerConversion(supabase, influencer_link_id, paymentData.amount);
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
        amount: paymentData.amount,
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
    const amountToAdd = paymentData.amount;

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

      // Create notification
      await supabase.from("notifications").insert({
        user_id,
        title: "Wallet Funded Successfully",
        message: `Your wallet has been credited with ${paymentCurrency} ${amountToAdd.toLocaleString()}.`,
        type: "system",
      });

      // Send email receipt
      await sendReceipt({
        type: "wallet",
        user_email: customer.email,
        user_name: customer.name || "Valued Customer",
        amount: paymentData.amount,
        currency: paymentCurrency,
        payment_method: `Flutterwave`,
        transaction_ref: paymentData.tx_ref,
        new_balance: newBalance,
        wallet_currency: paymentCurrency,
      });
    }
  } else if (type === "donation" && campaign_id && user_id) {
    console.log("Processing donation...");

    // Get campaign details
    const { data: campaign } = await supabase
      .from("campaigns")
      .select("id, title, current_amount, donor_count, currency")
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

    // Record donation
    const { data: donationData, error: donationError } = await supabase.from("donations").insert({
      campaign_id,
      donor_id: user_id,
      amount: paymentData.amount,
      currency: paymentData.currency || campaign.currency || "NGN",
      payment_method: payment_method,
      is_anonymous: is_anonymous || false,
      donor_message: donor_message || null,
      status: "completed",
      transaction_id: db_transaction_id,
    }).select().single();

    if (donationError) {
      const isDuplicate = donationError.message.includes("duplicate") || donationError.code === "23505";
      if (isDuplicate) {
        console.log("Donation already recorded for this transaction (idempotency check)");
      } else {
        console.error("Error recording donation:", donationError.message);
      }
    } else {
      console.log("Donation recorded successfully");

      // Update campaign current_amount and donor_count
      const newAmount = Number(campaign.current_amount) + paymentData.amount;
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

      // Create notification
      await supabase.from("notifications").insert({
        user_id,
        title: "Donation Successful",
        message: `Thank you! Your donation of ${paymentData.currency || "NGN"} ${paymentData.amount.toLocaleString()} to "${campaign.title}" was successful.`,
        type: "system",
        reference_id: campaign_id,
      });

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
            donorEmail: customer.email,
            donorName: customer.name || "Supporter",
            campaignTitle: campaign.title,
            amount: paymentData.amount,
            currency: paymentData.currency || campaign.currency || "NGN",
            donationDate: new Date().toISOString(),
            isAnonymous: is_anonymous || false,
          }),
        });
        console.log("Donation receipt email sent");
      } catch (emailError: any) {
        console.error("Failed to send donation receipt:", emailError.message);
      }
    }
  } else {
    console.log("Unable to process payment - missing required meta fields");
  }
}

serve(handler);
