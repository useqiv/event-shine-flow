import DOMPurify from 'dompurify';
import { SITE_URL } from '@/lib/structuredData';

const DEFAULT_BLOG_KEYWORDS =
  'USEQIV blog, contest voting, event ticketing, crowdfunding, event management, voting platform';

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function sanitizeBlogHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's',
      'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'a', 'img', 'blockquote',
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'target', 'rel', 'class'],
  });
}

export function stripHtmlToText(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent?.trim() ?? '';
}

export function buildBlogMetaDescription(
  excerpt: string | null | undefined,
  content: string,
  maxLength = 160
): string {
  const source = excerpt?.trim() || stripHtmlToText(content);
  if (source.length <= maxLength) return source;
  const trimmed = source.slice(0, maxLength - 1);
  const lastSpace = trimmed.lastIndexOf(' ');
  return `${(lastSpace > 80 ? trimmed.slice(0, lastSpace) : trimmed).trim()}…`;
}

export function buildBlogKeywords(title: string, excerpt?: string | null): string {
  const titleWords = title
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((word) => word.length > 3)
    .slice(0, 6)
    .join(', ');

  const extra = excerpt
    ? stripHtmlToText(excerpt)
        .toLowerCase()
        .split(/\s+/)
        .filter((word) => word.length > 4)
        .slice(0, 4)
        .join(', ')
    : '';

  return [titleWords, extra, DEFAULT_BLOG_KEYWORDS].filter(Boolean).join(', ');
}

export function countWords(html: string): number {
  const text = stripHtmlToText(html);
  return text ? text.split(/\s+/).filter(Boolean).length : 0;
}

/** OG/Twitter image URL — proxies cover images for reliable social previews */
export function getBlogShareOgImage(coverImageUrl: string | null | undefined): string {
  const fallback = `${SITE_URL}/og-image.png`;
  if (!coverImageUrl?.trim()) return fallback;
  const image = coverImageUrl.trim();
  if (!/^https?:\/\//i.test(image)) return fallback;
  return `${SITE_URL}/api/og-image?url=${encodeURIComponent(image)}`;
}

export function getBlogShareUrl(slug: string): string {
  return `${SITE_URL}/blog/${slug}`;
}
