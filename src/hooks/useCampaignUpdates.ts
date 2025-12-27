import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CampaignUpdate {
  id: string;
  campaign_id: string;
  title: string;
  content: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export const useCampaignUpdates = (campaignId: string) => {
  return useQuery({
    queryKey: ['campaign-updates', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaign_updates')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as CampaignUpdate[];
    },
    enabled: !!campaignId,
  });
};

export const useCreateCampaignUpdate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (update: {
      campaign_id: string;
      title: string;
      content: string;
      image_url?: string;
    }) => {
      const { data, error } = await supabase
        .from('campaign_updates')
        .insert(update)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['campaign-updates', data.campaign_id] });
      toast.success('Update posted! Donors will be notified.');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useDeleteCampaignUpdate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, campaignId }: { id: string; campaignId: string }) => {
      const { error } = await supabase
        .from('campaign_updates')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { id, campaignId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['campaign-updates', data.campaignId] });
      toast.success('Update deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};
