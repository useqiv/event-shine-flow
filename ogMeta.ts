const SITE_URL = 'https://www.useqiv.com';
const SUPABASE_URL = 'https://tirqmqzgksclsjxfiham.supabase.co';
const SUPABASE_STORAGE_PUBLIC_BASE = `${SUPABASE_URL}/storage/v1/object/public`;
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpcnFtcXpna3NjbHNqeGZpaGFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1NzgyMTksImV4cCI6MjA4MjE1NDIxOX0.Y96LDtj66PRezBMQgyiNZw7ppDZ1vkeMuu5qkrExuPY';

const CRAWLER_REGEX =
  /facebookexternalhit|Twitterbot|Xbot|WhatsApp|LinkedInBot|Slackbot|TelegramBot|Pinterest|Googlebot|Discordbot|Baiduspider|bingbot/i;

export interface OgData {
  title: string;
  description: string;
  image: string;
  pageUrl: string;
  type: 'website' | 'profile' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  bodyText?: string;
  jsonLd?: object | object[];
}

export function isCrawler(userAgent: string): boolean {
  return CRAWLER_REGEX.test(userAgent);
}

export function parseOgRoute(pathname: string): { type: string; slug: string } | null {
  if (pathname.startsWith('/share/contest/')) {
    const slug = pathname.replace('/share/contest/', '').split('/')[0];
    return slug ? { type: 'contest', slug: decodeURIComponent(slug) } : null;
  }

  if (pathname.startsWith('/share/event/')) {
    const slug = pathname.replace('/share/event/', '').split('/')[0];
    return slug ? { type: 'event', slug: decodeURIComponent(slug) } : null;
  }

  if (pathname.startsWith('/share/campaign/')) {
    const slug = pathname.replace('/share/campaign/', '').split('/')[0];
    return slug ? { type: 'campaign', slug: decodeURIComponent(slug) } : null;
  }

  if (pathname.startsWith('/share/form/')) {
    const slug = pathname.replace('/share/form/', '').split('/')[0];
    return slug ? { type: 'form', slug: decodeURIComponent(slug) } : null;
  }

  if (pathname.startsWith('/share/contestant/')) {
    const rest = pathname.replace('/share/contestant/', '');
    const parts = rest.split('/').filter(Boolean);
    if (parts.length >= 2) {
      return {
        type: 'contestant',
        slug: `${decodeURIComponent(parts[0])}/${decodeURIComponent(parts.slice(1).join('/'))}`,
      };
    }
    return null;
  }

  if (pathname.startsWith('/e/')) {
    const slug = pathname.replace('/e/', '').split('/')[0];
    return slug ? { type: 'event', slug: decodeURIComponent(slug) } : null;
  }

  if (pathname.startsWith('/events/')) {
    const slug = pathname.replace('/events/', '').split('/')[0];
    return slug ? { type: 'event', slug: decodeURIComponent(slug) } : null;
  }

  if (pathname.startsWith('/c/')) {
    const rest = pathname.replace('/c/', '');
    const parts = rest.split('/').filter(Boolean);
    if (parts[1] === 'contestant' && parts[2]) {
      return { type: 'contestant', slug: `${decodeURIComponent(parts[0])}/${decodeURIComponent(parts[2])}` };
    }
    return parts[0] ? { type: 'contest', slug: decodeURIComponent(parts[0]) } : null;
  }

  if (pathname.startsWith('/contests/')) {
    const rest = pathname.replace('/contests/', '');
    const parts = rest.split('/').filter(Boolean);
    if (parts[1] === 'contestant' && parts[2]) {
      return { type: 'contestant', slug: `${decodeURIComponent(parts[0])}/${decodeURIComponent(parts[2])}` };
    }
    return parts[0] ? { type: 'contest', slug: decodeURIComponent(parts[0]) } : null;
  }

  if (pathname.startsWith('/campaigns/')) {
    const slug = pathname.replace('/campaigns/', '').split('/')[0];
    return slug ? { type: 'campaign', slug: decodeURIComponent(slug) } : null;
  }

  if (pathname.startsWith('/f/')) {
    const slug = pathname.replace('/f/', '').split('/')[0];
    return slug ? { type: 'form', slug: decodeURIComponent(slug) } : null;
  }

  if (pathname === '/blog') {
    return { type: 'blog', slug: '' };
  }

  if (pathname.startsWith('/blog/')) {
    const slug = pathname.replace('/blog/', '').split('/')[0];
    return slug ? { type: 'blog-post', slug: decodeURIComponent(slug) } : { type: 'blog', slug: '' };
  }

  return null;
}

async function supabaseRest<T>(path: string): Promise<T[]> {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });

  if (!response.ok) {
    return [];
  }

  return response.json() as Promise<T[]>;
}

async function findBySlugOrId<T extends Record<string, unknown>>(
  table: string,
  select: string,
  slug: string
): Promise<T | null> {
  const filter = isUuid(slug) ? `id=eq.${slug}` : `custom_slug=eq.${encodeURIComponent(slug)}`;
  const rows = await supabaseRest<T>(`${table}?select=${select}&${filter}&limit=1`);
  return rows[0] ?? null;
}

export async function buildOgData(type: string, slug: string): Promise<OgData> {
  let title = 'USEQIV';
  let description =
    'The Complete Platform for Contest Voting, Event Ticketing & Crowdfunding Success';
  let image = '';
  let pageUrl = SITE_URL;
  let ogType: OgData['type'] = 'website';

  if (type === 'event') {
    const event = await findBySlugOrId<{
      id: string;
      title: string;
      description: string | null;
      image_url: string | null;
      custom_slug: string | null;
      venue: string | null;
    }>('events', 'id,title,description,image_url,custom_slug,venue', slug);

    if (event) {
      title = `${event.title} | USEQIV Events`;
      description = event.description || `Join us at ${event.title} at ${event.venue ?? ''}`.trim();
      image = event.image_url || '';
      pageUrl = event.custom_slug ? `${SITE_URL}/e/${event.custom_slug}` : `${SITE_URL}/events/${event.id}`;
    }
  } else if (type === 'contest') {
    pageUrl = isUuid(slug) ? `${SITE_URL}/contests/${slug}` : `${SITE_URL}/c/${slug}`;

    const contest = await findBySlugOrId<{
      id: string;
      title: string;
      description: string | null;
      image_url: string | null;
      custom_slug: string | null;
    }>('contests', 'id,title,description,image_url,custom_slug', slug);

    if (contest) {
      title = `${contest.title} | USEQIV`;
      description = contest.description || `Vote now in ${contest.title}`;
      image = contest.image_url || '';
      pageUrl = contest.custom_slug ? `${SITE_URL}/c/${contest.custom_slug}` : `${SITE_URL}/contests/${contest.id}`;
    }
  } else if (type === 'contestant') {
    const [contestKey, contestantSlug] = slug.split('/');
    const normalizedContestantSlug = contestantSlug.trim().toLowerCase();
    pageUrl = isUuid(contestKey)
      ? `${SITE_URL}/contests/${contestKey}/contestant/${contestantSlug}`
      : `${SITE_URL}/c/${contestKey}/contestant/${contestantSlug}`;
    ogType = 'profile';

    const contest = await findBySlugOrId<{
      id: string;
      title: string;
      custom_slug: string | null;
    }>('contests', 'id,title,custom_slug', contestKey);

    if (contest && contestantSlug) {
      const contestants = await supabaseRest<{
        id: string;
        name: string;
        bio: string | null;
        photo_url: string | null;
      }>(`contestants?select=id,name,bio,photo_url&contest_id=eq.${contest.id}`);

      const slugify = (value: string) =>
        value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      const contestant = contestants.find(
        (entry) => slugify(entry.name) === normalizedContestantSlug || entry.id === contestantSlug
      );

      if (contestant) {
        title = `Vote for ${contestant.name} in ${contest.title} | USEQIV`;
        description = `Vote and support ${contestant.name} for ${contest.title}.${contestant.bio ? ` ${contestant.bio}` : ''}`;
        image = contestant.photo_url || '';
        pageUrl = contest.custom_slug
          ? `${SITE_URL}/c/${contest.custom_slug}/contestant/${contestantSlug}`
          : `${SITE_URL}/contests/${contest.id}/contestant/${contestantSlug}`;
      }
    }
  } else if (type === 'campaign') {
    const campaign = await findBySlugOrId<{
      id: string;
      title: string;
      description: string | null;
      short_description: string | null;
      image_url: string | null;
      custom_slug: string | null;
      goal_amount: number;
      currency: string;
    }>(
      'campaigns',
      'id,title,description,short_description,image_url,custom_slug,goal_amount,currency',
      slug
    );

    if (campaign) {
      title = `${campaign.title} | USEQIV Campaigns`;
      description =
        campaign.short_description ||
        campaign.description ||
        `Support ${campaign.title} - Help us reach our goal of ${campaign.currency} ${Number(campaign.goal_amount).toLocaleString()}`;
      image = campaign.image_url || '';
      pageUrl = campaign.custom_slug
        ? `${SITE_URL}/campaigns/${campaign.custom_slug}`
        : `${SITE_URL}/campaigns/${campaign.id}`;
    }
  } else if (type === 'form') {
    const form = await findBySlugOrId<{
      id: string;
      title: string;
      description: string | null;
      custom_slug: string | null;
      logo_url: string | null;
    }>('forms', 'id,title,description,custom_slug,logo_url', slug);

    if (form) {
      title = `${form.title} | USEQIV`;
      description = form.description || `Fill out ${form.title}`;
      image = form.logo_url || '';
      pageUrl = form.custom_slug ? `${SITE_URL}/f/${form.custom_slug}` : `${SITE_URL}/f/${form.id}`;
    }
  } else if (type === 'blog') {
    title = 'USEQIV Blog | Contest Voting, Events & Crowdfunding Insights';
    description =
      'Expert guides, product updates, and insights on contest voting, event ticketing, crowdfunding, and event management.';
    pageUrl = `${SITE_URL}/blog`;
    image = `${SITE_URL}/og-image.png`;
  } else if (type === 'blog-post') {
    const rows = await supabaseRest<{
      title: string;
      excerpt: string | null;
      content: string;
      cover_image_url: string | null;
      slug: string;
      published_at: string | null;
      created_at: string;
      updated_at: string;
    }>(
      `blog_posts?select=title,excerpt,content,cover_image_url,slug,published_at,created_at,updated_at&slug=eq.${encodeURIComponent(slug)}&status=eq.published&limit=1`
    );
    const post = rows[0];

    if (post) {
      title = post.title;
      description = buildMetaDescription(post.excerpt, post.content);
      image = post.cover_image_url || `${SITE_URL}/og-image.png`;
      pageUrl = `${SITE_URL}/blog/${post.slug}`;
      ogType = 'article';

      return {
        title,
        description,
        image: toSocialOgImageUrl(image),
        pageUrl,
        type: ogType,
        publishedTime: post.published_at ?? post.created_at,
        modifiedTime: post.updated_at,
        bodyText: stripHtml(post.content).slice(0, 5000),
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: post.title,
          description,
          image: image ? [toSocialOgImageUrl(image)] : undefined,
          datePublished: post.published_at ?? post.created_at,
          dateModified: post.updated_at,
          author: {
            '@type': 'Organization',
            name: 'USEQIV',
            url: SITE_URL,
          },
          publisher: {
            '@type': 'Organization',
            name: 'USEQIV',
            logo: {
              '@type': 'ImageObject',
              url: `${SITE_URL}/logo.png`,
            },
          },
          mainEntityOfPage: pageUrl,
          url: pageUrl,
        },
      };
    }
  }

  return {
    title,
    description,
    image: toSocialOgImageUrl(image),
    pageUrl,
    type: ogType,
  };
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function buildMetaDescription(excerpt: string | null, content: string, maxLength = 160): string {
  const source = excerpt?.trim() || stripHtml(content);
  if (source.length <= maxLength) return source;
  const trimmed = source.slice(0, maxLength - 1);
  const lastSpace = trimmed.lastIndexOf(' ');
  return `${(lastSpace > 80 ? trimmed.slice(0, lastSpace) : trimmed).trim()}…`;
}

/** Serve OG images from useqiv.com and convert WebP to JPEG for WhatsApp/Facebook. */
export function toSocialOgImageUrl(rawImage: string | null | undefined): string {
  const absolute = toAbsolutePublicImageUrl(rawImage);
  if (!absolute) return '';
  return `${SITE_URL}/api/og-image?url=${encodeURIComponent(absolute)}`;
}

function toAbsolutePublicImageUrl(rawImage: string | null | undefined): string {
  if (!rawImage) return '';
  const image = rawImage.trim();
  if (!image) return '';
  if (/^https?:\/\//i.test(image)) return image;
  if (image.startsWith('/storage/v1/object/public/')) return `${SUPABASE_URL}${image}`;
  if (image.startsWith('storage/v1/object/public/')) return `${SUPABASE_URL}/${image}`;
  if (image.startsWith('/')) return `${SITE_URL}${image}`;
  return `${SUPABASE_STORAGE_PUBLIC_BASE}/${image}`;
}

export function renderOgHtml(data: OgData): string {
  const imageMeta = data.image
    ? `
  <meta property="og:image" content="${escapeHtml(data.image)}">
  <meta property="og:image:secure_url" content="${escapeHtml(data.image)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${escapeHtml(data.title)}">
  <meta name="twitter:image" content="${escapeHtml(data.image)}">
  <meta name="twitter:image:alt" content="${escapeHtml(data.title)}">`
    : '';

  const articleMeta =
    data.type === 'article'
      ? `
  <meta property="article:published_time" content="${escapeHtml(data.publishedTime || '')}">
  <meta property="article:modified_time" content="${escapeHtml(data.modifiedTime || data.publishedTime || '')}">
  <meta property="article:author" content="USEQIV">
  <meta property="article:section" content="Blog">`
      : '';

  const robotsMeta = `
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <meta name="googlebot" content="index, follow, max-image-preview:large">`;

  const jsonLdItems = data.jsonLd
    ? Array.isArray(data.jsonLd)
      ? data.jsonLd
      : [data.jsonLd]
    : [];
  const jsonLdMeta = jsonLdItems
    .map(
      (schema) => `
  <script type="application/ld+json">${JSON.stringify(schema)}</script>`
    )
    .join('');

  const bodyContent = data.bodyText
    ? `<article><h1>${escapeHtml(data.title)}</h1><p>${escapeHtml(data.description)}</p><div>${escapeHtml(data.bodyText)}</div></article>`
    : `<p>${escapeHtml(data.description)}</p>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(data.title)}</title>
  <meta name="description" content="${escapeHtml(data.description)}">
  <meta name="title" content="${escapeHtml(data.title)}">
${robotsMeta}
  <meta property="og:type" content="${escapeHtml(data.type)}">
  <meta property="og:url" content="${escapeHtml(data.pageUrl)}">
  <meta property="og:title" content="${escapeHtml(data.title)}">
  <meta property="og:description" content="${escapeHtml(data.description)}">
  <meta property="og:locale" content="en_US">
${imageMeta}
${articleMeta}
  <meta property="og:site_name" content="USEQIV">
  <link rel="shortcut icon" href="${SITE_URL}/favicon.ico" sizes="any">
  <link rel="icon" href="${SITE_URL}/favicon.ico" sizes="any">
  <link rel="icon" href="${SITE_URL}/favicon.png" type="image/png" sizes="32x32">
  <link rel="apple-touch-icon" href="${SITE_URL}/apple-touch-icon.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@useqiv">
  <meta name="twitter:url" content="${escapeHtml(data.pageUrl)}">
  <meta name="twitter:title" content="${escapeHtml(data.title)}">
  <meta name="twitter:description" content="${escapeHtml(data.description)}">
  <link rel="canonical" href="${escapeHtml(data.pageUrl)}">
${jsonLdMeta}
</head>
<body>
  ${bodyContent}
  <p><a href="${escapeHtml(data.pageUrl)}">${escapeHtml(data.pageUrl)}</a></p>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
