import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerificationResult {
  valid: boolean;
  status: 'valid' | 'used' | 'cancelled' | 'not_found' | 'wrong_event' | 'expired';
  message: string;
  ticket?: {
    id: string;
    qr_code: string;
    status: string;
    quantity: number;
    created_at: string;
    holder_name: string | null;
    holder_email: string | null;
    ticket_type: {
      name: string;
      price: number;
    } | null;
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { qr_code, event_id } = await req.json();

    // Validate required parameters
    if (!qr_code || typeof qr_code !== 'string') {
      return new Response(
        JSON.stringify({
          valid: false,
          status: 'not_found',
          message: 'QR code is required',
        } as VerificationResult),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!event_id || typeof event_id !== 'string') {
      return new Response(
        JSON.stringify({
          valid: false,
          status: 'not_found',
          message: 'Event ID is required',
        } as VerificationResult),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize QR code input - only allow expected characters
    const sanitizedQRCode = qr_code.trim();
    if (!/^[A-Za-z0-9_-]+$/.test(sanitizedQRCode)) {
      return new Response(
        JSON.stringify({
          valid: false,
          status: 'not_found',
          message: 'Invalid QR code format',
        } as VerificationResult),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch ticket by QR code
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select(`
        id,
        qr_code,
        status,
        quantity,
        created_at,
        event_id,
        user_id,
        ticket_type_id,
        guest_email,
        guest_name
      `)
      .eq('qr_code', sanitizedQRCode)
      .maybeSingle();

    if (ticketError) {
      console.error('Database error:', ticketError);
      return new Response(
        JSON.stringify({
          valid: false,
          status: 'not_found',
          message: 'Error verifying ticket',
        } as VerificationResult),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Ticket not found
    if (!ticket) {
      console.log(`QR code not found: ${sanitizedQRCode}`);
      return new Response(
        JSON.stringify({
          valid: false,
          status: 'not_found',
          message: 'Ticket not found - QR code may be invalid or fake',
        } as VerificationResult),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if ticket belongs to the correct event
    if (ticket.event_id !== event_id) {
      console.log(`Wrong event - ticket event: ${ticket.event_id}, scanned at: ${event_id}`);
      return new Response(
        JSON.stringify({
          valid: false,
          status: 'wrong_event',
          message: 'This ticket is for a different event',
        } as VerificationResult),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch ticket type info
    let ticketType = null;
    if (ticket.ticket_type_id) {
      const { data: tt } = await supabase
        .from('ticket_types')
        .select('name, price')
        .eq('id', ticket.ticket_type_id)
        .maybeSingle();
      ticketType = tt;
    }

    // Fetch holder info
    let holderName = ticket.guest_name;
    let holderEmail = ticket.guest_email;
    
    if (ticket.user_id && !holderName) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', ticket.user_id)
        .maybeSingle();
      
      if (profile) {
        holderName = profile.full_name;
        holderEmail = profile.email;
      }
    }

    // Build ticket response object
    const ticketResponse = {
      id: ticket.id,
      qr_code: ticket.qr_code,
      status: ticket.status,
      quantity: ticket.quantity,
      created_at: ticket.created_at,
      holder_name: holderName,
      holder_email: holderEmail,
      ticket_type: ticketType,
    };

    // Check ticket status
    if (ticket.status === 'used') {
      return new Response(
        JSON.stringify({
          valid: false,
          status: 'used',
          message: 'This ticket has already been used',
          ticket: ticketResponse,
        } as VerificationResult),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (ticket.status === 'cancelled') {
      return new Response(
        JSON.stringify({
          valid: false,
          status: 'cancelled',
          message: 'This ticket has been cancelled',
          ticket: ticketResponse,
        } as VerificationResult),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (ticket.status !== 'active') {
      return new Response(
        JSON.stringify({
          valid: false,
          status: 'expired',
          message: `Ticket status: ${ticket.status}`,
          ticket: ticketResponse,
        } as VerificationResult),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Ticket is valid and active
    return new Response(
      JSON.stringify({
        valid: true,
        status: 'valid',
        message: 'Ticket is valid and ready for check-in',
        ticket: ticketResponse,
      } as VerificationResult),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Verification error:', error);
    return new Response(
      JSON.stringify({
        valid: false,
        status: 'not_found',
        message: 'An error occurred during verification',
      } as VerificationResult),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
