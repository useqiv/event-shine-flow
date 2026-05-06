// Helper functions for generating SEO-friendly URLs

// Production domain for absolute URLs
const PRODUCTION_DOMAIN = 'https://www.useqiv.com';
const SUPABASE_FUNCTIONS_BASE = 'https://tirqmqzgksclsjxfiham.supabase.co/functions/v1';

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
 * Generate share URL that serves crawler-specific OG tags and redirects humans.
 */
export const getOgShareUrl = (
  type: 'event' | 'contest' | 'contestant' | 'campaign' | 'form',
  slug: string
): string => {
  return `${SUPABASE_FUNCTIONS_BASE}/og-meta?type=${encodeURIComponent(type)}&slug=${encodeURIComponent(slug)}`;
};

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
