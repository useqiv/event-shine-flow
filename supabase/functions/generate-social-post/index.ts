import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contentType, contestTitle, contestants, eventTitle, eventDate, venue, postType, platform, customContext } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const isEvent = contentType === 'event';
    console.log("Generating AI social post for:", isEvent ? eventTitle : contestTitle, "Type:", postType, "Platform:", platform);

    // Build the prompt based on post type and data
    let contestantInfo = "";
    if (!isEvent && contestants && contestants.length > 0) {
      const top5 = contestants.slice(0, 5);
      contestantInfo = top5.map((c: any, i: number) => 
        `${i + 1}. ${c.name}: ${c.vote_count.toLocaleString()} votes`
      ).join("\n");
    }

    const platformGuidelines = {
      twitter: "Max 280 characters. Use hashtags sparingly (2-3 max). Be punchy and engaging.",
      facebook: "Can be longer, up to 500 characters. More conversational tone. Include call-to-action.",
      instagram: "Focus on emotion and visuals. Can include more hashtags (5-10). Keep caption engaging.",
    };

    const contestPostTypePrompts = {
      leaderboard: `Create an exciting leaderboard update post announcing the current standings in a voting contest.`,
      contestant: `Create a spotlight post featuring and celebrating a contestant in a voting contest.`,
      countdown: `Create an urgent countdown post reminding people voting is ending soon.`,
      announcement: `Create an announcement post about this voting contest.`,
      engagement: `Create an engagement-focused post asking people to vote and participate.`,
    };

    const eventPostTypePrompts = {
      event_announcement: `Create an exciting announcement post about an upcoming event.`,
      event_countdown: `Create an urgent countdown post building excitement for the event.`,
      tickets_selling: `Create a post about tickets selling fast with urgency to buy now.`,
      event_reminder: `Create a reminder post for people to attend the upcoming event.`,
      event_live: `Create an exciting post announcing the event is now live/happening.`,
    };

    const systemPrompt = isEvent 
      ? `You are an expert social media manager specializing in viral content for events and entertainment. You create engaging, exciting posts that drive ticket sales and attendance.

Guidelines:
- Use emojis strategically for visual appeal
- Create excitement and FOMO
- Include clear call-to-action to get tickets
- ${platformGuidelines[platform as keyof typeof platformGuidelines] || platformGuidelines.twitter}
- Never use placeholders like [link] - the user will add the link
- Be authentic and avoid overly promotional language
- Generate ONLY the post text, no explanations`
      : `You are an expert social media manager specializing in viral content for voting contests and competitions. You create engaging, exciting posts that drive participation and voting.

Guidelines:
- Use emojis strategically for visual appeal
- Create urgency and excitement
- Include clear call-to-action to vote
- ${platformGuidelines[platform as keyof typeof platformGuidelines] || platformGuidelines.twitter}
- Never use placeholders like [link] - the user will add the link
- Be authentic and avoid overly promotional language
- Generate ONLY the post text, no explanations`;

    let userPrompt;
    if (isEvent) {
      const eventPrompt = eventPostTypePrompts[postType as keyof typeof eventPostTypePrompts] || eventPostTypePrompts.event_announcement;
      userPrompt = `${eventPrompt}

Event: "${eventTitle}"
Date: ${eventDate}
Venue: ${venue}
Platform: ${platform}
${customContext ? `Additional context: ${customContext}` : ''}

Generate an engaging social media post for this event. Output ONLY the post text.`;
    } else {
      const contestPrompt = contestPostTypePrompts[postType as keyof typeof contestPostTypePrompts] || contestPostTypePrompts.leaderboard;
      userPrompt = `${contestPrompt}

Contest: "${contestTitle}"
Platform: ${platform}
${contestantInfo ? `Current Standings:\n${contestantInfo}` : ''}
${customContext ? `Additional context: ${customContext}` : ''}

Generate an engaging social media post for this contest. Output ONLY the post text.`;
    }

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
          { role: "user", content: userPrompt },
        ],
        max_tokens: 300,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const generatedPost = data.choices?.[0]?.message?.content?.trim();

    if (!generatedPost) {
      throw new Error("No content generated");
    }

    console.log("Generated post:", generatedPost);

    return new Response(
      JSON.stringify({ post: generatedPost }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-social-post:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to generate post" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
