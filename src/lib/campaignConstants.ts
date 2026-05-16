/** Shared campaign category slugs — must match Create, Edit, browse filters, and DB values. */
export const CAMPAIGN_CATEGORIES = [
  { value: 'medical', label: 'Medical & Health' },
  { value: 'education', label: 'Education' },
  { value: 'community', label: 'Community' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'creative', label: 'Creative Projects' },
  { value: 'charity', label: 'Charity' },
  { value: 'sports', label: 'Sports' },
  { value: 'other', label: 'Other' },
] as const;

export type CampaignCategory = (typeof CAMPAIGN_CATEGORIES)[number]['value'];

const CATEGORY_LABEL_BY_VALUE = Object.fromEntries(
  CAMPAIGN_CATEGORIES.map((c) => [c.value, c.label]),
) as Record<string, string>;

/** Maps legacy Title Case / extra labels saved by older edit UI to canonical slugs. */
const LEGACY_CATEGORY_MAP: Record<string, CampaignCategory> = {
  medical: 'medical',
  education: 'education',
  community: 'community',
  emergency: 'emergency',
  creative: 'creative',
  charity: 'charity',
  sports: 'sports',
  other: 'other',
  general: 'other',
  business: 'other',
  environment: 'other',
  animal: 'other',
  'medical&health': 'medical',
  'creativeprojects': 'creative',
};

export const normalizeCampaignCategory = (category: string | null | undefined): CampaignCategory => {
  if (!category) return 'other';
  const key = category.trim().toLowerCase().replace(/\s+/g, '');
  if (LEGACY_CATEGORY_MAP[key]) return LEGACY_CATEGORY_MAP[key];
  const titleKey = category.trim().toLowerCase();
  if (LEGACY_CATEGORY_MAP[titleKey]) return LEGACY_CATEGORY_MAP[titleKey];
  return 'other';
};

export const getCampaignCategoryLabel = (category: string | null | undefined): string => {
  const slug = normalizeCampaignCategory(category);
  return CATEGORY_LABEL_BY_VALUE[slug] ?? category ?? 'Other';
};

export const getMinGoalAmount = (currency: string): number => {
  switch (currency) {
    case 'NGN':
      return 1000;
    case 'USD':
    case 'EUR':
    case 'GBP':
      return 10;
    default:
      return 1;
  }
};

export const getCurrencySymbol = (currency: string): string => {
  switch (currency) {
    case 'USD':
      return '$';
    case 'EUR':
      return '€';
    case 'GBP':
      return '£';
    case 'NGN':
      return '₦';
    default:
      return currency;
  }
};

export const canAcceptDonations = (status: string, endDate: string | null | undefined): boolean => {
  if (status !== 'active') return false;
  if (endDate && new Date(endDate) < new Date()) return false;
  return true;
};
