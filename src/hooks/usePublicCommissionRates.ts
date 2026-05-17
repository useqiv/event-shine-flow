import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type CommissionProductKey = "events" | "voting" | "crowdfunding" | "forms";

const SETTING_KEYS = [
  "vote_commission_percentage",
  "ticket_commission_percentage",
  "campaign_commission_percentage",
  "platform_commission_percentage",
] as const;

/** Display defaults when settings are unavailable (e.g. logged out before public policy). */
export const PRICING_COMMISSION_DEFAULTS: Record<CommissionProductKey, number> = {
  events: 10,
  voting: 20,
  crowdfunding: 4,
  forms: 4,
};

const SETTING_BY_PRODUCT: Record<CommissionProductKey, string> = {
  events: "ticket_commission_percentage",
  voting: "vote_commission_percentage",
  crowdfunding: "campaign_commission_percentage",
  forms: "platform_commission_percentage",
};

function parseRate(value: string | null | undefined, fallback: number): number {
  if (value == null || value === "") return fallback;
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : fallback;
}

export function usePublicCommissionRates() {
  const { data, isLoading } = useQuery({
    queryKey: ["public-commission-rates"],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("platform_settings")
        .select("setting_key, setting_value")
        .in("setting_key", [...SETTING_KEYS]);

      if (error) throw error;

      const map = new Map((rows ?? []).map((r) => [r.setting_key, r.setting_value]));

      return {
        events: parseRate(
          map.get("ticket_commission_percentage"),
          PRICING_COMMISSION_DEFAULTS.events
        ),
        voting: parseRate(
          map.get("vote_commission_percentage"),
          PRICING_COMMISSION_DEFAULTS.voting
        ),
        crowdfunding: parseRate(
          map.get("campaign_commission_percentage"),
          PRICING_COMMISSION_DEFAULTS.crowdfunding
        ),
        forms: parseRate(
          map.get("campaign_commission_percentage"),
          PRICING_COMMISSION_DEFAULTS.forms
        ),
      } satisfies Record<CommissionProductKey, number>;
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const rates = data ?? PRICING_COMMISSION_DEFAULTS;

  const getRate = (product: CommissionProductKey) => rates[product];

  return { rates, getRate, isLoading, settingKeyByProduct: SETTING_BY_PRODUCT };
}
