import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type TicketLookupRequest = {
  tx_ref: string;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { tx_ref } = (await req.json()) as TicketLookupRequest;

    if (!tx_ref || typeof tx_ref !== "string") {
      return new Response(JSON.stringify({ error: "Missing tx_ref" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // tx_ref is high-entropy; we return a minimal payload needed for the success screen.
    const { data, error } = await supabase
      .from("tickets")
      .select(
        `
        id,
        qr_code,
        guest_name,
        guest_email,
        quantity,
        event:events(title, venue, event_date),
        ticket_type:ticket_types(name)
      `,
      )
      .eq("payment_reference_id", tx_ref)
      .maybeSingle();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!data) {
      return new Response(JSON.stringify({ data: null }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ data }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
