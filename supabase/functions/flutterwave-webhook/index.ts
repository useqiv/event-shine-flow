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
  } = meta;
  const customer = paymentData.customer || {};

  // Flutterwave transaction id – used for idempotency
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

  const payment_method = resolvePaymentMethod(paymentData);

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

    // Record vote – use transaction_id for idempotency (unique index prevents duplicates)
    const { error: voteError } = await supabase.from("votes").insert({
      user_id,
      contest_id,
      contestant_id,
      quantity: vote_quantity || 1,
      amount_paid: paymentData.amount,
      payment_method,
      transaction_id: flw_transaction_id || null,
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
  } else if (type === "ticket" && event_id && ticket_type_id && user_id) {
    console.log("Recording ticket purchase...");

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

    // Generate QR code
    const qr_code = `TKT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Record ticket purchase – use transaction_id for idempotency
    const { error: ticketError } = await supabase.from("tickets").insert({
      user_id,
      event_id,
      ticket_type_id,
      quantity: ticket_quantity || 1,
      amount_paid: paymentData.amount,
      payment_method,
      qr_code,
      status: "active",
      transaction_id: flw_transaction_id || null,
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

      // Create notification
      await supabase.from("notifications").insert({
        user_id,
        title: "Ticket Purchase Successful",
        message: `Your ${ticket_quantity || 1} ticket(s) have been purchased successfully.`,
        type: "ticket",
        reference_id: event_id,
      });

      // Send email receipt with QR code
      await sendReceipt({
        type: "ticket",
        user_email: customer.email,
        user_name: customer.name || "Valued Customer",
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
  } else {
    console.log("Unable to process payment - missing required meta fields");
  }
}

serve(handler);
