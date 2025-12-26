import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { webhookId, eventType, data, test, organizationId } = await req.json();
    console.log('Webhook request:', { webhookId, eventType, test });

    if (webhookId && test) {
      const { data: webhook, error } = await supabase
        .from('organization_webhooks')
        .select('*')
        .eq('id', webhookId)
        .single();

      if (error || !webhook) {
        return new Response(JSON.stringify({ error: 'Webhook not found' }), 
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const result = await sendWebhook(webhook, { event: 'test', timestamp: new Date().toISOString(), data: { message: 'Test webhook' } }, supabase);
      return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (eventType && organizationId && data) {
      const { data: webhooks } = await supabase
        .from('organization_webhooks')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .contains('events', [eventType]);

      if (!webhooks?.length) {
        return new Response(JSON.stringify({ message: 'No webhooks' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const payload = { event: eventType, timestamp: new Date().toISOString(), data };
      const results = await Promise.all(webhooks.map((w: Record<string, unknown>) => sendWebhook(w, payload, supabase)));
      return new Response(JSON.stringify({ sent: results.length }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

async function sendWebhook(webhook: Record<string, unknown>, payload: Record<string, unknown>, supabase: ReturnType<typeof createClient>) {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    
    if (webhook.secret) {
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey('raw', encoder.encode(webhook.secret as string), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
      const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(JSON.stringify(payload)));
      headers['X-Webhook-Signature'] = `sha256=${Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')}`;
    }

    const response = await fetch(webhook.url as string, { method: 'POST', headers, body: JSON.stringify(payload) });
    const success = response.ok;

    await supabase.from('webhook_logs').insert({ webhook_id: webhook.id, event_type: payload.event, payload, response_status: response.status, success } as never);
    await supabase.from('organization_webhooks').update({ last_triggered_at: new Date().toISOString(), failure_count: success ? 0 : ((webhook.failure_count as number) || 0) + 1 } as never).eq('id', webhook.id as string);

    return { success, status: response.status };
  } catch (e) {
    console.error('Webhook failed:', e);
    await supabase.from('webhook_logs').insert({ webhook_id: webhook.id, event_type: payload.event, payload, success: false } as never);
    return { success: false };
  }
}
