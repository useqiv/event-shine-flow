import { buildOgData, isCrawler, parseOgRoute, renderOgHtml } from './ogMeta';

export default async function middleware(request: Request) {
  const url = new URL(request.url);
  const { pathname } = url;
  const userAgent = request.headers.get('user-agent') || '';
  const route = parseOgRoute(pathname);

  if (!route) {
    return;
  }

  if (!isCrawler(userAgent)) {
    return;
  }

  const data = await buildOgData(route.type, route.slug);
  const html = renderOgHtml(data);

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=300',
    },
  });
}

export const config = {
  matcher: [
    '/share/contest/:path*',
    '/share/contestant/:path*',
    '/share/event/:path*',
    '/share/campaign/:path*',
    '/share/form/:path*',
    '/e/:path*',
    '/c/:path*',
    '/events/:path*',
    '/contests/:path*',
    '/campaigns/:path*',
    '/f/:path*',
  ],
};
