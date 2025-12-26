import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface FavoriteContestant {
  id: string;
  user_id: string;
  contestant_id: string;
  created_at: string;
  contestant?: {
    id: string;
    name: string;
    photo_url: string | null;
    bio: string | null;
    vote_count: number;
    contest_id: string;
    contest?: {
      id: string;
      title: string;
      end_date: string;
      is_active: boolean;
    };
  };
}

export const useFavoriteContestants = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['favorite-contestants', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('favorite_contestants')
        .select(`
          *,
          contestant:contestants(
            id,
            name,
            photo_url,
            bio,
            vote_count,
            contest_id,
            contest:contests(id, title, end_date, is_active)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as FavoriteContestant[];
    },
    enabled: !!user?.id,
  });
};

export const useIsFavorite = (contestantId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['is-favorite', contestantId, user?.id],
    queryFn: async () => {
      if (!user?.id || !contestantId) return false;
      
      const { data, error } = await supabase
        .from('favorite_contestants')
        .select('id')
        .eq('user_id', user.id)
        .eq('contestant_id', contestantId)
        .maybeSingle();
      
      if (error) throw error;
      return !!data;
    },
    enabled: !!user?.id && !!contestantId,
  });
};

export const useToggleFavorite = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ contestantId, isFavorite }: { contestantId: string; isFavorite: boolean }) => {
      if (!user?.id) throw new Error('Not authenticated');

      if (isFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from('favorite_contestants')
          .delete()
          .eq('user_id', user.id)
          .eq('contestant_id', contestantId);
        
        if (error) throw error;
        return { action: 'removed' };
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('favorite_contestants')
          .insert({
            user_id: user.id,
            contestant_id: contestantId,
          });
        
        if (error) throw error;
        return { action: 'added' };
      }
    },
    onSuccess: (result, { contestantId }) => {
      queryClient.invalidateQueries({ queryKey: ['favorite-contestants'] });
      queryClient.invalidateQueries({ queryKey: ['is-favorite', contestantId] });
      
      toast.success(
        result.action === 'added' 
          ? 'Added to favorites!' 
          : 'Removed from favorites'
      );
    },
    onError: (error) => {
      toast.error('Failed to update favorites');
      console.error(error);
    },
  });
};
