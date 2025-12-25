import { createHmac } from "node:crypto";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Twitter credentials
const TWITTER_API_KEY = Deno.env.get("TWITTER_CONSUMER_KEY")?.trim();
const TWITTER_API_SECRET = Deno.env.get("TWITTER_CONSUMER_SECRET")?.trim();
const TWITTER_ACCESS_TOKEN = Deno.env.get("TWITTER_ACCESS_TOKEN")?.trim();
const TWITTER_ACCESS_TOKEN_SECRET = Deno.env.get("TWITTER_ACCESS_TOKEN_SECRET")?.trim();

function generateOAuthSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerSecret: string,
  tokenSecret: string
): string {
  const signatureBaseString = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(
    Object.entries(params).sort().map(([k, v]) => `${k}=${v}`).join("&")
  )}`;
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;
  const hmacSha1 = createHmac("sha1", signingKey);
  return hmacSha1.update(signatureBaseString).digest("base64");
}

function generateOAuthHeader(method: string, url: string): string {
  if (!TWITTER_API_KEY || !TWITTER_API_SECRET || !TWITTER_ACCESS_TOKEN || !TWITTER_ACCESS_TOKEN_SECRET) {
    throw new Error("Twitter credentials not configured");
  }

  const oauthParams = {
    oauth_consumer_key: TWITTER_API_KEY,
    oauth_nonce: Math.random().toString(36).substring(2),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: TWITTER_ACCESS_TOKEN,
    oauth_version: "1.0",
  };

  const signature = generateOAuthSignature(method, url, oauthParams, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN_SECRET);
  const signedOAuthParams = { ...oauthParams, oauth_signature: signature };

  return "OAuth " + Object.entries(signedOAuthParams)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v)}"`)
    .join(", ");
}

async function sendTweet(message: string): Promise<any> {
  const url = "https://api.x.com/2/tweets";
  const oauthHeader = generateOAuthHeader("POST", url);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: oauthHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: message.substring(0, 280) }),
  });

  const responseText = await response.text();
  if (!response.ok) {
    throw new Error(`Twitter API error: ${response.status} - ${responseText}`);
  }
  return JSON.parse(responseText);
}

function generateLeaderboardMessage(contest: any, contestants: any[]): string {
  const top3 = contestants.slice(0, 3);
  let message = `🏆 ${contest.title} - Live Leaderboard!\n\n`;
  top3.forEach((c, i) => {
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉';
    message += `${medal} ${c.name}: ${c.vote_count.toLocaleString()} votes\n`;
  });
  const contestUrl = contest.custom_slug 
    ? `https://your-domain.com/c/${contest.custom_slug}`
    : `https://your-domain.com/contests/${contest.id}`;
  message += `\n🗳️ Vote now!`;
  return message;
}

function calculateNextPostTime(interval: string): Date {
  const now = new Date();
  switch (interval) {
    case 'hourly':
      return new Date(now.getTime() + 60 * 60 * 1000);
    case 'daily':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case 'twice_daily':
      return new Date(now.getTime() + 12 * 60 * 60 * 1000);
    case 'weekly':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    console.log("Starting scheduled social post check...");

    // Find all auto-posts that are due
    const now = new Date().toISOString();
    const { data: duePosts, error: fetchError } = await supabase
      .from('contest_auto_posts')
      .select(`
        *,
        contests (
          id,
          title,
          custom_slug,
          is_active,
          end_date
        )
      `)
      .eq('is_active', true)
      .lte('next_post_at', now);

    if (fetchError) {
      console.error("Error fetching due posts:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${duePosts?.length || 0} posts due for publishing`);

    const results = [];

    for (const autoPost of duePosts || []) {
      try {
        const contest = autoPost.contests;
        
        // Skip if contest is not active or has ended
        if (!contest || !contest.is_active || new Date(contest.end_date) < new Date()) {
          console.log(`Skipping post for inactive/ended contest: ${contest?.id}`);
          continue;
        }

        // Fetch top contestants
        const { data: contestants, error: contestantsError } = await supabase
          .from('contestants')
          .select('id, name, vote_count')
          .eq('contest_id', contest.id)
          .order('vote_count', { ascending: false })
          .limit(10);

        if (contestantsError || !contestants?.length) {
          console.log(`No contestants found for contest: ${contest.id}`);
          continue;
        }

        // Generate message based on post type
        let message = autoPost.custom_message;
        if (!message || autoPost.post_type === 'leaderboard') {
          message = generateLeaderboardMessage(contest, contestants);
        }

        // Post based on platform
        let postResult;
        if (autoPost.platform === 'twitter') {
          postResult = await sendTweet(message);
          console.log(`Tweet posted for contest ${contest.id}:`, postResult);
        } else {
          console.log(`Unsupported platform: ${autoPost.platform}`);
          continue;
        }

        // Update the auto-post record
        const nextPostAt = calculateNextPostTime(autoPost.schedule_interval);
        await supabase
          .from('contest_auto_posts')
          .update({
            last_posted_at: now,
            next_post_at: nextPostAt.toISOString(),
          })
          .eq('id', autoPost.id);

        results.push({
          autoPostId: autoPost.id,
          contestId: contest.id,
          platform: autoPost.platform,
          success: true,
        });

      } catch (postError: any) {
        console.error(`Error posting for auto-post ${autoPost.id}:`, postError);
        results.push({
          autoPostId: autoPost.id,
          contestId: autoPost.contest_id,
          platform: autoPost.platform,
          success: false,
          error: postError.message,
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: results.length,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error("Scheduled social post error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
