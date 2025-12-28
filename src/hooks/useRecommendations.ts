import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
  const { user } = useAuth();

  return useQuery({
    queryKey: ['recommendations', user?.id],
    queryFn: async (): Promise<Recommendations> => {
      const { data, error } = await supabase.functions.invoke('get-recommendations');
      
      if (error) throw error;
      return data as Recommendations;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
    refetchOnWindowFocus: false,
  });
};
