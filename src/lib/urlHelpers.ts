// Helper functions for generating SEO-friendly URLs

// Production domain for absolute URLs
const PRODUCTION_DOMAIN = 'https://www.useqiv.com';

/**
 * Get the origin for URLs - uses production domain for absolute URLs or current origin
 */
export const getOrigin = (useAbsolute = false): string => {
  if (useAbsolute) return PRODUCTION_DOMAIN;
  return typeof window !== 'undefined' ? window.location.origin : PRODUCTION_DOMAIN;
};

/**
 * Create a URL-friendly slug from a name
 */
export const createSlug = (name: string): string => {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
};

/**
 * Create a URL-friendly slug from a contestant name
 * @deprecated Use createSlug instead
 */
export const createContestantSlug = (name: string): string => {
  return createSlug(name);
};

/**
 * Generate contest URL - uses custom_slug if available, otherwise falls back to UUID
 */
export const getContestUrl = (contestId: string, customSlug?: string | null, useAbsolute = false): string => {
  const origin = getOrigin(useAbsolute);
  if (customSlug) {
    return `${origin}/c/${customSlug}`;
  }
  return `${origin}/contests/${contestId}`;
};

/**
 * Generate contestant URL - uses contest's custom_slug if available
 */
export const getContestantUrl = (
  contestId: string, 
  contestantName: string, 
  contestCustomSlug?: string | null,
  useAbsolute = false
): string => {
  const origin = getOrigin(useAbsolute);
  const contestantSlug = createSlug(contestantName);
  
  if (contestCustomSlug) {
    return `${origin}/c/${contestCustomSlug}/contestant/${contestantSlug}`;
  }
  return `${origin}/contests/${contestId}/contestant/${contestantSlug}`;
};

/**
 * Generate contestant URL using a stable contestant identifier (UUID).
 * This prevents links breaking when contestant names are edited.
 */
export const getContestantUrlById = (
  contestId: string,
  contestantId: string,
  contestCustomSlug?: string | null,
  useAbsolute = false
): string => {
  const origin = getOrigin(useAbsolute);

  if (contestCustomSlug) {
    return `${origin}/c/${contestCustomSlug}/contestant/${contestantId}`;
  }
  return `${origin}/contests/${contestId}/contestant/${contestantId}`;
};

/**
 * Generate domain-based contestant share URL for OG previews.
 */
export const getContestantShareUrl = (
  contestKey: string,
  contestantKey: string,
  useAbsolute = true
): string => {
  const origin = getOrigin(useAbsolute);
  return `${origin}/share/contestant/${encodeURIComponent(contestKey)}/${encodeURIComponent(contestantKey)}`;
};

/**
 * Generate domain-based contest share URL for OG previews.
 */
export const getContestShareUrl = (
  contestKey: string,
  useAbsolute = true
): string => {
  const origin = getOrigin(useAbsolute);
  return `${origin}/share/contest/${encodeURIComponent(contestKey)}`;
};

/**
 * Generate domain-based event share URL for OG previews.
 */
export const getEventShareUrl = (
  eventKey: string,
  useAbsolute = true
): string => {
  const origin = getOrigin(useAbsolute);
  return `${origin}/share/event/${encodeURIComponent(eventKey)}`;
};

/**
 * Generate domain-based campaign share URL for OG previews.
 */
export const getCampaignShareUrl = (
  campaignKey: string,
  useAbsolute = true
): string => {
  const origin = getOrigin(useAbsolute);
  return `${origin}/share/campaign/${encodeURIComponent(campaignKey)}`;
};

/**
 * Generate domain-based form share URL for OG previews.
 */
export const getFormShareUrl = (
  formKey: string,
  useAbsolute = true
): string => {
  const origin = getOrigin(useAbsolute);
  return `${origin}/share/form/${encodeURIComponent(formKey)}`;
};

/**
 * Proxy image URLs through useqiv.com so social platforms receive JPEG previews.
 */
export const getSocialOgImageUrl = (rawImage: string | null | undefined): string => {
  const absolute = toAbsolutePublicImageUrl(rawImage);
  if (!absolute) return '';
  return `${PRODUCTION_DOMAIN}/api/og-image?url=${encodeURIComponent(absolute)}`;
};

const SUPABASE_URL = 'https://tirqmqzgksclsjxfiham.supabase.co';
const SUPABASE_STORAGE_PUBLIC_BASE = `${SUPABASE_URL}/storage/v1/object/public`;

function toAbsolutePublicImageUrl(rawImage: string | null | undefined): string {
  if (!rawImage) return '';
  const image = rawImage.trim();
  if (!image) return '';
  if (/^https?:\/\//i.test(image)) return image;
  if (image.startsWith('/storage/v1/object/public/')) return `${SUPABASE_URL}${image}`;
  if (image.startsWith('storage/v1/object/public/')) return `${SUPABASE_URL}/${image}`;
  if (image.startsWith('/')) return `${PRODUCTION_DOMAIN}${image}`;
  return `${SUPABASE_STORAGE_PUBLIC_BASE}/${image}`;
}

/**
 * Generate event URL - uses custom_slug if available, otherwise falls back to UUID
 */
export const getEventUrl = (eventId: string, customSlug?: string | null, useAbsolute = false): string => {
  const origin = getOrigin(useAbsolute);
  if (customSlug) {
    return `${origin}/e/${customSlug}`;
  }
  return `${origin}/events/${eventId}`;
};

/**
 * Generate campaign URL - uses custom_slug if available, otherwise falls back to UUID
 */
export const getCampaignUrl = (campaignId: string, customSlug?: string | null, useAbsolute = false): string => {
  const origin = getOrigin(useAbsolute);
  if (customSlug) {
    return `${origin}/campaigns/${customSlug}`;
  }
  return `${origin}/campaigns/${campaignId}`;
};

/**
 * Generate form URL - uses custom_slug if available, otherwise falls back to UUID
 */
export const getFormUrl = (formId: string, customSlug?: string | null, useAbsolute = false): string => {
  const origin = getOrigin(useAbsolute);
  if (customSlug) {
    return `${origin}/f/${customSlug}`;
  }
  return `${origin}/f/${formId}`;
};

/**
 * Check if a string is a valid UUID
 */
export const isValidUUID = (str: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
};
