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

// Ticket milestones to track
const TICKET_MILESTONES = [10, 25, 50, 100, 250, 500, 1000];

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

async function createNotification(
  supabase: any,
  userId: string,
  title: string,
  message: string,
  type: string,
  referenceId?: string
) {
  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    title,
    message,
    type,
    reference_id: referenceId || null,
  });
  
  if (error) {
    console.error("Failed to create notification:", error);
  }
}

function generateLeaderboardMessage(contest: any, contestants: any[]): string {
  const top3 = contestants.slice(0, 3);
  let message = `🏆 ${contest.title} - Live Leaderboard!\n\n`;
  top3.forEach((c, i) => {
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉';
    message += `${medal} ${c.name}: ${c.vote_count.toLocaleString()} votes\n`;
  });
  message += `\n🗳️ Vote now!`;
  return message;
}

function generateEventMessage(event: any, postType: string): string {
  const eventDate = new Date(event.event_date);
  const now = new Date();
  const daysUntil = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  switch (postType) {
    case 'event_countdown':
      if (daysUntil <= 0) {
        return `🎉 ${event.title} is happening TODAY!\n\n📍 ${event.venue}\n\n🎟️ Get your tickets now!`;
      }
      return `⏰ Only ${daysUntil} day${daysUntil === 1 ? '' : 's'} until ${event.title}!\n\n📍 ${event.venue}\n📅 ${eventDate.toLocaleDateString()}\n\n🎟️ Get your tickets before they sell out!`;
    
    case 'tickets_selling':
      return `🔥 Tickets are selling fast for ${event.title}!\n\n📍 ${event.venue}\n📅 ${eventDate.toLocaleDateString()}\n\n🎟️ Don't miss out - grab yours now!`;
    
    case 'event_reminder':
      return `📢 Reminder: ${event.title} is coming up!\n\n📍 ${event.venue}\n📅 ${eventDate.toLocaleDateString()}\n\n🎟️ Have you got your tickets yet?`;
    
    case 'event_announcement':
    default:
      return `🎉 Join us for ${event.title}!\n\n📍 ${event.venue}\n📅 ${eventDate.toLocaleDateString()}\n\n🎟️ Get your tickets now!`;
  }
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

async function checkTicketMilestones(supabase: any) {
  console.log("Checking ticket milestones...");
  
  // Get all active events with their ticket types and total sold
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select(`
      id,
      title,
      organization_id,
      ticket_types (
        quantity_sold
      )
    `)
    .eq('is_active', true);

  if (eventsError) {
    console.error("Error fetching events for milestones:", eventsError);
    return;
  }

  for (const event of events || []) {
    const totalSold = event.ticket_types?.reduce((sum: number, tt: any) => sum + (tt.quantity_sold || 0), 0) || 0;
    
    // Check if we've crossed a milestone
    for (const milestone of TICKET_MILESTONES) {
      if (totalSold >= milestone) {
        // Check if we've already notified about this milestone
        const { data: existingNotif } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', event.organization_id)
          .eq('type', 'ticket_milestone')
          .eq('reference_id', event.id)
          .ilike('title', `%${milestone} tickets%`)
          .limit(1);

        if (!existingNotif?.length) {
          await createNotification(
            supabase,
            event.organization_id,
            `🎉 ${milestone} Tickets Sold!`,
            `Congratulations! "${event.title}" has reached ${milestone} tickets sold!`,
            'ticket_milestone',
            event.id
          );
          console.log(`Created milestone notification for event ${event.id}: ${milestone} tickets`);
          break; // Only notify for highest reached milestone that hasn't been notified
        }
      }
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    console.log("Starting scheduled social post check...");
    const now = new Date().toISOString();
    const results = [];

    // Check ticket milestones
    await checkTicketMilestones(supabase);

    // Process contest auto-posts
    const { data: contestPosts, error: contestFetchError } = await supabase
      .from('contest_auto_posts')
      .select(`
        *,
        contests (
          id,
          title,
          custom_slug,
          is_active,
          end_date,
          organization_id
        )
      `)
      .eq('is_active', true)
      .lte('next_post_at', now);

    if (contestFetchError) {
      console.error("Error fetching contest auto posts:", contestFetchError);
    }

    console.log(`Found ${contestPosts?.length || 0} contest posts due for publishing`);

    for (const autoPost of contestPosts || []) {
      try {
        const contest = autoPost.contests;
        
        if (!contest || !contest.is_active || new Date(contest.end_date) < new Date()) {
          console.log(`Skipping post for inactive/ended contest: ${contest?.id}`);
          continue;
        }

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

        let message = autoPost.custom_message;
        if (!message || autoPost.post_type === 'leaderboard') {
          message = generateLeaderboardMessage(contest, contestants);
        }

        let postResult;
        if (autoPost.platform === 'twitter') {
          postResult = await sendTweet(message);
          console.log(`Tweet posted for contest ${contest.id}:`, postResult);
        } else {
          console.log(`Unsupported platform: ${autoPost.platform}`);
          continue;
        }

        const nextPostAt = calculateNextPostTime(autoPost.schedule_interval);
        await supabase
          .from('contest_auto_posts')
          .update({
            last_posted_at: now,
            next_post_at: nextPostAt.toISOString(),
          })
          .eq('id', autoPost.id);

        results.push({
          type: 'contest',
          autoPostId: autoPost.id,
          itemId: contest.id,
          platform: autoPost.platform,
          success: true,
        });

      } catch (postError: any) {
        console.error(`Error posting for contest auto-post ${autoPost.id}:`, postError);
        
        // Create failure notification for the organization
        if (autoPost.organization_id) {
          await createNotification(
            supabase,
            autoPost.organization_id,
            '⚠️ Auto-Post Failed',
            `Failed to post to ${autoPost.platform} for contest "${autoPost.contests?.title || 'Unknown'}": ${postError.message}`,
            'auto_post_failure',
            autoPost.contest_id
          );
        }
        
        results.push({
          type: 'contest',
          autoPostId: autoPost.id,
          itemId: autoPost.contest_id,
          platform: autoPost.platform,
          success: false,
          error: postError.message,
        });
      }
    }

    // Process event auto-posts
    const { data: eventPosts, error: eventFetchError } = await supabase
      .from('event_auto_posts')
      .select(`
        *,
        events (
          id,
          title,
          venue,
          event_date,
          is_active
        )
      `)
      .eq('is_active', true)
      .lte('next_post_at', now);

    if (eventFetchError) {
      console.error("Error fetching event auto posts:", eventFetchError);
    }

    console.log(`Found ${eventPosts?.length || 0} event posts due for publishing`);

    for (const autoPost of eventPosts || []) {
      try {
        const event = autoPost.events;
        
        if (!event || !event.is_active || new Date(event.event_date) < new Date()) {
          console.log(`Skipping post for inactive/past event: ${event?.id}`);
          continue;
        }

        let message = autoPost.custom_message;
        if (!message) {
          message = generateEventMessage(event, autoPost.post_type);
        }

        let postResult;
        if (autoPost.platform === 'twitter') {
          postResult = await sendTweet(message);
          console.log(`Tweet posted for event ${event.id}:`, postResult);
        } else {
          console.log(`Unsupported platform: ${autoPost.platform}`);
          continue;
        }

        const nextPostAt = calculateNextPostTime(autoPost.schedule_interval);
        await supabase
          .from('event_auto_posts')
          .update({
            last_posted_at: now,
            next_post_at: nextPostAt.toISOString(),
          })
          .eq('id', autoPost.id);

        results.push({
          type: 'event',
          autoPostId: autoPost.id,
          itemId: event.id,
          platform: autoPost.platform,
          success: true,
        });

      } catch (postError: any) {
        console.error(`Error posting for event auto-post ${autoPost.id}:`, postError);
        
        // Create failure notification for the organization
        if (autoPost.organization_id) {
          await createNotification(
            supabase,
            autoPost.organization_id,
            '⚠️ Auto-Post Failed',
            `Failed to post to ${autoPost.platform} for event "${autoPost.events?.title || 'Unknown'}": ${postError.message}`,
            'auto_post_failure',
            autoPost.event_id
          );
        }
        
        results.push({
          type: 'event',
          autoPostId: autoPost.id,
          itemId: autoPost.event_id,
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
