import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  console.log("Test Flutterwave connection called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Fetching Flutterwave settings for connection test...");

    // Fetch Flutterwave settings from platform_settings
    const { data: settings, error: settingsError } = await supabase
      .from("platform_settings")
      .select("setting_key, setting_value")
      .in("setting_key", ["flutterwave_secret_key", "flutterwave_test_mode"]);

    if (settingsError) {
      console.error("Failed to fetch settings:", settingsError.message);
      return new Response(
        JSON.stringify({ 
          success: false, 
          connected: false,
          message: "Failed to load settings from database" 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Settings fetched:", settings?.length || 0, "settings found");

    const getSetting = (key: string) => settings?.find(s => s.setting_key === key)?.setting_value || "";

    // Get secret key from platform settings first, fallback to env
    let secretKey = getSetting("flutterwave_secret_key");
    console.log("Secret key from DB:", secretKey ? "Found (length: " + secretKey.length + ")" : "Not found");
    
    if (!secretKey) {
      secretKey = Deno.env.get("FLUTTERWAVE_SECRET_KEY") || "";
      console.log("Secret key from ENV:", secretKey ? "Found (length: " + secretKey.length + ")" : "Not found");
    }

    if (!secretKey) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          connected: false,
          message: "No API secret key configured. Please add your Flutterwave secret key in Admin Settings > Flutterwave Configuration and save." 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Test the connection by fetching account balance
    const response = await fetch("https://api.flutterwave.com/v3/balances", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    console.log("Flutterwave balance check response:", data.status);

    if (data.status === "success") {
      // Get the NGN balance or first available balance
      const balances = data.data || [];
      const ngnBalance = balances.find((b: any) => b.currency === "NGN");
      const primaryBalance = ngnBalance || balances[0];

      return new Response(
        JSON.stringify({
          success: true,
          connected: true,
          message: "Connection successful",
          balance: primaryBalance ? {
            currency: primaryBalance.currency,
            available_balance: primaryBalance.available_balance,
            ledger_balance: primaryBalance.ledger_balance,
          } : null,
          test_mode: getSetting("flutterwave_test_mode") === "true",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          connected: false,
          message: data.message || "Invalid API credentials",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error: any) {
    console.error("Error testing Flutterwave connection:", error.message);
    return new Response(
      JSON.stringify({
        success: false,
        connected: false,
        message: error.message || "Connection test failed",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
