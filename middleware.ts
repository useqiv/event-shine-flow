import { NextRequest, NextResponse } from 'next/server';

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

const CRAWLER_REGEX =
  /facebookexternalhit|Twitterbot|WhatsApp|LinkedInBot|Slackbot|TelegramBot|Pinterest|Googlebot|Discordbot|Baiduspider|bingbot/i;

const SUPABASE_URL = 'https://tirqmqzgksclsjxfiham.supabase.co';

export default function middleware(req: NextRequest) {
  const userAgent = req.headers.get('user-agent') || '';

  if (!CRAWLER_REGEX.test(userAgent)) {
    return NextResponse.next();
  }

  const { pathname } = req.nextUrl;
  let type: string | null = null;
  let slug: string | null = null;

  if (pathname.startsWith('/e/')) {
    type = 'event';
    slug = pathname.replace('/e/', '');
  } else if (pathname.startsWith('/events/')) {
    type = 'event';
    slug = pathname.replace('/events/', '');
  } else if (pathname.startsWith('/c/')) {
    type = 'contest';
    slug = pathname.replace('/c/', '').split('/')[0]; // handle /c/slug/contestant/...
  } else if (pathname.startsWith('/contests/')) {
    type = 'contest';
    slug = pathname.replace('/contests/', '').split('/')[0];
  } else if (pathname.startsWith('/campaigns/')) {
    type = 'campaign';
    slug = pathname.replace('/campaigns/', '');
  } else if (pathname.startsWith('/f/')) {
    type = 'form';
    slug = pathname.replace('/f/', '');
  }

  if (type && slug) {
    const ogUrl = `${SUPABASE_URL}/functions/v1/og-meta?type=${type}&slug=${encodeURIComponent(slug)}`;
    return NextResponse.rewrite(new URL(ogUrl));
  }

  return NextResponse.next();
}
