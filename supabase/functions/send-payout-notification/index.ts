import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const ZEPTOMAIL_API_KEY = Deno.env.get("ZEPTOMAIL_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PayoutNotificationRequest {
  payout_id: string;
  status: 'approved' | 'processing' | 'completed' | 'rejected';
  amount: number;
  currency: string;
  organization_email: string;
  organization_name: string;
  rejection_reason?: string;
  payment_method?: string;
}

const sendZeptoEmail = async (to: string, toName: string, subject: string, html: string) => {
  // Handle API key that may already contain the prefix
  const apiKey = ZEPTOMAIL_API_KEY?.startsWith("Zoho-enczapikey") 
    ? ZEPTOMAIL_API_KEY 
    : `Zoho-enczapikey ${ZEPTOMAIL_API_KEY}`;

  const response = await fetch("https://api.zeptomail.com/v1.1/email", {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": apiKey,
    },
    body: JSON.stringify({
      from: { address: "noreply@useqiv.com", name: "Useqiv" },
      to: [{ email_address: { address: to, name: toName || "User" } }],
      subject,
      htmlbody: html,
    }),
  });

  const responseText = await response.text();
  
  if (!responseText || responseText.trim() === "") {
    if (response.ok) return { success: true };
    throw new Error(`ZeptoMail error: ${response.status} ${response.statusText}`);
  }
  
  const data = JSON.parse(responseText);
  
  if (!response.ok) {
    console.error("ZeptoMail API error:", data);
    throw new Error(data.message || "Failed to send email");
  }
  
  return data;
};

const formatCurrency = (amount: number, currency: string) => {
  const symbols: Record<string, string> = {
    'NGN': '₦',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
  };
  const symbol = symbols[currency] || currency;
  return `${symbol}${amount.toLocaleString()}`;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'approved':
    case 'processing':
      return '#2563eb';
    case 'completed':
      return '#16a34a';
    case 'rejected':
      return '#dc2626';
    default:
      return '#6b7280';
  }
};

const getStatusMessage = (status: string, amount: string, rejectionReason?: string) => {
  switch (status) {
    case 'approved':
      return `Your payout request for ${amount} has been approved and is now in the queue for processing.`;
    case 'processing':
      return `Your payout of ${amount} is now being processed. This typically takes 1-3 business days.`;
    case 'completed':
      return `Great news! Your payout of ${amount} has been successfully sent to your account.`;
    case 'rejected':
      return `Unfortunately, your payout request for ${amount} has been rejected. ${rejectionReason ? `Reason: ${rejectionReason}` : 'Please check your payout details and try again.'}`;
    default:
      return `Your payout status has been updated to: ${status}`;
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!ZEPTOMAIL_API_KEY) {
      throw new Error("ZEPTOMAIL_API_KEY is not configured");
    }

    const {
      payout_id,
      status,
      amount,
      currency,
      organization_email,
      organization_name,
      rejection_reason,
      payment_method,
    }: PayoutNotificationRequest = await req.json();

    console.log(`Sending payout notification for payout ${payout_id} with status: ${status}`);

    const formattedAmount = formatCurrency(amount, currency);
    const statusColor = getStatusColor(status);
    const statusMessage = getStatusMessage(status, formattedAmount, rejection_reason);

    const statusBadge = {
      approved: { label: 'Approved', bg: '#dbeafe', color: '#1d4ed8' },
      processing: { label: 'Processing', bg: '#dbeafe', color: '#1d4ed8' },
      completed: { label: 'Completed', bg: '#dcfce7', color: '#166534' },
      rejected: { label: 'Rejected', bg: '#fee2e2', color: '#991b1b' },
    }[status] || { label: status, bg: '#f3f4f6', color: '#374151' };

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="display: inline-block; background: #7c3aed; color: white; font-size: 24px; font-weight: bold; padding: 12px 24px; border-radius: 12px;">
              Useqiv
            </div>
          </div>
          
          <!-- Main Card -->
          <div style="background: white; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden;">
            <!-- Status Banner -->
            <div style="background: ${statusColor}; padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 600;">
                Payout ${status.charAt(0).toUpperCase() + status.slice(1)}
              </h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                Hi ${organization_name},
              </p>
              
              <p style="margin: 0 0 25px; color: #4b5563; font-size: 15px; line-height: 1.6;">
                ${statusMessage}
              </p>
              
              <!-- Payout Details Box -->
              <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
                <h3 style="margin: 0 0 15px; font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">
                  Payout Details
                </h3>
                
                <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                  <span style="color: #6b7280; font-size: 14px;">Amount</span>
                  <span style="color: #111827; font-size: 18px; font-weight: 700;">${formattedAmount}</span>
                </div>
                
                <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                  <span style="color: #6b7280; font-size: 14px;">Status</span>
                  <span style="display: inline-block; background: ${statusBadge.bg}; color: ${statusBadge.color}; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600;">
                    ${statusBadge.label}
                  </span>
                </div>
                
                ${payment_method ? `
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #6b7280; font-size: 14px;">Payment Method</span>
                  <span style="color: #374151; font-size: 14px; font-weight: 500;">${payment_method.toUpperCase()}</span>
                </div>
                ` : ''}
              </div>
              
              ${status === 'rejected' ? `
              <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 25px;">
                <p style="margin: 0; color: #991b1b; font-size: 14px;">
                  <strong>Need help?</strong> Please review your payout details in settings or contact support if you believe this was an error.
                </p>
              </div>
              ` : ''}
              
              ${status === 'completed' ? `
              <div style="background: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 25px;">
                <p style="margin: 0; color: #166534; font-size: 14px;">
                  The funds should appear in your account within 1-3 business days depending on your bank.
                </p>
              </div>
              ` : ''}
              
              <!-- CTA Button -->
              <div style="text-align: center; margin-top: 30px;">
                <a href="${Deno.env.get('FRONTEND_URL') || 'https://useqiv.com'}/org/payouts"
                   style="display: inline-block; background: #7c3aed; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px;">
                  View Payout Details
                </a>
              </div>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 13px;">
            <p style="margin: 0 0 8px;">
              This is an automated notification from Useqiv.
            </p>
            <p style="margin: 0;">
              © ${new Date().getFullYear()} Useqiv. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await sendZeptoEmail(
      organization_email,
      organization_name,
      `Payout ${status.charAt(0).toUpperCase() + status.slice(1)} - ${formattedAmount}`,
      emailHtml
    );

    console.log("Payout notification email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-payout-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
