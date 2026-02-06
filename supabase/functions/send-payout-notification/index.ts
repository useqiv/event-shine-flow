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
  const symbols: Record<string, string> = { 'NGN': '₦', 'USD': '$', 'EUR': '€', 'GBP': '£' };
  return `${symbols[currency] || currency}${amount.toLocaleString()}`;
};

const getStatusConfig = (status: string) => {
  const configs: Record<string, { color: string; bgColor: string; label: string; badgeBg: string; badgeColor: string }> = {
    approved: { color: '#2563eb', bgColor: '#dbeafe', label: 'Approved', badgeBg: '#dbeafe', badgeColor: '#1d4ed8' },
    processing: { color: '#2563eb', bgColor: '#dbeafe', label: 'Processing', badgeBg: '#dbeafe', badgeColor: '#1d4ed8' },
    completed: { color: '#16a34a', bgColor: '#dcfce7', label: 'Completed', badgeBg: '#dcfce7', badgeColor: '#166534' },
    rejected: { color: '#dc2626', bgColor: '#fee2e2', label: 'Rejected', badgeBg: '#fee2e2', badgeColor: '#991b1b' },
  };
  return configs[status] || { color: '#6b7280', bgColor: '#f3f4f6', label: status, badgeBg: '#f3f4f6', badgeColor: '#374151' };
};

const getStatusMessage = (status: string, amount: string, rejectionReason?: string) => {
  const messages: Record<string, string> = {
    approved: `Your payout request for ${amount} has been approved and is now in the queue for processing.`,
    processing: `Your payout of ${amount} is now being processed. This typically takes 1-3 business days.`,
    completed: `Great news! Your payout of ${amount} has been successfully sent to your account.`,
    rejected: `Unfortunately, your payout request for ${amount} has been rejected. ${rejectionReason ? `Reason: ${rejectionReason}` : 'Please check your payout details and try again.'}`,
  };
  return messages[status] || `Your payout status has been updated to: ${status}`;
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
    const config = getStatusConfig(status);
    const statusMessage = getStatusMessage(status, formattedAmount, rejection_reason);

    const emailHtml = `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>Payout ${config.label}</title>
  <style>
    * { box-sizing: border-box; }
    body, table, td, p, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f9fafb; }
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; }
      .fluid-padding { padding: 24px 16px !important; }
      .mobile-full-width { width: 100% !important; display: block !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <div style="display: none; max-height: 0; overflow: hidden;">Payout ${config.label}: ${formattedAmount}</div>
  
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f9fafb;">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px;" class="email-container">
          
          <!-- Logo -->
          <tr>
            <td style="text-align: center; padding-bottom: 24px;">
              <span style="display: inline-block; background: #7c3aed; color: white; font-size: 20px; font-weight: bold; padding: 12px 24px; border-radius: 10px;">Useqiv</span>
            </td>
          </tr>
          
          <!-- Main Card -->
          <tr>
            <td style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              
              <!-- Status Banner -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="background: ${config.color}; padding: 28px 24px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; line-height: 1.3;">
                      Payout ${config.label}
                    </h1>
                  </td>
                </tr>
              </table>
              
              <!-- Content -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding: 32px 24px;" class="fluid-padding">
                    <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.5;">
                      Hi ${organization_name},
                    </p>
                    
                    <p style="margin: 0 0 28px; color: #4b5563; font-size: 15px; line-height: 1.6;">
                      ${statusMessage}
                    </p>
                    
                    <!-- Payout Details Box -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #f9fafb; border-radius: 12px; margin-bottom: 24px;">
                      <tr>
                        <td style="padding: 20px;">
                          <p style="margin: 0 0 16px; font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">
                            Payout Details
                          </p>
                          
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                            <tr>
                              <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Amount</td>
                              <td style="padding: 8px 0; color: #111827; font-size: 18px; font-weight: 700; text-align: right;">${formattedAmount}</td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Status</td>
                              <td style="padding: 8px 0; text-align: right;">
                                <span style="display: inline-block; background: ${config.badgeBg}; color: ${config.badgeColor}; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600;">
                                  ${config.label}
                                </span>
                              </td>
                            </tr>
                            ${payment_method ? `
                            <tr>
                              <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Payment Method</td>
                              <td style="padding: 8px 0; color: #374151; font-size: 14px; font-weight: 500; text-align: right;">${payment_method.toUpperCase()}</td>
                            </tr>
                            ` : ''}
                          </table>
                        </td>
                      </tr>
                    </table>
                    
                    ${status === 'rejected' ? `
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #fef2f2; border-left: 4px solid #dc2626; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
                      <tr>
                        <td style="padding: 16px;">
                          <p style="margin: 0; color: #991b1b; font-size: 14px; line-height: 1.5;">
                            <strong>Need help?</strong> Please review your payout details in settings or contact support if you believe this was an error.
                          </p>
                        </td>
                      </tr>
                    </table>
                    ` : ''}
                    
                    ${status === 'completed' ? `
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #f0fdf4; border-left: 4px solid #16a34a; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
                      <tr>
                        <td style="padding: 16px;">
                          <p style="margin: 0; color: #166534; font-size: 14px; line-height: 1.5;">
                            The funds should appear in your account within 1-3 business days depending on your bank.
                          </p>
                        </td>
                      </tr>
                    </table>
                    ` : ''}
                    
                    <!-- CTA Button -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td align="center" style="padding: 16px 0;">
                          <a href="https://useqiv.com/org/payouts" style="display: inline-block; background: #7c3aed; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px; min-width: 180px; text-align: center;">
                            View Payout Details
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="text-align: center; padding: 28px 20px;">
              <p style="margin: 0 0 8px; color: #9ca3af; font-size: 13px; line-height: 1.5;">
                This is an automated notification from Useqiv.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} Useqiv. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const emailResponse = await sendZeptoEmail(
      organization_email,
      organization_name,
      `Payout ${config.label} - ${formattedAmount}`,
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
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
