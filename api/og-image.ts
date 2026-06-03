export const config = {
  runtime: 'edge',
};

const ALLOWED_HOSTS = ['tirqmqzgksclsjxfiham.supabase.co', 'www.useqiv.com', 'useqiv.com'];

export default async function handler(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get('url');

  if (!rawUrl) {
    return new Response('Missing url parameter', { status: 400 });
  }

  let sourceUrl: URL;
  try {
    sourceUrl = new URL(rawUrl);
  } catch {
    return new Response('Invalid url parameter', { status: 400 });
  }

  if (!ALLOWED_HOSTS.includes(sourceUrl.hostname)) {
    return new Response('Forbidden image host', { status: 403 });
  }

  const isWebp = /\.webp(\?|$)/i.test(sourceUrl.pathname);
  const fetchUrl = isWebp
    ? `https://wsrv.nl/?url=${encodeURIComponent(rawUrl)}&w=1200&h=630&fit=cover&output=jpg`
    : rawUrl;

  const imageResponse = await fetch(fetchUrl, {
    headers: { Accept: 'image/*' },
  });

  if (!imageResponse.ok) {
    return new Response('Image not found', { status: imageResponse.status });
  }

  const contentType = isWebp ? 'image/jpeg' : imageResponse.headers.get('content-type') || 'image/jpeg';

  return new Response(imageResponse.body, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
