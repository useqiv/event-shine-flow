const CRAWLER_REGEX =
  /facebookexternalhit|Twitterbot|Xbot|WhatsApp|LinkedInBot|Slackbot|TelegramBot|Pinterest|Googlebot|Discordbot|Baiduspider|bingbot/i;

const SUPABASE_URL = 'https://tirqmqzgksclsjxfiham.supabase.co';

export default function middleware(request: Request) {
  const userAgent = request.headers.get('user-agent') || '';

  if (!CRAWLER_REGEX.test(userAgent)) {
    return;
  }

  const url = new URL(request.url);
  const { pathname } = url;
  let type: string | null = null;
  let slug: string | null = null;

  if (pathname.startsWith('/e/')) {
    type = 'event';
    slug = pathname.replace('/e/', '');
  } else if (pathname.startsWith('/events/')) {
    type = 'event';
    slug = pathname.replace('/events/', '');
  } else if (pathname.startsWith('/c/')) {
    const rest = pathname.replace('/c/', '');
    const parts = rest.split('/');
    if (parts[1] === 'contestant' && parts[2]) {
      type = 'contestant';
      slug = `${parts[0]}/${parts[2]}`;
    } else {
      type = 'contest';
      slug = parts[0];
    }
  } else if (pathname.startsWith('/contests/')) {
    const rest = pathname.replace('/contests/', '');
    const parts = rest.split('/');
    if (parts[1] === 'contestant' && parts[2]) {
      type = 'contestant';
      slug = `${parts[0]}/${parts[2]}`;
    } else {
      type = 'contest';
      slug = parts[0];
    }
  } else if (pathname.startsWith('/campaigns/')) {
    type = 'campaign';
    slug = pathname.replace('/campaigns/', '');
  } else if (pathname.startsWith('/f/')) {
    type = 'form';
    slug = pathname.replace('/f/', '');
  }

  if (type && slug) {
    const ogUrl = `${SUPABASE_URL}/functions/v1/og-meta?type=${type}&slug=${encodeURIComponent(slug)}`;
    return fetch(ogUrl, {
      headers: { 'user-agent': userAgent },
    });
  }
}

export const config = {
  matcher: [
    '/e/:path*',
    '/c/:path*',
    '/events/:path*',
    '/contests/:path*',
    '/campaigns/:path*',
    '/f/:path*',
  ],
};
