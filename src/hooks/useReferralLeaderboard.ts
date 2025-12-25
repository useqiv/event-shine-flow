import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  referral_count: number;
  total_earnings: number;
}

export const useReferralLeaderboard = (limit: number = 10) => {
  return useQuery({
    queryKey: ['referral-leaderboard', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_referral_leaderboard', { limit_count: limit });

      if (error) throw error;
      return data as LeaderboardEntry[];
    },
  });
};
