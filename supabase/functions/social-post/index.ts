import { createHmac } from "node:crypto";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_KEY = Deno.env.get("TWITTER_CONSUMER_KEY")?.trim();
const API_SECRET = Deno.env.get("TWITTER_CONSUMER_SECRET")?.trim();
const ACCESS_TOKEN = Deno.env.get("TWITTER_ACCESS_TOKEN")?.trim();
const ACCESS_TOKEN_SECRET = Deno.env.get("TWITTER_ACCESS_TOKEN_SECRET")?.trim();

function validateEnvironmentVariables() {
  const missing = [];
  if (!API_KEY) missing.push("TWITTER_CONSUMER_KEY");
  if (!API_SECRET) missing.push("TWITTER_CONSUMER_SECRET");
  if (!ACCESS_TOKEN) missing.push("TWITTER_ACCESS_TOKEN");
  if (!ACCESS_TOKEN_SECRET) missing.push("TWITTER_ACCESS_TOKEN_SECRET");
  
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(", ")}`);
  }
}

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
    oauth_consumer_key: API_KEY!,
    oauth_nonce: Math.random().toString(36).substring(2),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: ACCESS_TOKEN!,
    oauth_version: "1.0",
  };

  const signature = generateOAuthSignature(
    method,
    url,
    oauthParams,
    API_SECRET!,
    ACCESS_TOKEN_SECRET!
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

async function sendTweet(tweetText: string): Promise<any> {
  const url = "https://api.x.com/2/tweets";
  const method = "POST";

  const oauthHeader = generateOAuthHeader(method, url);
  console.log("Sending tweet...");

  const response = await fetch(url, {
    method: method,
    headers: {
      Authorization: oauthHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: tweetText }),
  });

  const responseText = await response.text();
  console.log("Twitter API Response:", response.status, responseText);

  if (!response.ok) {
    throw new Error(
      `Twitter API error: ${response.status} - ${responseText}`
    );
  }

  return JSON.parse(responseText);
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    validateEnvironmentVariables();

    const body = await req.json();
    const { platform, message, contestId, contestUrl } = body;

    console.log(`Social post request - Platform: ${platform}, Contest: ${contestId}`);

    if (!message) {
      throw new Error("Message is required");
    }

    if (platform === 'twitter') {
      // Truncate message to Twitter's limit
      const truncatedMessage = message.length > 280 
        ? message.substring(0, 277) + '...'
        : message;

      const result = await sendTweet(truncatedMessage);
      
      console.log("Tweet posted successfully:", result);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          platform: 'twitter',
          tweetId: result.data?.id,
          message: 'Tweet posted successfully'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    throw new Error(`Unsupported platform: ${platform}`);

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
