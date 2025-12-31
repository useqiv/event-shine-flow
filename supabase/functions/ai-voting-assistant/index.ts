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

    // Fetch active contests, events, and contestants for context
    const [contestsResult, eventsResult, contestantsResult, campaignsResult] = await Promise.all([
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
      supabase
        .from("contestants")
        .select("id, name, bio, vote_count, contest_id, contests(title, category)")
        .order("vote_count", { ascending: false })
        .limit(20),
      supabase
        .from("campaigns")
        .select("id, title, category, current_amount, goal_amount, donor_count, short_description")
        .eq("status", "active")
        .limit(10),
    ]);

    const activeContests = contestsResult.data || [];
    const upcomingEvents = eventsResult.data || [];
    const topContestants = contestantsResult.data || [];
    const activeCampaigns = campaignsResult.data || [];

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

    const contestantContext = topContestants.length > 0
      ? `Top Contestants by Votes:\n${topContestants.map(c => {
          const contestInfo = c.contests as any;
          return `- "${c.name}" in "${contestInfo?.title || 'Unknown Contest'}" (${contestInfo?.category || 'General'}) - ${c.vote_count} votes${c.bio ? `. Bio: ${c.bio.substring(0, 100)}` : ''}`;
        }).join("\n")}`
      : "No contestants available.";

    const campaignContext = activeCampaigns.length > 0
      ? `Active Campaigns:\n${activeCampaigns.map(c => {
          const progress = c.goal_amount > 0 ? Math.round((c.current_amount / c.goal_amount) * 100) : 0;
          return `- "${c.title}" (${c.category}) - ${progress}% funded, ${c.donor_count} donors. ${c.short_description || ''}`;
        }).join("\n")}`
      : "No active campaigns at the moment.";

    const systemPrompt = `You are VoteBot, a friendly AI assistant for a voting, events, and crowdfunding platform. You help users:
- Discover contestants based on their preferences (category, style, personality)
- Find active contests and vote for their favorite contestants
- Find upcoming events and buy tickets
- Discover campaigns they might want to support
- Understand how voting works (paid voting system with wallet balance)
- Learn about features like referral bonuses and promo codes

Current Platform Data:
${contestContext}

${eventContext}

${contestantContext}

${campaignContext}

CONTESTANT DISCOVERY CAPABILITIES:
When users ask for help choosing who to vote for or want recommendations, you can:
- Suggest contestants based on their stated preferences (e.g., "I like music" → suggest music contest contestants)
- Recommend trending contestants with high vote counts
- Match user interests to specific categories
- Provide info about contestant bios when available

Guidelines:
- Be enthusiastic and helpful
- When recommending contests, events, or contestants, mention specific ones from the data above
- If a user says they like a category (e.g., "music", "fashion"), recommend contestants in that category
- Explain that voting requires wallet balance and each vote costs the specified amount
- Encourage users to check out the dashboard for more details
- Keep responses concise but informative (max 200 words)
- If users want to vote or buy tickets, guide them to the specific contest/event pages
- When suggesting contestants, briefly explain why they might like them based on the bio or category`;

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
