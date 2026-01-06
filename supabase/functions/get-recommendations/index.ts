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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Validate JWT using getClaims
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error("JWT validation failed:", claimsError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    // Fetch user's voting history
    const { data: votes } = await supabaseClient
      .from("votes")
      .select(`
        contestant_id,
        contest_id,
        quantity,
        contestants (name, contest_id),
        contests (title, category)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    // Fetch user's ticket purchases
    const { data: tickets } = await supabaseClient
      .from("tickets")
      .select(`
        event_id,
        events (title, category)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    // Fetch active contests
    const { data: activeContests } = await supabaseClient
      .from("contests")
      .select("id, title, category, image_url, vote_price, vote_currency, end_date")
      .eq("is_active", true)
      .gt("end_date", new Date().toISOString())
      .limit(10);

    // Fetch upcoming events
    const { data: upcomingEvents } = await supabaseClient
      .from("events")
      .select("id, title, category, image_url, event_date, venue")
      .eq("is_active", true)
      .gt("event_date", new Date().toISOString())
      .limit(10);

    // Build context for AI
    const votedCategories = votes?.map(v => (v.contests as any)?.category).filter(Boolean) || [];
    const ticketCategories = tickets?.map(t => (t.events as any)?.category).filter(Boolean) || [];
    const userPreferences = [...votedCategories, ...ticketCategories];

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      // Fallback: return random recommendations if no API key
      return new Response(JSON.stringify({
        contests: activeContests?.slice(0, 3) || [],
        events: upcomingEvents?.slice(0, 3) || [],
        reason: "Based on popular picks"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `Based on this user's activity:
- Categories they've voted in: ${[...new Set(votedCategories)].join(", ") || "None yet"}
- Event categories they've attended: ${[...new Set(ticketCategories)].join(", ") || "None yet"}

Available contests: ${JSON.stringify(activeContests?.map(c => ({ id: c.id, title: c.title, category: c.category })) || [])}

Available events: ${JSON.stringify(upcomingEvents?.map(e => ({ id: e.id, title: e.title, category: e.category })) || [])}

Return a JSON with recommended contest IDs and event IDs (max 3 each) and a brief reason. Format: {"contestIds": ["id1"], "eventIds": ["id1"], "reason": "brief explanation"}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a recommendation engine. Return only valid JSON without markdown formatting." },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      // Fallback on AI error
      return new Response(JSON.stringify({
        contests: activeContests?.slice(0, 3) || [],
        events: upcomingEvents?.slice(0, 3) || [],
        reason: "Trending now"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || "";
    
    let parsed;
    try {
      // Clean potential markdown formatting
      const cleanContent = content.replace(/```json\n?|\n?```/g, "").trim();
      parsed = JSON.parse(cleanContent);
    } catch {
      parsed = { contestIds: [], eventIds: [], reason: "Popular picks" };
    }

    const recommendedContests = activeContests?.filter(c => 
      parsed.contestIds?.includes(c.id)
    ) || activeContests?.slice(0, 3) || [];

    const recommendedEvents = upcomingEvents?.filter(e => 
      parsed.eventIds?.includes(e.id)
    ) || upcomingEvents?.slice(0, 3) || [];

    return new Response(JSON.stringify({
      contests: recommendedContests,
      events: recommendedEvents,
      reason: parsed.reason || "Based on your interests"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Recommendation error:", error);
    return new Response(JSON.stringify({ error: "Failed to get recommendations" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
