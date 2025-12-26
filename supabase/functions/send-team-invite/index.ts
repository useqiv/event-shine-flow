import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TeamInviteRequest {
  email: string;
  name?: string;
  role: string;
  organizationName: string;
  inviterName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, role, organizationName, inviterName }: TeamInviteRequest = await req.json();

    console.log(`Sending team invite to ${email} for organization ${organizationName}`);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "VoteApp <onboarding@resend.dev>",
        to: [email],
        subject: `You've been invited to join ${organizationName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 32px; border-radius: 16px 16px 0 0; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Team Invitation</h1>
              </div>
              
              <div style="background-color: #ffffff; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <p style="color: #18181b; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
                  Hello${name ? ` ${name}` : ''},
                </p>
                
                <p style="color: #18181b; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                  <strong>${inviterName}</strong> has invited you to join <strong>${organizationName}</strong> as a <strong>${role}</strong> on VoteApp.
                </p>
                
                <div style="background-color: #faf5ff; border-left: 4px solid #7c3aed; padding: 16px; margin: 0 0 24px; border-radius: 0 8px 8px 0;">
                  <p style="color: #6b21a8; font-size: 14px; margin: 0;">
                    <strong>Your Role:</strong> ${role}<br>
                    <strong>Organization:</strong> ${organizationName}
                  </p>
                </div>
                
                <p style="color: #52525b; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
                  To accept this invitation, please log in to your VoteApp account. If you don't have an account yet, you can create one using this email address.
                </p>
                
                <div style="text-align: center; margin: 32px 0;">
                  <a href="https://voteapp.lovable.app/auth" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    Accept Invitation
                  </a>
                </div>
                
                <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;">
                
                <p style="color: #71717a; font-size: 12px; text-align: center; margin: 0;">
                  If you didn't expect this invitation, you can safely ignore this email.
                </p>
              </div>
              
              <p style="color: #a1a1aa; font-size: 12px; text-align: center; margin-top: 24px;">
                © ${new Date().getFullYear()} VoteApp. All rights reserved.
              </p>
            </div>
          </body>
          </html>
        `,
      }),
    });

    if (!res.ok) {
      const errorData = await res.text();
      console.error("Resend API error:", errorData);
      throw new Error(`Failed to send email: ${errorData}`);
    }

    const data = await res.json();
    console.log("Team invite email sent successfully:", data);

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending team invite email:", error);
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
