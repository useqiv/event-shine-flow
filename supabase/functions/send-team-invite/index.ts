import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const ZEPTOMAIL_API_KEY = Deno.env.get("ZEPTOMAIL_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TeamInviteRequest {
  email: string;
  name?: string;
  role: string;
  organizationName: string;
  inviterName: string;
}

const sendZeptoEmail = async (to: string, toName: string, subject: string, html: string) => {
  console.log("Sending email via ZeptoMail to:", to);
  
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
  console.log("ZeptoMail response status:", response.status);
  
  if (!responseText || responseText.trim() === "") {
    if (response.ok) return { success: true };
    throw new Error(`ZeptoMail error: ${response.status} ${response.statusText}`);
  }
  
  const data = JSON.parse(responseText);
  
  if (!response.ok) {
    console.error("ZeptoMail API error:", data);
    throw new Error(data.message || data.error?.details?.[0]?.message || "Failed to send email");
  }
  
  return data;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!ZEPTOMAIL_API_KEY) {
      throw new Error("ZEPTOMAIL_API_KEY is not configured");
    }

    const { email, name, role, organizationName, inviterName }: TeamInviteRequest = await req.json();

    console.log(`Sending team invite to ${email} for organization ${organizationName}`);

    // Role capabilities based on role type
    const roleCapabilities: Record<string, string[]> = {
      'Admin': ['Full access to all features', 'Manage team members', 'View analytics & reports', 'Process payouts'],
      'Manager': ['Create & manage events', 'View analytics & reports', 'Manage contestants', 'Handle customer support'],
      'Editor': ['Create & edit content', 'Manage events & contests', 'View basic reports', 'Upload media files'],
      'Viewer': ['View events & contests', 'Access basic reports', 'Monitor activity', 'Read-only access'],
    };

    const capabilities = roleCapabilities[role] || roleCapabilities['Viewer'];

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Team Invitation - Useqiv</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          
          <!-- Header with gradient and icon -->
          <div style="background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); padding: 40px 32px; border-radius: 16px 16px 0 0; text-align: center;">
            <div style="width: 64px; height: 64px; background-color: rgba(255, 255, 255, 0.2); border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 32px;">👥</span>
            </div>
            <h1 style="color: #ffffff; margin: 0 0 8px; font-size: 28px; font-weight: 700;">You're Invited!</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 0; font-size: 16px;">Join the team on Useqiv</p>
          </div>
          
          <!-- Main content -->
          <div style="background-color: #ffffff; padding: 40px 32px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
            
            <!-- Personalized greeting -->
            <p style="color: #111827; font-size: 18px; line-height: 1.6; margin: 0 0 24px;">
              Hello${name ? ` <strong>${name}</strong>` : ''},
            </p>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.7; margin: 0 0 32px;">
              <strong style="color: #7c3aed;">${inviterName}</strong> has invited you to join their team at <strong style="color: #111827;">${organizationName}</strong> on Useqiv.
            </p>
            
            <!-- Invitation details card -->
            <div style="background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%); border: 1px solid #ddd6fe; border-radius: 12px; padding: 24px; margin: 0 0 32px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 0 0 12px;">
                    <span style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Organization</span>
                    <p style="color: #111827; font-size: 18px; font-weight: 600; margin: 4px 0 0;">${organizationName}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0 0; border-top: 1px solid #ddd6fe;">
                    <span style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Your Role</span>
                    <p style="margin: 8px 0 0;">
                      <span style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: #ffffff; padding: 6px 16px; border-radius: 20px; font-size: 14px; font-weight: 600;">${role}</span>
                    </p>
                  </td>
                </tr>
              </table>
            </div>
            
            <!-- What you can do section -->
            <div style="margin: 0 0 32px;">
              <h3 style="color: #111827; font-size: 16px; font-weight: 600; margin: 0 0 16px;">What you'll be able to do:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                ${capabilities.map((cap, index) => `
                  <tr>
                    <td style="padding: 8px 0; vertical-align: top; width: 24px;">
                      <span style="color: #8b5cf6; font-size: 16px;">✓</span>
                    </td>
                    <td style="padding: 8px 0 8px 8px; color: #374151; font-size: 14px; line-height: 1.5;">
                      ${cap}
                    </td>
                  </tr>
                `).join('')}
              </table>
            </div>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="https://useqiv.com/auth" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px 0 rgba(139, 92, 246, 0.4);">
                Accept Invitation
              </a>
            </div>
            
            <!-- How to accept -->
            <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px; margin: 0 0 24px;">
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0; text-align: center;">
                <strong style="color: #374151;">New to Useqiv?</strong><br>
                Click the button above to create your free account using <strong style="color: #7c3aed;">${email}</strong>
              </p>
            </div>
            
            <!-- Divider -->
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
            
            <!-- Security notice -->
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0; line-height: 1.6;">
              If you didn't expect this invitation, you can safely ignore this email.<br>
              Your email address will not be shared with any third parties.
            </p>
          </div>
          
          <!-- Footer -->
          <div style="text-align: center; padding: 24px 0;">
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px;">
              <a href="https://useqiv.com" style="color: #7c3aed; text-decoration: none; font-weight: 500;">Useqiv</a> - Events, Contests & Crowdfunding Made Easy
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} Useqiv. All rights reserved.
            </p>
            <p style="margin: 16px 0 0;">
              <a href="https://useqiv.com/privacy-policy" style="color: #9ca3af; font-size: 12px; text-decoration: none; margin: 0 8px;">Privacy Policy</a>
              <span style="color: #d1d5db;">•</span>
              <a href="https://useqiv.com/terms-of-service" style="color: #9ca3af; font-size: 12px; text-decoration: none; margin: 0 8px;">Terms of Service</a>
            </p>
          </div>
          
        </div>
      </body>
      </html>
    `;

    const emailResponse = await sendZeptoEmail(
      email,
      name || "User",
      `You've been invited to join ${organizationName}`,
      emailHtml
    );

    console.log("Team invite email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
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
