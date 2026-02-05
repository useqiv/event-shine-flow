import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OrgNotificationSettings {
  notify_on_vote: boolean;
  notify_on_ticket: boolean;
  notify_on_donation: boolean;
}

export const useOrgNotificationSettings = (organizationId: string) => {
  return useQuery({
    queryKey: ['org-notification-settings', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organization_settings')
        .select('notify_on_vote, notify_on_ticket, notify_on_donation')
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (error) throw error;
      return data as OrgNotificationSettings | null;
    },
    enabled: !!organizationId,
  });
};

export const useUpdateOrgNotificationSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      organizationId,
      notify_on_vote,
      notify_on_ticket,
      notify_on_donation,
    }: {
      organizationId: string;
      notify_on_vote: boolean;
      notify_on_ticket: boolean;
      notify_on_donation: boolean;
    }) => {
      // Check if settings exist
      const { data: existing } = await supabase
        .from('organization_settings')
        .select('id')
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('organization_settings')
          .update({
            notify_on_vote,
            notify_on_ticket,
            notify_on_donation,
          })
          .eq('organization_id', organizationId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('organization_settings')
          .insert({
            organization_id: organizationId,
            notify_on_vote,
            notify_on_ticket,
            notify_on_donation,
          });
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['org-notification-settings', variables.organizationId] });
      queryClient.invalidateQueries({ queryKey: ['all-organizations'] });
      toast.success('Notification settings updated');
    },
    onError: (error) => {
      toast.error('Failed to update notification settings');
      console.error(error);
    },
  });
};
