import { useMemo } from 'react';
import type { OrganizationSettings } from '@/hooks/useOrganization';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  href: string;
  completed: boolean;
}

interface OnboardingInput {
  orgSettings: OrganizationSettings | null | undefined;
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

export function useOrgOnboardingProgress({ orgSettings }: OnboardingInput) {
  return useMemo(() => {
    const hasCompanyProfile = Boolean(orgSettings?.company_name?.trim());
    const hasPayoutDetails = Boolean(
      (orgSettings?.bank_name &&
        orgSettings?.account_number &&
        orgSettings?.account_name) ||
        orgSettings?.usdt_address?.trim(),
    );

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
    };
  }, [orgSettings]);
}
