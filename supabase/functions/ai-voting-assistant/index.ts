import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Initialize Supabase client for fetching context
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch active contests and upcoming events for context
    const [contestsResult, eventsResult] = await Promise.all([
      supabase
        .from("contests")
        .select("id, title, category, vote_price, vote_currency, end_date, description")
        .eq("is_active", true)
        .gte("end_date", new Date().toISOString())
        .limit(10),
      supabase
        .from("events")
        .select("id, title, category, venue, event_date, description")
        .eq("is_active", true)
        .gte("event_date", new Date().toISOString())
        .limit(10),
    ]);

    const activeContests = contestsResult.data || [];
    const upcomingEvents = eventsResult.data || [];

    // Build context for the AI
    const contestContext = activeContests.length > 0
      ? `Active Contests:\n${activeContests.map(c => 
          `- "${c.title}" (${c.category}) - Vote price: ${c.vote_currency} ${c.vote_price}, ends ${new Date(c.end_date).toLocaleDateString()}`
        ).join("\n")}`
      : "No active contests at the moment.";

    const eventContext = upcomingEvents.length > 0
      ? `Upcoming Events:\n${upcomingEvents.map(e => 
          `- "${e.title}" (${e.category}) at ${e.venue} on ${new Date(e.event_date).toLocaleDateString()}`
        ).join("\n")}`
      : "No upcoming events at the moment.";

    const systemPrompt = `You are VoteBot, a friendly AI assistant for a voting and events platform. You help users:
- Discover active contests and vote for their favorite contestants
- Find upcoming events and buy tickets
- Understand how voting works (paid voting system with wallet balance)
- Learn about features like vote streaks, referral bonuses, and promo codes

Current Platform Data:
${contestContext}

${eventContext}

Guidelines:
- Be enthusiastic and helpful
- When recommending contests or events, mention specific ones from the data above
- Explain that voting requires wallet balance and each vote costs the specified amount
- Encourage users to check out the dashboard for more details
- Keep responses concise but informative
- If users want to vote or buy tickets, guide them to the specific contest/event pages`;

    console.log("Calling Lovable AI with messages:", messages.length);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please try again later." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Streaming response from Lovable AI");

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("AI Voting Assistant error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
