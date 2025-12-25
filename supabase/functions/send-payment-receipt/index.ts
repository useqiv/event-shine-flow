import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReceiptRequest {
  type: 'vote' | 'ticket';
  user_email: string;
  user_name: string;
  amount: number;
  currency: string;
  quantity: number;
  payment_method: string;
  transaction_ref: string;
  // Vote specific
  contest_title?: string;
  contestant_name?: string;
  // Ticket specific
  event_title?: string;
  event_date?: string;
  event_venue?: string;
  ticket_type?: string;
  qr_code?: string;
}

const generateVoteReceiptHtml = (data: ReceiptRequest) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vote Receipt</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 32px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px;">🗳️ Vote Confirmed!</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">Thank you for your vote</p>
    </div>
    
    <!-- Content -->
    <div style="padding: 32px;">
      <p style="color: #374151; font-size: 16px; margin: 0 0 24px;">Hi ${data.user_name},</p>
      
      <p style="color: #6b7280; font-size: 14px; margin: 0 0 24px;">
        Your vote has been successfully recorded. Here are your transaction details:
      </p>
      
      <!-- Transaction Details -->
      <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Contest</td>
            <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right; font-weight: 600;">${data.contest_title}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Contestant</td>
            <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right; font-weight: 600;">${data.contestant_name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Votes</td>
            <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right; font-weight: 600;">${data.quantity}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Payment Method</td>
            <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right; font-weight: 600;">${data.payment_method}</td>
          </tr>
          <tr style="border-top: 1px solid #e5e7eb;">
            <td style="padding: 16px 0 8px; color: #111827; font-size: 16px; font-weight: 700;">Total Paid</td>
            <td style="padding: 16px 0 8px; color: #7c3aed; font-size: 18px; text-align: right; font-weight: 700;">${data.currency} ${data.amount.toLocaleString()}</td>
          </tr>
        </table>
      </div>
      
      <!-- Reference -->
      <div style="text-align: center; padding: 16px; background-color: #faf5ff; border-radius: 8px; margin-bottom: 24px;">
        <p style="color: #6b7280; font-size: 12px; margin: 0 0 4px;">Transaction Reference</p>
        <p style="color: #7c3aed; font-size: 14px; font-family: monospace; margin: 0;">${data.transaction_ref}</p>
      </div>
      
      <p style="color: #6b7280; font-size: 14px; margin: 0; text-align: center;">
        Thank you for supporting your favorite contestant!
      </p>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
        VotePass - Your trusted voting platform<br>
        Questions? Contact support@votepass.com
      </p>
    </div>
  </div>
</body>
</html>
`;

const generateTicketReceiptHtml = (data: ReceiptRequest) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ticket Receipt</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #f97316 0%, #fb923c 100%); padding: 32px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px;">🎫 Ticket Confirmed!</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">Your tickets are ready</p>
    </div>
    
    <!-- Content -->
    <div style="padding: 32px;">
      <p style="color: #374151; font-size: 16px; margin: 0 0 24px;">Hi ${data.user_name},</p>
      
      <p style="color: #6b7280; font-size: 14px; margin: 0 0 24px;">
        Your ticket purchase was successful! Here are your ticket details:
      </p>
      
      <!-- Event Card -->
      <div style="background: linear-gradient(135deg, #1f2937 0%, #374151 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px; color: white;">
        <h2 style="margin: 0 0 16px; font-size: 20px;">${data.event_title}</h2>
        <p style="margin: 0 0 8px; font-size: 14px; opacity: 0.9;">📅 ${data.event_date}</p>
        <p style="margin: 0 0 16px; font-size: 14px; opacity: 0.9;">📍 ${data.event_venue}</p>
        <div style="border-top: 1px dashed rgba(255,255,255,0.3); padding-top: 16px; display: flex; justify-content: space-between;">
          <span style="font-size: 14px;">${data.ticket_type}</span>
          <span style="font-size: 14px; font-weight: 600;">x${data.quantity}</span>
        </div>
      </div>
      
      <!-- QR Code -->
      ${data.qr_code ? `
      <div style="text-align: center; padding: 24px; background-color: #f9fafb; border-radius: 8px; margin-bottom: 24px;">
        <p style="color: #374151; font-size: 14px; font-weight: 600; margin: 0 0 16px;">Your Ticket QR Code</p>
        <div style="background: white; padding: 16px; display: inline-block; border-radius: 8px; border: 2px dashed #e5e7eb;">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(data.qr_code)}" alt="Ticket QR Code" style="display: block;"/>
        </div>
        <p style="color: #6b7280; font-size: 12px; margin: 16px 0 0;">Show this QR code at the venue entrance</p>
        <p style="color: #9ca3af; font-size: 11px; font-family: monospace; margin: 8px 0 0;">${data.qr_code}</p>
      </div>
      ` : ''}
      
      <!-- Transaction Details -->
      <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Ticket Type</td>
            <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right; font-weight: 600;">${data.ticket_type}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Quantity</td>
            <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right; font-weight: 600;">${data.quantity}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Payment Method</td>
            <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right; font-weight: 600;">${data.payment_method}</td>
          </tr>
          <tr style="border-top: 1px solid #e5e7eb;">
            <td style="padding: 16px 0 8px; color: #111827; font-size: 16px; font-weight: 700;">Total Paid</td>
            <td style="padding: 16px 0 8px; color: #f97316; font-size: 18px; text-align: right; font-weight: 700;">${data.currency} ${data.amount.toLocaleString()}</td>
          </tr>
        </table>
      </div>
      
      <!-- Reference -->
      <div style="text-align: center; padding: 16px; background-color: #fff7ed; border-radius: 8px; margin-bottom: 24px;">
        <p style="color: #6b7280; font-size: 12px; margin: 0 0 4px;">Transaction Reference</p>
        <p style="color: #f97316; font-size: 14px; font-family: monospace; margin: 0;">${data.transaction_ref}</p>
      </div>
      
      <p style="color: #6b7280; font-size: 14px; margin: 0; text-align: center;">
        We look forward to seeing you at the event!
      </p>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
        VotePass - Your trusted event platform<br>
        Questions? Contact support@votepass.com
      </p>
    </div>
  </div>
</body>
</html>
`;

const handler = async (req: Request): Promise<Response> => {
  console.log("Payment receipt function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: ReceiptRequest = await req.json();
    console.log("Receipt data:", JSON.stringify(data));

    const html = data.type === 'vote' 
      ? generateVoteReceiptHtml(data)
      : generateTicketReceiptHtml(data);

    const subject = data.type === 'vote'
      ? `Vote Receipt - ${data.contest_title}`
      : `Ticket Receipt - ${data.event_title}`;

    const emailResponse = await resend.emails.send({
      from: "VotePass <receipts@resend.dev>",
      to: [data.user_email],
      subject,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, ...emailResponse }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error sending receipt:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
