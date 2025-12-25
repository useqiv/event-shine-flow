import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface EventAutoPost {
  id: string;
  event_id: string;
  organization_id: string;
  platform: string;
  post_type: string;
  schedule_interval: string;
  custom_message: string | null;
  is_active: boolean;
  last_posted_at: string | null;
  next_post_at: string | null;
  created_at: string;
  updated_at: string;
}

export const useEventAutoPosts = (eventId?: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['event-auto-posts', eventId],
    queryFn: async () => {
      let query = supabase
        .from('event_auto_posts')
        .select('*')
        .eq('organization_id', user!.id);
      
      if (eventId) {
        query = query.eq('event_id', eventId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as EventAutoPost[];
    },
    enabled: !!user,
  });
};

export const useCreateEventAutoPost = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (autoPostData: {
      event_id: string;
      platform?: string;
      post_type?: string;
      schedule_interval?: string;
      custom_message?: string;
    }) => {
      // Calculate next post time based on interval
      const interval = autoPostData.schedule_interval || 'daily';
      const now = new Date();
      let nextPostAt: Date;
      
      switch (interval) {
        case 'hourly':
          nextPostAt = new Date(now.getTime() + 60 * 60 * 1000);
          break;
        case 'twice_daily':
          nextPostAt = new Date(now.getTime() + 12 * 60 * 60 * 1000);
          break;
        case 'weekly':
          nextPostAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          break;
        default:
          nextPostAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      }

      const { data, error } = await supabase
        .from('event_auto_posts')
        .insert({
          ...autoPostData,
          organization_id: user!.id,
          next_post_at: nextPostAt.toISOString(),
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-auto-posts'] });
      toast.success('Auto-post schedule created');
    },
    onError: (error) => {
      toast.error('Failed to create auto-post schedule');
      console.error(error);
    },
  });
};

export const useUpdateEventAutoPost = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<EventAutoPost> & { id: string }) => {
      const { error } = await supabase
        .from('event_auto_posts')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-auto-posts'] });
      toast.success('Auto-post schedule updated');
    },
    onError: (error) => {
      toast.error('Failed to update auto-post schedule');
      console.error(error);
    },
  });
};

export const useDeleteEventAutoPost = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('event_auto_posts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-auto-posts'] });
      toast.success('Auto-post schedule deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete auto-post schedule');
      console.error(error);
    },
  });
};
