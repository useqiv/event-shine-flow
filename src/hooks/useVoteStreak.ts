import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface VoteStreak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_vote_date: string | null;
  total_streak_bonuses_earned: number;
  created_at: string;
  updated_at: string;
}

export const useVoteStreak = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['vote-streak', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('user_vote_streaks')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as VoteStreak | null;
    },
    enabled: !!user?.id,
  });
};
