import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { queryCache } from '@/lib/queryConfig';

interface Contest {
  id: string;
  title: string;
  category: string;
  image_url: string | null;
  vote_price: number;
  vote_currency: string;
  end_date: string;
}

interface Event {
  id: string;
  title: string;
  category: string;
  image_url: string | null;
  event_date: string;
  venue: string;
}

interface Recommendations {
  contests: Contest[];
  events: Event[];
  reason: string;
}

export const useRecommendations = () => {
  const { user, session } = useAuth();

  return useQuery({
    queryKey: ['recommendations', user?.id],
    queryFn: async (): Promise<Recommendations> => {
      // Ensure we have a valid session before calling
      if (!session?.access_token) {
        throw new Error('No valid session');
      }
      
      const { data, error } = await supabase.functions.invoke('get-recommendations');
      
      if (error) throw error;
      return data as Recommendations;
    },
    enabled: !!user?.id && !!session?.access_token,
    ...queryCache.semiStatic, // Recommendations don't need frequent updates
    refetchOnWindowFocus: false,
    retry: false, // Don't retry on auth errors
  });
};
