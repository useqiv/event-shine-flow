export const config = {
  runtime: 'edge',
};

const SITE_URL = 'https://www.useqiv.com';
const SUPABASE_URL = 'https://tirqmqzgksclsjxfiham.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpcnFtcXpna3NjbHNqeGZpaGFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1NzgyMTksImV4cCI6MjA4MjE1NDIxOX0.Y96LDtj66PRezBMQgyiNZw7ppDZ1vkeMuu5qkrExuPY';

const STATIC_PAGES: Array<{ path: string; changefreq: string; priority: string }> = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/blog', changefreq: 'daily', priority: '0.9' },
  { path: '/events', changefreq: 'daily', priority: '0.9' },
  { path: '/contests', changefreq: 'daily', priority: '0.9' },
  { path: '/campaigns', changefreq: 'daily', priority: '0.9' },
  { path: '/products/events', changefreq: 'weekly', priority: '0.8' },
  { path: '/products/contests', changefreq: 'weekly', priority: '0.8' },
  { path: '/products/crowdfunding', changefreq: 'weekly', priority: '0.8' },
  { path: '/products/forms', changefreq: 'weekly', priority: '0.8' },
  { path: '/about', changefreq: 'monthly', priority: '0.7' },
  { path: '/contact', changefreq: 'monthly', priority: '0.7' },
  { path: '/features', changefreq: 'monthly', priority: '0.7' },
  { path: '/how-it-works', changefreq: 'monthly', priority: '0.7' },
  { path: '/pricing', changefreq: 'monthly', priority: '0.7' },
  { path: '/for-organizers', changefreq: 'monthly', priority: '0.7' },
  { path: '/for-participants', changefreq: 'monthly', priority: '0.7' },
  { path: '/for-influencers', changefreq: 'monthly', priority: '0.7' },
  { path: '/help', changefreq: 'weekly', priority: '0.6' },
  { path: '/privacy', changefreq: 'yearly', priority: '0.3' },
  { path: '/terms', changefreq: 'yearly', priority: '0.3' },
];

interface BlogPostRow {
  slug: string;
  updated_at: string;
  published_at: string | null;
  cover_image_url: string | null;
  title: string;
}

async function fetchPublishedBlogPosts(): Promise<BlogPostRow[]> {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/blog_posts?select=slug,updated_at,published_at,cover_image_url,title&status=eq.published&order=published_at.desc`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  );

  if (!response.ok) return [];
  return response.json();
}

function formatDate(date: string): string {
  return new Date(date).toISOString().split('T')[0];
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export default async function handler(): Promise<Response> {
  const today = formatDate(new Date().toISOString());
  const blogPosts = await fetchPublishedBlogPosts();

  const staticEntries = STATIC_PAGES.map(
    (page) => `
  <url>
    <loc>${SITE_URL}${page.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  ).join('');

  const blogEntries = blogPosts
    .map((post) => {
      const lastmod = formatDate(post.updated_at || post.published_at || today);
      const imageTag = post.cover_image_url
        ? `
    <image:image>
      <image:loc>${escapeXml(post.cover_image_url)}</image:loc>
      <image:title>${escapeXml(post.title)}</image:title>
    </image:image>`
        : '';

      return `
  <url>
    <loc>${SITE_URL}/blog/${escapeXml(post.slug)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>${imageTag}
  </url>`;
    })
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${staticEntries}${blogEntries}
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
