import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AdminNotificationRequest {
  type: "fraud_alert" | "payout_request" | "payout_approved" | "payout_rejected" | "new_organization" | "content_moderation";
  data: Record<string, any>;
  adminEmails?: string[];
}

const getEmailTemplate = (type: string, data: Record<string, any>) => {
  const templates: Record<string, { subject: string; html: string }> = {
    fraud_alert: {
      subject: `🚨 Fraud Alert: ${data.alert_type || "Suspicious Activity Detected"}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #dc2626;">🚨 Fraud Alert</h1>
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p><strong>Alert Type:</strong> ${data.alert_type}</p>
            <p><strong>Severity:</strong> <span style="color: ${data.severity === 'high' ? '#dc2626' : data.severity === 'medium' ? '#f59e0b' : '#22c55e'}">${data.severity?.toUpperCase()}</span></p>
            <p><strong>Description:</strong> ${data.description}</p>
            <p><strong>Entity:</strong> ${data.entity_type} (ID: ${data.entity_id})</p>
            <p><strong>Time:</strong> ${new Date().toISOString()}</p>
          </div>
          <p>Please review this alert in the admin dashboard immediately.</p>
          <a href="${data.dashboard_url || '#'}" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View in Dashboard</a>
        </div>
      `,
    },
    payout_request: {
      subject: `💰 New Payout Request - ${data.amount} ${data.currency || "NGN"}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #7c3aed;">💰 New Payout Request</h1>
          <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p><strong>Organization:</strong> ${data.organization_name || "N/A"}</p>
            <p><strong>Amount:</strong> ${data.amount} ${data.currency || "NGN"}</p>
            <p><strong>Payment Method:</strong> ${data.payment_method}</p>
            ${data.payment_method === 'bank' ? `
              <p><strong>Bank:</strong> ${data.bank_name}</p>
              <p><strong>Account:</strong> ${data.account_number}</p>
              <p><strong>Account Name:</strong> ${data.account_name}</p>
            ` : `
              <p><strong>USDT Address:</strong> ${data.usdt_address}</p>
            `}
            <p><strong>Request Time:</strong> ${new Date().toISOString()}</p>
          </div>
          <a href="${data.dashboard_url || '#'}" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Review Request</a>
        </div>
      `,
    },
    payout_approved: {
      subject: `✅ Payout Approved - ${data.amount} ${data.currency || "NGN"}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #22c55e;">✅ Payout Approved</h1>
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p><strong>Amount:</strong> ${data.amount} ${data.currency || "NGN"}</p>
            <p><strong>Payment Method:</strong> ${data.payment_method}</p>
            <p><strong>Reference:</strong> ${data.reference_id || "N/A"}</p>
            <p><strong>Approved At:</strong> ${new Date().toISOString()}</p>
          </div>
          <p>Your payout has been approved and will be processed shortly.</p>
        </div>
      `,
    },
    payout_rejected: {
      subject: `❌ Payout Rejected - ${data.amount} ${data.currency || "NGN"}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #dc2626;">❌ Payout Rejected</h1>
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p><strong>Amount:</strong> ${data.amount} ${data.currency || "NGN"}</p>
            <p><strong>Reason:</strong> ${data.rejection_reason || "No reason provided"}</p>
            <p><strong>Rejected At:</strong> ${new Date().toISOString()}</p>
          </div>
          <p>Please contact support if you have any questions.</p>
        </div>
      `,
    },
    new_organization: {
      subject: `🏢 New Organization Registration - ${data.company_name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #7c3aed;">🏢 New Organization Registration</h1>
          <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p><strong>Company Name:</strong> ${data.company_name}</p>
            <p><strong>Email:</strong> ${data.email}</p>
            <p><strong>Phone:</strong> ${data.phone || "N/A"}</p>
            <p><strong>Registered At:</strong> ${new Date().toISOString()}</p>
          </div>
          <a href="${data.dashboard_url || '#'}" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Review Application</a>
        </div>
      `,
    },
    content_moderation: {
      subject: `📝 Content Pending Review - ${data.content_type}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #f59e0b;">📝 Content Pending Review</h1>
          <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p><strong>Content Type:</strong> ${data.content_type}</p>
            <p><strong>Entity Type:</strong> ${data.entity_type}</p>
            <p><strong>Submitted By:</strong> ${data.submitted_by || "N/A"}</p>
            <p><strong>Submitted At:</strong> ${new Date().toISOString()}</p>
          </div>
          <a href="${data.dashboard_url || '#'}" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Review Content</a>
        </div>
      `,
    },
  };

  return templates[type] || {
    subject: "Admin Notification",
    html: `<p>${JSON.stringify(data)}</p>`,
  };
};

const handler = async (req: Request): Promise<Response> => {
  console.log("Admin notification function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, data, adminEmails }: AdminNotificationRequest = await req.json();
    console.log("Notification type:", type, "Data:", data);

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    // Get admin emails from database if not provided
    let recipients = adminEmails;
    if (!recipients || recipients.length === 0) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: adminUsers, error } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      if (error) {
        console.error("Error fetching admin users:", error);
        throw error;
      }

      if (adminUsers && adminUsers.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("email")
          .in("id", adminUsers.map((u) => u.user_id));

        recipients = profiles?.map((p) => p.email).filter(Boolean) || [];
      }
    }

    if (!recipients || recipients.length === 0) {
      console.log("No admin emails found, skipping notification");
      return new Response(
        JSON.stringify({ success: true, message: "No recipients found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const template = getEmailTemplate(type, data);
    console.log("Sending email to:", recipients);

    // Use Resend API directly with fetch
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "VoteApp Admin <onboarding@resend.dev>",
        to: recipients,
        subject: template.subject,
        html: template.html,
      }),
    });

    const emailResult = await emailResponse.json();
    console.log("Email sent successfully:", emailResult);

    return new Response(
      JSON.stringify({ success: true, emailResponse: emailResult }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error sending admin notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
