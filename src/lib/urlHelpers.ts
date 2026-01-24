// Helper functions for generating SEO-friendly URLs

/**
 * Create a URL-friendly slug from a contestant name
 */
export const createContestantSlug = (name: string): string => {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
};

/**
 * Generate contest URL - uses custom_slug if available, otherwise falls back to UUID
 */
export const getContestUrl = (contestId: string, customSlug?: string | null): string => {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
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
  contestCustomSlug?: string | null
): string => {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const contestantSlug = createContestantSlug(contestantName);
  
  if (contestCustomSlug) {
    return `${origin}/c/${contestCustomSlug}/contestant/${contestantSlug}`;
  }
  return `${origin}/contests/${contestId}/contestant/${contestantSlug}`;
};
