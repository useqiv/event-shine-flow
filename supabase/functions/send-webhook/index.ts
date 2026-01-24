import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// SSRF Protection: Block internal/private IP ranges and localhost
const BLOCKED_URL_PATTERNS = [
  // Localhost variations
  /^https?:\/\/localhost(:\d+)?/i,
  /^https?:\/\/127\.\d+\.\d+\.\d+/i,
  /^https?:\/\/\[::1\]/i,
  // Private IP ranges (RFC 1918)
  /^https?:\/\/10\.\d+\.\d+\.\d+/i,
  /^https?:\/\/172\.(1[6-9]|2\d|3[01])\.\d+\.\d+/i,
  /^https?:\/\/192\.168\.\d+\.\d+/i,
  // Link-local addresses
  /^https?:\/\/169\.254\.\d+\.\d+/i,
  // AWS/Cloud metadata endpoints
  /^https?:\/\/169\.254\.169\.254/i,
  /^https?:\/\/metadata\.google\.internal/i,
  /^https?:\/\/100\.100\.100\.200/i, // Alibaba
  // IPv6 private ranges
  /^https?:\/\/\[fd[0-9a-f]{2}:/i,
  /^https?:\/\/\[fe80:/i,
];

function isUrlBlocked(url: string): boolean {
  return BLOCKED_URL_PATTERNS.some(pattern => pattern.test(url));
}

function validateWebhookUrl(url: string): { valid: boolean; error?: string } {
  try {
    const parsed = new URL(url);
    
    // Only allow HTTPS in production
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return { valid: false, error: 'Only HTTP/HTTPS URLs are allowed' };
    }
    
    // Block internal URLs
    if (isUrlBlocked(url)) {
      return { valid: false, error: 'Internal/private URLs are not allowed for webhooks' };
    }
    
    // Additional hostname checks
    const hostname = parsed.hostname.toLowerCase();
    if (hostname === 'localhost' || hostname.endsWith('.local') || hostname.endsWith('.internal')) {
      return { valid: false, error: 'Local/internal hostnames are not allowed' };
    }
    
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

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

      // Validate webhook URL before sending
      const urlValidation = validateWebhookUrl(webhook.url);
      if (!urlValidation.valid) {
        console.error('Webhook URL blocked:', webhook.url, urlValidation.error);
        return new Response(JSON.stringify({ error: urlValidation.error }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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
      
      // Filter out webhooks with blocked URLs
      const validWebhooks = webhooks.filter(w => {
        const validation = validateWebhookUrl(w.url);
        if (!validation.valid) {
          console.warn('Skipping webhook with blocked URL:', w.id, w.url);
        }
        return validation.valid;
      });
      
      const results = await Promise.all(validWebhooks.map((w) => sendWebhook(w, payload, supabase)));
      return new Response(JSON.stringify({ sent: results.length, skipped: webhooks.length - validWebhooks.length }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

// deno-lint-ignore no-explicit-any
async function sendWebhook(webhook: any, payload: Record<string, unknown>, supabase: any) {
  try {
    // Double-check URL validation before fetch
    const urlValidation = validateWebhookUrl(webhook.url);
    if (!urlValidation.valid) {
      console.error('Webhook URL blocked in sendWebhook:', webhook.url);
      await supabase.from('webhook_logs').insert({ 
        webhook_id: webhook.id, 
        event_type: payload.event, 
        payload, 
        success: false,
        response_status: 0
      });
      return { success: false, error: urlValidation.error };
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    
    if (webhook.secret) {
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey('raw', encoder.encode(webhook.secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
      const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(JSON.stringify(payload)));
      headers['X-Webhook-Signature'] = `sha256=${Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')}`;
    }

    const response = await fetch(webhook.url, { method: 'POST', headers, body: JSON.stringify(payload) });
    const success = response.ok;

    await supabase.from('webhook_logs').insert({ webhook_id: webhook.id, event_type: payload.event, payload, response_status: response.status, success });
    await supabase.from('organization_webhooks').update({ last_triggered_at: new Date().toISOString(), failure_count: success ? 0 : (webhook.failure_count || 0) + 1 }).eq('id', webhook.id);

    return { success, status: response.status };
  } catch (e) {
    console.error('Webhook failed:', e);
    await supabase.from('webhook_logs').insert({ webhook_id: webhook.id, event_type: payload.event, payload, success: false });
    return { success: false };
  }
}
