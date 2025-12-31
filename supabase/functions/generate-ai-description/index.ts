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
    const { type, title, category, venue, eventDate, additionalContext, style } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating AI description for:", type, title);

    const styleGuides = {
      professional: "Use a professional, formal tone. Be clear and informative.",
      engaging: "Use an exciting, engaging tone. Create enthusiasm and urgency.",
      casual: "Use a friendly, casual tone. Be approachable and relatable.",
      luxury: "Use an elegant, sophisticated tone. Emphasize exclusivity and quality.",
    };

    const selectedStyle = styleGuides[style as keyof typeof styleGuides] || styleGuides.engaging;

    let systemPrompt: string;
    let userPrompt: string;

    if (type === "event") {
      systemPrompt = `You are an expert event marketing copywriter. You create compelling event descriptions that drive ticket sales and attendance.

Guidelines:
- ${selectedStyle}
- Include key details naturally
- Create FOMO and excitement
- Keep it concise but impactful (150-250 words)
- Use short paragraphs for readability
- End with a call-to-action
- Do NOT include placeholders like [date] or [venue] - only use provided information
- Output only the description, no titles or labels`;

      userPrompt = `Create an engaging event description for:

Event: "${title}"
Category: ${category}
${venue ? `Venue: ${venue}` : ''}
${eventDate ? `Date: ${eventDate}` : ''}
${additionalContext ? `Additional details: ${additionalContext}` : ''}

Generate a compelling description that will make people want to attend.`;
    } else if (type === "contest") {
      systemPrompt = `You are an expert at creating viral contest descriptions. You write copy that drives participation and voting.

Guidelines:
- ${selectedStyle}
- Explain why people should vote and participate
- Create excitement around the competition
- Keep it concise but impactful (100-200 words)
- Mention that every vote counts
- End with a call-to-action to vote
- Output only the description, no titles or labels`;

      userPrompt = `Create an engaging contest description for:

Contest: "${title}"
Category: ${category}
${additionalContext ? `Additional context: ${additionalContext}` : ''}

Generate a compelling description that will encourage people to vote and participate.`;
    } else if (type === "campaign") {
      systemPrompt = `You are an expert fundraising copywriter. You create emotional, compelling campaign descriptions that drive donations.

Guidelines:
- ${selectedStyle}
- Create emotional connection with the cause
- Be transparent and trustworthy
- Keep it concise but impactful (150-250 words)
- Explain the impact of donations
- End with a call-to-action to donate
- Output only the description, no titles or labels`;

      userPrompt = `Create an engaging campaign description for:

Campaign: "${title}"
Category: ${category}
${additionalContext ? `Additional context: ${additionalContext}` : ''}

Generate a compelling description that will inspire people to donate.`;
    } else {
      throw new Error("Invalid type. Must be 'event', 'contest', or 'campaign'");
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
        max_tokens: 500,
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
    const generatedDescription = data.choices?.[0]?.message?.content?.trim();

    if (!generatedDescription) {
      throw new Error("No content generated");
    }

    console.log("Generated description length:", generatedDescription.length);

    return new Response(
      JSON.stringify({ description: generatedDescription }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-ai-description:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to generate description" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
