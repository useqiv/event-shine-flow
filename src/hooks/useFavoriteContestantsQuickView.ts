import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { queryCache } from '@/lib/queryConfig';

interface FavoriteContestantWithRank {
  id: string;
  contestant_id: string;
  contestant: {
    id: string;
    name: string;
    photo_url: string | null;
    vote_count: number;
    contest_id: string;
    contest: {
      id: string;
      title: string;
      end_date: string;
      is_active: boolean;
    };
  };
  rank: number;
  totalContestants: number;
}

export const useFavoriteContestantsQuickView = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['favorite-contestants-quick-view', user?.id],
    queryFn: async (): Promise<FavoriteContestantWithRank[]> => {
      if (!user?.id) return [];

      // Get user's favorite contestants with minimal columns
      const { data: favorites, error } = await supabase
        .from('favorite_contestants')
        .select(`
          id,
          contestant_id,
          contestants (
            id,
            name,
            photo_url,
            vote_count,
            contest_id,
            contests (
              id,
              title,
              end_date,
              is_active
            )
          )
        `)
        .eq('user_id', user.id)
        .limit(5);

      if (error) throw error;
      if (!favorites || favorites.length === 0) return [];

      // For each favorite, calculate their rank within their contest
      const results: FavoriteContestantWithRank[] = [];

      for (const fav of favorites) {
        const contestant = fav.contestants as any;
        if (!contestant || !contestant.contests) continue;

        // Get all contestants in this contest to calculate rank - minimal columns
        const { data: allContestants } = await supabase
          .from('contestants')
          .select('id, vote_count')
          .eq('contest_id', contestant.contest_id)
          .order('vote_count', { ascending: false });

        const rank = (allContestants?.findIndex(c => c.id === contestant.id) ?? -1) + 1;
        const totalContestants = allContestants?.length ?? 0;

        results.push({
          id: fav.id,
          contestant_id: fav.contestant_id,
          contestant: {
            id: contestant.id,
            name: contestant.name,
            photo_url: contestant.photo_url,
            vote_count: contestant.vote_count,
            contest_id: contestant.contest_id,
            contest: {
              id: contestant.contests.id,
              title: contestant.contests.title,
              end_date: contestant.contests.end_date,
              is_active: contestant.contests.is_active,
            },
          },
          rank,
          totalContestants,
        });
      }

      // Sort by active contests first, then by rank
      return results.sort((a, b) => {
        if (a.contestant.contest.is_active !== b.contestant.contest.is_active) {
          return a.contestant.contest.is_active ? -1 : 1;
        }
        return a.rank - b.rank;
      });
    },
    enabled: !!user?.id,
    ...queryCache.dynamic, // Vote counts change frequently
  });
};
