import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const ZEPTOMAIL_API_KEY = Deno.env.get("ZEPTOMAIL_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  userId: string;
  email: string;
  fullName?: string;
}

async function sendZeptoEmail(to: string, toName: string, subject: string, html: string) {
  const response = await fetch("https://api.zeptomail.com/v1.1/email", {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": `Zoho-enczapikey ${ZEPTOMAIL_API_KEY}`,
    },
    body: JSON.stringify({
      from: { address: "noreply@useqiv.com", name: "Useqiv" },
      to: [{ email_address: { address: to, name: toName } }],
      subject,
      htmlbody: html,
    }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    console.error("ZeptoMail API error:", data);
    throw new Error(data.message || "Failed to send email");
  }

  return data;
}

function buildWelcomeEmailHtml(userName: string, referralCode: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); padding: 50px 40px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">🎉 Welcome to Useqiv!</h1>
                  <p style="color: rgba(255,255,255,0.9); margin: 16px 0 0 0; font-size: 18px;">Your gateway to exciting contests & events</p>
                </td>
              </tr>
              
              <!-- Welcome Message -->
              <tr>
                <td style="padding: 40px;">
                  <p style="color: #374151; font-size: 18px; margin: 0 0 24px 0;">Hi ${userName}! 👋</p>
                  
                  <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                    Thank you for joining Useqiv! We're thrilled to have you on board. Get ready to discover amazing contests, events, and campaigns happening around you.
                  </p>
                  
                  <!-- Getting Started Section -->
                  <h2 style="color: #111827; font-size: 20px; margin: 0 0 20px 0;">🚀 Getting Started</h2>
                  
                  <!-- Step 1 -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
                    <tr>
                      <td width="50" style="vertical-align: top;">
                        <div style="background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: white; width: 36px; height: 36px; border-radius: 50%; text-align: center; line-height: 36px; font-weight: bold;">1</div>
                      </td>
                      <td>
                        <h3 style="color: #111827; margin: 0 0 8px 0; font-size: 16px;">Explore Contests & Events</h3>
                        <p style="color: #6b7280; margin: 0; font-size: 14px;">Browse trending voting contests and upcoming events in your area.</p>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Step 2 -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
                    <tr>
                      <td width="50" style="vertical-align: top;">
                        <div style="background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: white; width: 36px; height: 36px; border-radius: 50%; text-align: center; line-height: 36px; font-weight: bold;">2</div>
                      </td>
                      <td>
                        <h3 style="color: #111827; margin: 0 0 8px 0; font-size: 16px;">Vote & Buy Tickets</h3>
                        <p style="color: #6b7280; margin: 0; font-size: 14px;">Support your favorite contestants and purchase tickets to amazing events.</p>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Step 3 -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
                    <tr>
                      <td width="50" style="vertical-align: top;">
                        <div style="background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: white; width: 36px; height: 36px; border-radius: 50%; text-align: center; line-height: 36px; font-weight: bold;">3</div>
                      </td>
                      <td>
                        <h3 style="color: #111827; margin: 0 0 8px 0; font-size: 16px;">Earn Rewards</h3>
                        <p style="color: #6b7280; margin: 0; font-size: 14px;">Refer friends, maintain voting streaks, and unlock exclusive rewards!</p>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- CTA Button -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" style="padding: 10px 0 30px 0;">
                        <a href="https://useqiv.com/dashboard" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                          Start Exploring
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Referral Section -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #faf5ff 0%, #f0e7ff 100%); border: 2px solid #e9d5ff; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                    <tr>
                      <td style="text-align: center;">
                        <h3 style="color: #7c3aed; margin: 0 0 12px 0; font-size: 18px;">💰 Earn Money with Referrals!</h3>
                        <p style="color: #374151; margin: 0 0 16px 0; font-size: 14px;">Share your unique code with friends and earn rewards when they sign up and make purchases!</p>
                        <div style="background-color: #ffffff; border: 2px dashed #8b5cf6; border-radius: 8px; padding: 12px 24px; display: inline-block;">
                          <span style="color: #8b5cf6; font-size: 20px; font-weight: bold; letter-spacing: 2px;">${referralCode}</span>
                        </div>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Features Grid -->
                  <h2 style="color: #111827; font-size: 18px; margin: 30px 0 16px 0;">What you can do on Useqiv:</h2>
                  
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td width="50%" style="padding: 8px;">
                        <div style="background-color: #fef3c7; border-radius: 8px; padding: 16px; text-align: center;">
                          <span style="font-size: 24px;">🏆</span>
                          <p style="color: #92400e; margin: 8px 0 0 0; font-size: 14px; font-weight: 600;">Vote in Contests</p>
                        </div>
                      </td>
                      <td width="50%" style="padding: 8px;">
                        <div style="background-color: #dbeafe; border-radius: 8px; padding: 16px; text-align: center;">
                          <span style="font-size: 24px;">🎟️</span>
                          <p style="color: #1e40af; margin: 8px 0 0 0; font-size: 14px; font-weight: 600;">Buy Event Tickets</p>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td width="50%" style="padding: 8px;">
                        <div style="background-color: #d1fae5; border-radius: 8px; padding: 16px; text-align: center;">
                          <span style="font-size: 24px;">💝</span>
                          <p style="color: #065f46; margin: 8px 0 0 0; font-size: 14px; font-weight: 600;">Support Campaigns</p>
                        </div>
                      </td>
                      <td width="50%" style="padding: 8px;">
                        <div style="background-color: #fce7f3; border-radius: 8px; padding: 16px; text-align: center;">
                          <span style="font-size: 24px;">🎁</span>
                          <p style="color: #9d174d; margin: 8px 0 0 0; font-size: 14px; font-weight: 600;">Earn Rewards</p>
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="color: #6b7280; font-size: 14px; margin: 0 0 16px 0;">
                    Questions? We're here to help!<br>
                    <a href="mailto:support@useqiv.com" style="color: #8b5cf6;">support@useqiv.com</a>
                  </p>
                  <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                    © 2024 Useqiv. All rights reserved.<br>
                    <a href="https://useqiv.com/privacy-policy" style="color: #9ca3af;">Privacy Policy</a> • 
                    <a href="https://useqiv.com/terms-of-service" style="color: #9ca3af;">Terms of Service</a>
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
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!ZEPTOMAIL_API_KEY) {
      throw new Error("ZEPTOMAIL_API_KEY is not configured");
    }

    const { userId, email, fullName }: WelcomeEmailRequest = await req.json();

    if (!userId || !email) {
      throw new Error("userId and email are required");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Get user's referral code from wallet
    const { data: wallet, error: walletError } = await supabase
      .from("wallets")
      .select("referral_code")
      .eq("user_id", userId)
      .single();

    if (walletError) {
      console.error("Error fetching wallet:", walletError);
    }

    const referralCode = wallet?.referral_code || "USEQIV";
    const userName = fullName || email.split("@")[0];

    const html = buildWelcomeEmailHtml(userName, referralCode);

    await sendZeptoEmail(
      email,
      userName,
      "🎉 Welcome to Useqiv - Let's Get Started!",
      html
    );

    console.log(`Welcome email sent to ${email}`);

    return new Response(
      JSON.stringify({ success: true, message: "Welcome email sent" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
