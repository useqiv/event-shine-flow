import { useMemo } from 'react';
import type { OrganizationSettings } from '@/hooks/useOrganization';
import type { SocialAccount } from '@/hooks/useOrganizationSocialAccounts';
import type { SocialPostLog } from '@/hooks/useSocialPostLogs';
import type { Campaign } from '@/hooks/useCampaigns';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  href: string;
  completed: boolean;
}

interface OnboardingInput {
  orgSettings: OrganizationSettings | null | undefined;
  contests: { id: string }[] | undefined;
  events: { id: string }[] | undefined;
  campaigns: Campaign[] | undefined;
  socialAccounts: SocialAccount[] | undefined;
  postLogs: SocialPostLog[] | undefined;
}

export function resolveMarketingHref(
  contests: { id: string }[] | undefined,
  events: { id: string }[] | undefined,
): string {
  if (contests && contests.length > 0) {
    return `/org/contests/${contests[0].id}/marketing`;
  }
  if (events && events.length > 0) {
    return `/org/events/${events[0].id}/marketing`;
  }
  return '/org/contests/create';
}

export function useOrgOnboardingProgress({
  orgSettings,
  contests,
  events,
  campaigns,
  socialAccounts,
  postLogs,
}: OnboardingInput) {
  return useMemo(() => {
    const marketingHref = resolveMarketingHref(contests, events);

    const hasCompanyProfile = Boolean(orgSettings?.company_name?.trim());
    const hasPayoutDetails = Boolean(
      (orgSettings?.bank_name &&
        orgSettings?.account_number &&
        orgSettings?.account_name) ||
        orgSettings?.usdt_address?.trim(),
    );
    const hasListing =
      (contests?.length || 0) + (events?.length || 0) + (campaigns?.length || 0) > 0;
    const hasSocialAccount = socialAccounts?.some((a) => a.is_connected) ?? false;
    const hasSharedPost = postLogs?.some((p) => p.status === 'success') ?? false;

    const steps: OnboardingStep[] = [
      {
        id: 'company',
        title: 'Set up company profile',
        description: 'Add your organization name and contact details',
        href: '/org/settings',
        completed: hasCompanyProfile,
      },
      {
        id: 'payout',
        title: 'Add payout details',
        description: 'Bank account or USDT wallet for withdrawals',
        href: '/org/settings',
        completed: hasPayoutDetails,
      },
      {
        id: 'listing',
        title: 'Create your first listing',
        description: 'Launch a contest, event, or fundraising campaign',
        href: '/org/contests/create',
        completed: hasListing,
      },
      {
        id: 'social',
        title: 'Connect social accounts',
        description: 'Link Facebook, X, or other platforms for auto-posting',
        href: marketingHref,
        completed: hasSocialAccount,
      },
      {
        id: 'share',
        title: 'Share your first post',
        description: 'Publish to social media from a contest or event',
        href: marketingHref,
        completed: hasSharedPost,
      },
    ];

    const completedCount = steps.filter((s) => s.completed).length;
    const totalCount = steps.length;
    const progressPercent = Math.round((completedCount / totalCount) * 100);

    return {
      steps,
      completedCount,
      totalCount,
      progressPercent,
      isComplete: completedCount === totalCount,
      marketingHref,
    };
  }, [orgSettings, contests, events, campaigns, socialAccounts, postLogs]);
}
