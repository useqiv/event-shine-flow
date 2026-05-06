import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://www.useqiv.com";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_STORAGE_PUBLIC_BASE = `${SUPABASE_URL}/storage/v1/object/public`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type"); // 'event', 'contest', 'campaign', or 'form'
    const slug = url.searchParams.get("slug");

    if (!type || !slug) {
      return new Response(
        JSON.stringify({ error: "Missing type or slug parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, supabaseKey);

    let title = "USEQIV";
    let description = "The Complete Platform for Contest Voting, Event Ticketing & Crowdfunding Success";
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
    } else if (type === "contestant") {
      // slug format: "<contestSlugOrId>/<contestantSlug>"
      const [contestKey, contestantSlug] = slug.split("/");
      const normalizedContestantSlug = normalizeSlugSegment(contestantSlug || "");
      const qpName = url.searchParams.get("name");
      const qpContest = url.searchParams.get("contest");
      const qpDescription = url.searchParams.get("description");
      const qpImage = url.searchParams.get("image");
      if (contestKey && contestantSlug) {
        pageUrl = isUuid(contestKey)
          ? `${SITE_URL}/contests/${contestKey}/contestant/${normalizedContestantSlug || contestantSlug}`
          : `${SITE_URL}/c/${contestKey}/contestant/${normalizedContestantSlug || contestantSlug}`;
      }
      // Prefer explicit metadata from share URL when present.
      // This guarantees correct OG output even if DB lookup misses.
      if (qpName && qpContest) {
        title = `Vote for ${qpName} in ${qpContest} | USEQIV`;
        description = qpDescription || `Vote and support ${qpName} on ${qpContest}`;
      }
      if (qpImage) {
        image = qpImage;
      }
      const { data: contest } = await supabase
        .from("contests")
        .select("id, title, custom_slug")
        .or(`custom_slug.eq.${contestKey},id.eq.${contestKey}`)
        .maybeSingle();

      if (contest && contestantSlug) {
        const { data: contestants } = await supabase
          .from("contestants")
          .select("id, name, bio, photo_url, vote_count")
          .eq("contest_id", contest.id);

        const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        const contestant = contestants?.find((c) => {
          const nameSlug = slugify(c.name);
          return nameSlug === normalizedContestantSlug || c.id === contestantSlug;
        });

        if (contestant) {
          title = `Vote for ${contestant.name} in ${contest.title} | USEQIV`;
          description = `Vote and support ${contestant.name} for ${contest.title}.${contestant.bio ? " " + contestant.bio : ""}`;
          image = contestant.photo_url || DEFAULT_IMAGE;
          pageUrl = contest.custom_slug
            ? `${SITE_URL}/c/${contest.custom_slug}/contestant/${contestantSlug}`
            : `${SITE_URL}/contests/${contest.id}/contestant/${contestantSlug}`;
        }
      }
    } else if (type === "campaign") {
      const { data: campaign } = await supabase
        .from("campaigns")
        .select("id, title, description, short_description, image_url, custom_slug, goal_amount, currency, current_amount")
        .or(`custom_slug.eq.${slug},id.eq.${slug}`)
        .maybeSingle();

      if (campaign) {
        title = `${campaign.title} | USEQIV Campaigns`;
        description = campaign.short_description || campaign.description || 
          `Support ${campaign.title} - Help us reach our goal of ${campaign.currency} ${Number(campaign.goal_amount).toLocaleString()}`;
        image = campaign.image_url || DEFAULT_IMAGE;
        pageUrl = campaign.custom_slug 
          ? `${SITE_URL}/campaigns/${campaign.custom_slug}` 
          : `${SITE_URL}/campaigns/${campaign.id}`;
      }
    } else if (type === "form") {
      const { data: form } = await supabase
        .from("forms")
        .select("id, title, description, custom_slug, logo_url")
        .or(`custom_slug.eq.${slug},id.eq.${slug}`)
        .maybeSingle();

      if (form) {
        title = `${form.title} | USEQIV`;
        description = form.description || `Fill out ${form.title}`;
        image = form.logo_url || DEFAULT_IMAGE;
        pageUrl = form.custom_slug 
          ? `${SITE_URL}/f/${form.custom_slug}` 
          : `${SITE_URL}/f/${form.id}`;
      }
    }

    // Ensure image is absolute URL
    image = toAbsolutePublicImageUrl(image);

    // Return JSON with OG data (for debugging) or HTML for crawlers
    const userAgent = req.headers.get("user-agent") || "";
    const isCrawler = /facebookexternalhit|Twitterbot|Xbot|WhatsApp|LinkedInBot|Slackbot|TelegramBot|Pinterest|Googlebot|Discordbot|Baiduspider|bingbot/i.test(userAgent);

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
  <meta property="og:type" content="${escapeHtml(type === "contestant" ? "profile" : "website")}">
  <meta property="og:url" content="${escapeHtml(pageUrl)}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${escapeHtml(image)}">
  <meta property="og:image:secure_url" content="${escapeHtml(image)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${escapeHtml(title)}">
  <meta property="og:site_name" content="USEQIV">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@useqiv">
  <meta name="twitter:url" content="${escapeHtml(pageUrl)}">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(image)}">
  <meta name="twitter:image:alt" content="${escapeHtml(title)}">
  
  <link rel="canonical" href="${escapeHtml(pageUrl)}">
</head>
<body>
  <p>${escapeHtml(description)}</p>
  <p><a href="${escapeHtml(pageUrl)}">${escapeHtml(pageUrl)}</a></p>
</body>
</html>`;

      return new Response(html, {
        headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // Optional JSON response for debugging only
    if (url.searchParams.get("format") === "json") {
      return new Response(
        JSON.stringify({ title, description, image, url: pageUrl }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For non-crawlers, redirect to the actual app page.
    // This allows us to share the og-meta URL while still landing users on the intended route.
    return new Response(
      null,
      {
        status: 302,
        headers: {
          ...corsHeaders,
          "Location": pageUrl,
          "Cache-Control": "no-store",
        },
      }
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

function toAbsolutePublicImageUrl(rawImage: string | null | undefined): string {
  if (!rawImage) return DEFAULT_IMAGE;
  const image = rawImage.trim();
  if (!image) return DEFAULT_IMAGE;
  if (/^https?:\/\//i.test(image)) return image;
  if (image.startsWith("/storage/v1/object/public/")) {
    return `${SUPABASE_URL}${image}`;
  }
  if (image.startsWith("storage/v1/object/public/")) {
    return `${SUPABASE_URL}/${image}`;
  }
  if (image.startsWith("/")) {
    return `${SITE_URL}${image}`;
  }
  return `${SUPABASE_STORAGE_PUBLIC_BASE}/${image}`;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function normalizeSlugSegment(value: string): string {
  return decodeURIComponent(value).trim().toLowerCase();
}
