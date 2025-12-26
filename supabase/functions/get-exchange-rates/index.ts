import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cache rates for 1 hour
let cachedRates: { rates: Record<string, number>; timestamp: number } | null = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if we have valid cached rates
    if (cachedRates && Date.now() - cachedRates.timestamp < CACHE_DURATION) {
      console.log('Returning cached exchange rates');
      return new Response(JSON.stringify({ 
        rates: cachedRates.rates,
        cached: true,
        lastUpdated: new Date(cachedRates.timestamp).toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch fresh rates from the free ExchangeRate API (no API key required for basic usage)
    console.log('Fetching fresh exchange rates from API');
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    
    if (!response.ok) {
      throw new Error(`Exchange rate API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract the rates we need
    const supportedCurrencies = ['USD', 'NGN', 'EUR', 'GBP', 'GHS', 'KES', 'ZAR'];
    const rates: Record<string, number> = {};
    
    for (const currency of supportedCurrencies) {
      if (data.rates[currency]) {
        rates[currency] = data.rates[currency];
      }
    }

    // Cache the rates
    cachedRates = {
      rates,
      timestamp: Date.now()
    };

    console.log('Exchange rates fetched successfully:', rates);

    return new Response(JSON.stringify({ 
      rates,
      cached: false,
      lastUpdated: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching exchange rates:', errorMessage);
    
    // Return fallback static rates if API fails
    const fallbackRates = {
      USD: 1,
      NGN: 1550,
      EUR: 0.92,
      GBP: 0.79,
      GHS: 15.5,
      KES: 153,
      ZAR: 18.5,
    };

    return new Response(JSON.stringify({ 
      rates: fallbackRates,
      cached: false,
      fallback: true,
      error: errorMessage
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
