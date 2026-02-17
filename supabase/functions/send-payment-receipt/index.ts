import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const ZEPTOMAIL_API_KEY = Deno.env.get("ZEPTOMAIL_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReceiptRequest {
  type: 'vote' | 'ticket' | 'wallet';
  user_email: string;
  user_name: string;
  amount: number;
  currency: string;
  quantity?: number;
  payment_method: string;
  transaction_ref: string;
  contest_title?: string;
  contestant_name?: string;
  event_title?: string;
  event_date?: string;
  event_venue?: string;
  ticket_type?: string;
  qr_code?: string;
  // Wallet-specific
  new_balance?: number;
  wallet_currency?: string;
  charge_amount?: number;
  total_credited?: number;
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
      to: [{ email_address: { address: to, name: toName } }],
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

const responsiveWrapper = (content: string, preheader: string = "") => `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
  <title>Useqiv Receipt</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    * { box-sizing: border-box; }
    body, table, td, p, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f4f4f5; }
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; }
      .fluid-padding { padding: 24px 16px !important; }
      .mobile-center { text-align: center !important; }
      .mobile-full-width { width: 100% !important; display: block !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  ${preheader ? `<div style="display: none; max-height: 0; overflow: hidden;">${preheader}</div>` : ''}
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px;" class="email-container">
          ${content}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const generateVoteReceiptHtml = (data: ReceiptRequest) => {
  const content = `
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 32px 24px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; line-height: 1.3;">🗳️ Vote Confirmed!</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 15px;">Thank you for your vote</p>
      </td>
    </tr>
    
    <!-- Content -->
    <tr>
      <td style="background-color: #ffffff; padding: 32px 24px;" class="fluid-padding">
        <p style="color: #374151; font-size: 16px; margin: 0 0 24px; line-height: 1.5;">Hi ${data.user_name},</p>
        
        <p style="color: #6b7280; font-size: 15px; margin: 0 0 24px; line-height: 1.6;">
          Your vote has been successfully recorded. Here are your transaction details:
        </p>
        
        <!-- Transaction Details -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f9fafb; border-radius: 10px; margin-bottom: 24px;">
          <tr>
            <td style="padding: 20px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding: 10px 0; color: #6b7280; font-size: 14px; line-height: 1.4;">Contest</td>
                  <td style="padding: 10px 0; color: #111827; font-size: 14px; text-align: right; font-weight: 600;">${data.contest_title}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #6b7280; font-size: 14px; line-height: 1.4;">Contestant</td>
                  <td style="padding: 10px 0; color: #111827; font-size: 14px; text-align: right; font-weight: 600;">${data.contestant_name}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #6b7280; font-size: 14px; line-height: 1.4;">Votes</td>
                  <td style="padding: 10px 0; color: #111827; font-size: 14px; text-align: right; font-weight: 600;">${data.quantity}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #6b7280; font-size: 14px; line-height: 1.4;">Payment Method</td>
                  <td style="padding: 10px 0; color: #111827; font-size: 14px; text-align: right; font-weight: 600;">${data.payment_method}</td>
                </tr>
                <tr>
                  <td colspan="2" style="border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 8px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="color: #111827; font-size: 16px; font-weight: 700;">Total Paid</td>
                        <td style="color: #7c3aed; font-size: 20px; text-align: right; font-weight: 700;">${data.currency} ${data.amount.toLocaleString()}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        
        <!-- Reference -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #faf5ff; border-radius: 8px; margin-bottom: 24px;">
          <tr>
            <td style="padding: 16px; text-align: center;">
              <p style="color: #6b7280; font-size: 12px; margin: 0 0 6px;">Transaction Reference</p>
              <p style="color: #7c3aed; font-size: 14px; font-family: monospace; margin: 0; word-break: break-all;">${data.transaction_ref}</p>
            </td>
          </tr>
        </table>
        
        <p style="color: #6b7280; font-size: 14px; margin: 0; text-align: center; line-height: 1.5;">
          Thank you for supporting your favorite contestant!
        </p>
      </td>
    </tr>
    
    <!-- Footer -->
    <tr>
      <td style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
        <p style="color: #9ca3af; font-size: 13px; margin: 0; line-height: 1.6;">
          Useqiv - Your trusted voting platform<br>
          Questions? <a href="mailto:support@useqiv.com" style="color: #7c3aed; text-decoration: none;">support@useqiv.com</a>
        </p>
      </td>
    </tr>
  `;
  return responsiveWrapper(content, `Vote confirmed for ${data.contestant_name}`);
};

const generateTicketReceiptHtml = (data: ReceiptRequest) => {
  const content = `
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #f97316 0%, #fb923c 100%); padding: 32px 24px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; line-height: 1.3;">🎫 Ticket Confirmed!</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 15px;">Your tickets are ready</p>
      </td>
    </tr>
    
    <!-- Content -->
    <tr>
      <td style="background-color: #ffffff; padding: 32px 24px;" class="fluid-padding">
        <p style="color: #374151; font-size: 16px; margin: 0 0 24px; line-height: 1.5;">Hi ${data.user_name},</p>
        
        <p style="color: #6b7280; font-size: 15px; margin: 0 0 24px; line-height: 1.6;">
          Your ticket purchase was successful! Here are your ticket details:
        </p>
        
        <!-- Event Card -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #1f2937 0%, #374151 100%); border-radius: 12px; margin-bottom: 24px;">
          <tr>
            <td style="padding: 24px;">
              <h2 style="color: #ffffff; margin: 0 0 16px; font-size: 20px; line-height: 1.3;">${data.event_title}</h2>
              <p style="color: rgba(255,255,255,0.9); margin: 0 0 8px; font-size: 14px;">📅 ${data.event_date}</p>
              <p style="color: rgba(255,255,255,0.9); margin: 0 0 16px; font-size: 14px;">📍 ${data.event_venue}</p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-top: 1px dashed rgba(255,255,255,0.3); padding-top: 16px;">
                <tr>
                  <td style="color: #ffffff; font-size: 14px;">${data.ticket_type}</td>
                  <td style="color: #ffffff; font-size: 14px; font-weight: 600; text-align: right;">×${data.quantity}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        
        ${data.qr_code ? `
        <!-- QR Code -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f9fafb; border-radius: 10px; margin-bottom: 24px;">
          <tr>
            <td style="padding: 24px; text-align: center;">
              <p style="color: #374151; font-size: 14px; font-weight: 600; margin: 0 0 16px;">Your Ticket QR Code</p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="background: white; padding: 16px; border-radius: 8px; border: 2px dashed #e5e7eb;">
                <tr>
                  <td>
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(data.qr_code)}" alt="Ticket QR Code" width="150" height="150" style="display: block;"/>
                  </td>
                </tr>
              </table>
              <p style="color: #6b7280; font-size: 12px; margin: 16px 0 0; line-height: 1.5;">Show this QR code at the venue entrance</p>
              <p style="color: #9ca3af; font-size: 11px; font-family: monospace; margin: 8px 0 0; word-break: break-all;">${data.qr_code}</p>
            </td>
          </tr>
        </table>
        ` : ''}
        
        <!-- Transaction Details -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f9fafb; border-radius: 10px; margin-bottom: 24px;">
          <tr>
            <td style="padding: 20px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Ticket Type</td>
                  <td style="padding: 10px 0; color: #111827; font-size: 14px; text-align: right; font-weight: 600;">${data.ticket_type}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Quantity</td>
                  <td style="padding: 10px 0; color: #111827; font-size: 14px; text-align: right; font-weight: 600;">${data.quantity}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Payment Method</td>
                  <td style="padding: 10px 0; color: #111827; font-size: 14px; text-align: right; font-weight: 600;">${data.payment_method}</td>
                </tr>
                <tr>
                  <td colspan="2" style="border-top: 1px solid #e5e7eb; padding-top: 16px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="color: #111827; font-size: 16px; font-weight: 700;">Total Paid</td>
                        <td style="color: #f97316; font-size: 20px; text-align: right; font-weight: 700;">${data.currency} ${data.amount.toLocaleString()}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        
        <!-- Reference -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #fff7ed; border-radius: 8px; margin-bottom: 24px;">
          <tr>
            <td style="padding: 16px; text-align: center;">
              <p style="color: #6b7280; font-size: 12px; margin: 0 0 6px;">Transaction Reference</p>
              <p style="color: #f97316; font-size: 14px; font-family: monospace; margin: 0; word-break: break-all;">${data.transaction_ref}</p>
            </td>
          </tr>
        </table>
        
        <p style="color: #6b7280; font-size: 14px; margin: 0; text-align: center; line-height: 1.5;">
          We look forward to seeing you at the event!
        </p>
      </td>
    </tr>
    
    <!-- Footer -->
    <tr>
      <td style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
        <p style="color: #9ca3af; font-size: 13px; margin: 0; line-height: 1.6;">
          Useqiv - Your trusted event platform<br>
          Questions? <a href="mailto:support@useqiv.com" style="color: #f97316; text-decoration: none;">support@useqiv.com</a>
        </p>
      </td>
    </tr>
  `;
  return responsiveWrapper(content, `Ticket confirmed for ${data.event_title}`);
};

const generateWalletReceiptHtml = (data: ReceiptRequest) => {
  const chargeAmount = data.charge_amount || 0;
  const totalCredited = data.total_credited || data.amount;
  const content = `
    <!-- Header with Logo -->
    <tr>
      <td style="background-color: #ffffff; padding: 32px 24px 16px; text-align: center; border-radius: 12px 12px 0 0;">
        <img src="https://tirqmqzgksclsjxfiham.supabase.co/storage/v1/object/public/contest-images/useqiv-logo.png" alt="Useqiv" width="120" style="display: inline-block; margin-bottom: 16px;" />
        <h1 style="color: #111827; margin: 0; font-size: 24px; font-weight: 700; line-height: 1.3;">Wallet Funded Successfully</h1>
        <p style="color: #6b7280; margin: 10px 0 0; font-size: 15px;">Your wallet has been credited</p>
      </td>
    </tr>
    
    <!-- Content -->
    <tr>
      <td style="background-color: #ffffff; padding: 0 24px 32px;" class="fluid-padding">
        <p style="color: #374151; font-size: 16px; margin: 0 0 24px; line-height: 1.5;">Hi ${data.user_name},</p>
        
        <p style="color: #6b7280; font-size: 15px; margin: 0 0 24px; line-height: 1.6;">
          Your wallet funding was successful. Here is your receipt:
        </p>
        
        <!-- Transaction Details -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border: 1px solid #e5e7eb; border-radius: 10px; margin-bottom: 24px;">
          <tr>
            <td style="padding: 20px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding: 10px 0; color: #6b7280; font-size: 14px; border-bottom: 1px solid #f3f4f6;">Amount Funded</td>
                  <td style="padding: 10px 0; color: #111827; font-size: 14px; text-align: right; font-weight: 600; border-bottom: 1px solid #f3f4f6;">${data.currency} ${data.amount.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #6b7280; font-size: 14px; border-bottom: 1px solid #f3f4f6;">Extra 1% Charge</td>
                  <td style="padding: 10px 0; color: #111827; font-size: 14px; text-align: right; font-weight: 600; border-bottom: 1px solid #f3f4f6;">+ ${data.currency} ${chargeAmount.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #6b7280; font-size: 14px; border-bottom: 1px solid #f3f4f6;">Payment Method</td>
                  <td style="padding: 10px 0; color: #111827; font-size: 14px; text-align: right; font-weight: 600; border-bottom: 1px solid #f3f4f6;">${data.payment_method}</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding-top: 16px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="color: #111827; font-size: 16px; font-weight: 700;">Total Credited</td>
                        <td style="color: #16a34a; font-size: 20px; text-align: right; font-weight: 700;">${data.currency} ${totalCredited.toLocaleString()}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- New Balance -->
        ${data.new_balance !== undefined ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f0fdf4; border-radius: 8px; margin-bottom: 24px;">
          <tr>
            <td style="padding: 16px; text-align: center;">
              <p style="color: #6b7280; font-size: 12px; margin: 0 0 6px;">New Wallet Balance</p>
              <p style="color: #16a34a; font-size: 22px; font-weight: 700; margin: 0;">${data.wallet_currency || data.currency} ${data.new_balance.toLocaleString()}</p>
            </td>
          </tr>
        </table>
        ` : ''}
        
        <!-- Reference -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f9fafb; border-radius: 8px; margin-bottom: 24px;">
          <tr>
            <td style="padding: 16px; text-align: center;">
              <p style="color: #6b7280; font-size: 12px; margin: 0 0 6px;">Transaction Reference</p>
              <p style="color: #374151; font-size: 14px; font-family: monospace; margin: 0; word-break: break-all;">${data.transaction_ref}</p>
            </td>
          </tr>
        </table>
        
        <p style="color: #6b7280; font-size: 14px; margin: 0; text-align: center; line-height: 1.5;">
          Thank you for funding your wallet!
        </p>
      </td>
    </tr>
    
    <!-- Footer -->
    <tr>
      <td style="background-color: #ffffff; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
        <p style="color: #9ca3af; font-size: 13px; margin: 0; line-height: 1.6;">
          Useqiv - Your trusted platform<br>
          Questions? <a href="mailto:support@useqiv.com" style="color: #374151; text-decoration: none;">support@useqiv.com</a>
        </p>
      </td>
    </tr>
  `;
  return responsiveWrapper(content, `Wallet funded with ${data.currency} ${totalCredited.toLocaleString()}`);
};

const handler = async (req: Request): Promise<Response> => {
  console.log("Payment receipt function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!ZEPTOMAIL_API_KEY) {
      console.error("ZEPTOMAIL_API_KEY is not configured");
      throw new Error("ZEPTOMAIL_API_KEY is not configured");
    }

    const data: ReceiptRequest = await req.json();
    console.log("Receipt request received - Type:", data.type, "Email:", data.user_email);

    if (!data.user_email) {
      console.error("Missing user_email in receipt request");
      throw new Error("user_email is required");
    }

    if (!data.type) {
      console.error("Missing type in receipt request");
      throw new Error("type is required");
    }

    let html: string;
    let subject: string;

    if (data.type === 'vote') {
      html = generateVoteReceiptHtml(data);
      subject = `Vote Receipt - ${data.contest_title}`;
    } else if (data.type === 'ticket') {
      html = generateTicketReceiptHtml(data);
      subject = `Ticket Receipt - ${data.event_title}`;
    } else if (data.type === 'wallet') {
      html = generateWalletReceiptHtml(data);
      subject = `Wallet Funding Receipt - ${data.currency} ${data.total_credited?.toLocaleString() || data.amount.toLocaleString()}`;
    } else {
      throw new Error("Invalid receipt type");
    }

    console.log("Sending email via ZeptoMail - To:", data.user_email);

    const emailResponse = await sendZeptoEmail(data.user_email, data.user_name, subject, html);

    console.log("ZeptoMail API response:", JSON.stringify(emailResponse));

    return new Response(
      JSON.stringify({ success: true, ...emailResponse }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error sending receipt:", error.message, error.stack);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
