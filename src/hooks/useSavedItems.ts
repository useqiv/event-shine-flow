import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { queryCache, selectColumns } from '@/lib/queryConfig';

export interface SavedItem {
  id: string;
  user_id: string;
  item_type: 'contest' | 'event';
  item_id: string;
  created_at: string;
}

export const useSavedItems = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['saved-items', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('saved_items')
        .select('id, user_id, item_type, item_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as SavedItem[];
    },
    enabled: !!user?.id,
    ...queryCache.semiStatic,
  });
};

export const useSavedContests = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['saved-contests', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data: savedItems, error: savedError } = await supabase
        .from('saved_items')
        .select('item_id')
        .eq('user_id', user.id)
        .eq('item_type', 'contest');
      
      if (savedError) throw savedError;
      if (!savedItems.length) return [];

      const contestIds = savedItems.map(item => item.item_id);
      
      const { data: contests, error: contestsError } = await supabase
        .from('contests')
        .select(selectColumns.contestCard)
        .in('id', contestIds)
        .gte('end_date', new Date().toISOString());
      
      if (contestsError) throw contestsError;
      return contests;
    },
    enabled: !!user?.id,
    ...queryCache.semiStatic,
  });
};

export const useSavedEvents = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['saved-events', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data: savedItems, error: savedError } = await supabase
        .from('saved_items')
        .select('item_id')
        .eq('user_id', user.id)
        .eq('item_type', 'event');
      
      if (savedError) throw savedError;
      if (!savedItems.length) return [];

      const eventIds = savedItems.map(item => item.item_id);
      
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select(selectColumns.eventCard)
        .in('id', eventIds)
        .gte('event_date', new Date().toISOString());
      
      if (eventsError) throw eventsError;
      return events;
    },
    enabled: !!user?.id,
    ...queryCache.semiStatic,
  });
};

export const useToggleSave = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ itemType, itemId }: { itemType: 'contest' | 'event'; itemId: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Check if already saved
      const { data: existing } = await supabase
        .from('saved_items')
        .select('id')
        .eq('user_id', user.id)
        .eq('item_type', itemType)
        .eq('item_id', itemId)
        .maybeSingle();

      if (existing) {
        // Remove
        await supabase
          .from('saved_items')
          .delete()
          .eq('id', existing.id);
        return { saved: false };
      } else {
        // Add
        await supabase
          .from('saved_items')
          .insert({
            user_id: user.id,
            item_type: itemType,
            item_id: itemId
          });
        return { saved: true };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-items'] });
      queryClient.invalidateQueries({ queryKey: ['saved-contests'] });
      queryClient.invalidateQueries({ queryKey: ['saved-events'] });
    },
  });
};

export const useIsSaved = (itemType: 'contest' | 'event', itemId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['is-saved', user?.id, itemType, itemId],
    queryFn: async () => {
      if (!user?.id) return false;
      
      const { data } = await supabase
        .from('saved_items')
        .select('id')
        .eq('user_id', user.id)
        .eq('item_type', itemType)
        .eq('item_id', itemId)
        .maybeSingle();
      
      return !!data;
    },
    enabled: !!user?.id && !!itemId,
  });
};
