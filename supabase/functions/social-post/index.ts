import { createHmac } from "node:crypto";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Twitter credentials
const TWITTER_API_KEY = Deno.env.get("TWITTER_CONSUMER_KEY")?.trim();
const TWITTER_API_SECRET = Deno.env.get("TWITTER_CONSUMER_SECRET")?.trim();
const TWITTER_ACCESS_TOKEN = Deno.env.get("TWITTER_ACCESS_TOKEN")?.trim();
const TWITTER_ACCESS_TOKEN_SECRET = Deno.env.get("TWITTER_ACCESS_TOKEN_SECRET")?.trim();

// Facebook credentials
const FACEBOOK_ACCESS_TOKEN = Deno.env.get("FACEBOOK_ACCESS_TOKEN")?.trim();
const FACEBOOK_PAGE_ID = Deno.env.get("FACEBOOK_PAGE_ID")?.trim();

// Instagram credentials (via Meta Graph API)
const INSTAGRAM_ACCESS_TOKEN = Deno.env.get("INSTAGRAM_ACCESS_TOKEN")?.trim();
const INSTAGRAM_BUSINESS_ID = Deno.env.get("INSTAGRAM_BUSINESS_ID")?.trim();

// TikTok credentials
const TIKTOK_ACCESS_TOKEN = Deno.env.get("TIKTOK_ACCESS_TOKEN")?.trim();

function validateTwitterCredentials() {
  const missing = [];
  if (!TWITTER_API_KEY) missing.push("TWITTER_CONSUMER_KEY");
  if (!TWITTER_API_SECRET) missing.push("TWITTER_CONSUMER_SECRET");
  if (!TWITTER_ACCESS_TOKEN) missing.push("TWITTER_ACCESS_TOKEN");
  if (!TWITTER_ACCESS_TOKEN_SECRET) missing.push("TWITTER_ACCESS_TOKEN_SECRET");
  
  if (missing.length > 0) {
    throw new Error(`Missing Twitter credentials: ${missing.join(", ")}`);
  }
}

function validateFacebookCredentials() {
  const missing = [];
  if (!FACEBOOK_ACCESS_TOKEN) missing.push("FACEBOOK_ACCESS_TOKEN");
  if (!FACEBOOK_PAGE_ID) missing.push("FACEBOOK_PAGE_ID");
  
  if (missing.length > 0) {
    throw new Error(`Missing Facebook credentials: ${missing.join(", ")}`);
  }
}

function validateInstagramCredentials() {
  const missing = [];
  if (!INSTAGRAM_ACCESS_TOKEN) missing.push("INSTAGRAM_ACCESS_TOKEN");
  if (!INSTAGRAM_BUSINESS_ID) missing.push("INSTAGRAM_BUSINESS_ID");
  
  if (missing.length > 0) {
    throw new Error(`Missing Instagram credentials: ${missing.join(", ")}`);
  }
}

function validateTikTokCredentials() {
  if (!TIKTOK_ACCESS_TOKEN) {
    throw new Error("Missing TikTok credentials: TIKTOK_ACCESS_TOKEN");
  }
}

// Twitter OAuth 1.0a implementation
function generateOAuthSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerSecret: string,
  tokenSecret: string
): string {
  const signatureBaseString = `${method}&${encodeURIComponent(
    url
  )}&${encodeURIComponent(
    Object.entries(params)
      .sort()
      .map(([k, v]) => `${k}=${v}`)
      .join("&")
  )}`;
  const signingKey = `${encodeURIComponent(
    consumerSecret
  )}&${encodeURIComponent(tokenSecret)}`;
  const hmacSha1 = createHmac("sha1", signingKey);
  const signature = hmacSha1.update(signatureBaseString).digest("base64");

  console.log("OAuth signature generated successfully");
  return signature;
}

function generateOAuthHeader(method: string, url: string): string {
  const oauthParams = {
    oauth_consumer_key: TWITTER_API_KEY!,
    oauth_nonce: Math.random().toString(36).substring(2),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: TWITTER_ACCESS_TOKEN!,
    oauth_version: "1.0",
  };

  const signature = generateOAuthSignature(
    method,
    url,
    oauthParams,
    TWITTER_API_SECRET!,
    TWITTER_ACCESS_TOKEN_SECRET!
  );

  const signedOAuthParams = {
    ...oauthParams,
    oauth_signature: signature,
  };

  const entries = Object.entries(signedOAuthParams).sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  return (
    "OAuth " +
    entries
      .map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v)}"`)
      .join(", ")
  );
}

async function postToTwitter(message: string): Promise<any> {
  validateTwitterCredentials();
  
  const url = "https://api.x.com/2/tweets";
  const method = "POST";

  // Truncate message to Twitter's limit
  const truncatedMessage = message.length > 280 
    ? message.substring(0, 277) + '...'
    : message;

  const oauthHeader = generateOAuthHeader(method, url);
  console.log("Sending tweet...");

  const response = await fetch(url, {
    method: method,
    headers: {
      Authorization: oauthHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: truncatedMessage }),
  });

  const responseText = await response.text();
  console.log("Twitter API Response:", response.status, responseText);

  if (!response.ok) {
    throw new Error(
      `Twitter API error: ${response.status} - ${responseText}`
    );
  }

  const result = JSON.parse(responseText);
  return {
    success: true,
    platform: 'twitter',
    postId: result.data?.id,
    message: 'Tweet posted successfully'
  };
}

async function postToFacebook(message: string): Promise<any> {
  validateFacebookCredentials();
  
  const url = `https://graph.facebook.com/v18.0/${FACEBOOK_PAGE_ID}/feed`;
  console.log("Posting to Facebook...");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: message,
      access_token: FACEBOOK_ACCESS_TOKEN
    }),
  });

  const responseText = await response.text();
  console.log("Facebook API Response:", response.status, responseText);

  if (!response.ok) {
    throw new Error(
      `Facebook API error: ${response.status} - ${responseText}`
    );
  }

  const result = JSON.parse(responseText);
  return {
    success: true,
    platform: 'facebook',
    postId: result.id,
    message: 'Posted to Facebook successfully'
  };
}

async function postToInstagram(message: string, imageUrl?: string): Promise<any> {
  validateInstagramCredentials();
  
  // Instagram requires an image for feed posts
  // For text-only, we'll create a simple text image or use a placeholder
  if (!imageUrl) {
    throw new Error("Instagram requires an image URL for posts. Please provide an image.");
  }

  // Step 1: Create media container
  const createUrl = `https://graph.facebook.com/v18.0/${INSTAGRAM_BUSINESS_ID}/media`;
  console.log("Creating Instagram media container...");

  const createResponse = await fetch(createUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image_url: imageUrl,
      caption: message,
      access_token: INSTAGRAM_ACCESS_TOKEN
    }),
  });

  const createText = await createResponse.text();
  console.log("Instagram Create Response:", createResponse.status, createText);

  if (!createResponse.ok) {
    throw new Error(
      `Instagram API error: ${createResponse.status} - ${createText}`
    );
  }

  const createResult = JSON.parse(createText);
  const creationId = createResult.id;

  // Step 2: Publish the media
  const publishUrl = `https://graph.facebook.com/v18.0/${INSTAGRAM_BUSINESS_ID}/media_publish`;
  console.log("Publishing Instagram media...");

  const publishResponse = await fetch(publishUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      creation_id: creationId,
      access_token: INSTAGRAM_ACCESS_TOKEN
    }),
  });

  const publishText = await publishResponse.text();
  console.log("Instagram Publish Response:", publishResponse.status, publishText);

  if (!publishResponse.ok) {
    throw new Error(
      `Instagram API error: ${publishResponse.status} - ${publishText}`
    );
  }

  const publishResult = JSON.parse(publishText);
  return {
    success: true,
    platform: 'instagram',
    postId: publishResult.id,
    message: 'Posted to Instagram successfully'
  };
}

async function postToTikTok(message: string): Promise<any> {
  validateTikTokCredentials();
  
  // TikTok's Content Posting API requires video content
  // Text-only posts are not supported via API
  throw new Error("TikTok API currently only supports video uploads. Text-only posts are not available via API. Please use TikTok's Content Posting API with video content.");
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { platform, message, contestId, contestUrl, imageUrl, isTest } = body;

    console.log(`Social post request - Platform: ${platform}, Contest: ${contestId}, IsTest: ${isTest}`);

    if (!message) {
      throw new Error("Message is required");
    }

    let result;

    switch (platform) {
      case 'twitter':
        result = await postToTwitter(message);
        break;
      case 'facebook':
        result = await postToFacebook(message);
        break;
      case 'instagram':
        result = await postToInstagram(message, imageUrl);
        break;
      case 'tiktok':
        result = await postToTikTok(message);
        break;
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }

    console.log("Post successful:", result);
    
    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error("Social post error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
