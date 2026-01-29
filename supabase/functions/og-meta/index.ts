import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://www.useqiv.com";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type"); // 'event' or 'contest'
    const slug = url.searchParams.get("slug");

    if (!type || !slug) {
      return new Response(
        JSON.stringify({ error: "Missing type or slug parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let title = "USEQIV";
    let description = "Vote, attend events, and support campaigns on USEQIV";
    let image = DEFAULT_IMAGE;
    let pageUrl = SITE_URL;

    if (type === "event") {
      const { data: event } = await supabase
        .from("events")
        .select("id, title, description, image_url, custom_slug, venue, event_date")
        .or(`custom_slug.eq.${slug},id.eq.${slug}`)
        .maybeSingle();

      if (event) {
        title = `${event.title} | USEQIV Events`;
        description = event.description || `Join us at ${event.title} at ${event.venue}`;
        image = event.image_url || DEFAULT_IMAGE;
        pageUrl = event.custom_slug 
          ? `${SITE_URL}/e/${event.custom_slug}` 
          : `${SITE_URL}/events/${event.id}`;
      }
    } else if (type === "contest") {
      const { data: contest } = await supabase
        .from("contests")
        .select("id, title, description, image_url, custom_slug")
        .or(`custom_slug.eq.${slug},id.eq.${slug}`)
        .maybeSingle();

      if (contest) {
        title = `${contest.title} | USEQIV`;
        description = contest.description || `Vote now in ${contest.title}`;
        image = contest.image_url || DEFAULT_IMAGE;
        pageUrl = contest.custom_slug 
          ? `${SITE_URL}/c/${contest.custom_slug}` 
          : `${SITE_URL}/contests/${contest.id}`;
      }
    }

    // Ensure image is absolute URL
    if (image && !image.startsWith("http")) {
      image = `${SITE_URL}${image}`;
    }

    // Return JSON with OG data (for debugging) or HTML for crawlers
    const userAgent = req.headers.get("user-agent") || "";
    const isCrawler = /facebookexternalhit|Twitterbot|WhatsApp|LinkedInBot|Slackbot|TelegramBot|Pinterest|Googlebot/i.test(userAgent);

    if (isCrawler) {
      // Return minimal HTML with OG tags for social media crawlers
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  
  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${escapeHtml(pageUrl)}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${escapeHtml(image)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="USEQIV">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${escapeHtml(pageUrl)}">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(image)}">
  
  <link rel="canonical" href="${escapeHtml(pageUrl)}">
  
  <!-- Redirect to actual page -->
  <meta http-equiv="refresh" content="0;url=${escapeHtml(pageUrl)}">
</head>
<body>
  <p>Redirecting to <a href="${escapeHtml(pageUrl)}">${escapeHtml(title)}</a>...</p>
</body>
</html>`;

      return new Response(html, {
        headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // For non-crawlers, return JSON
    return new Response(
      JSON.stringify({ title, description, image, url: pageUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
