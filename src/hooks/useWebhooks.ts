import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Webhook {
  id: string;
  organization_id: string;
  name: string;
  url: string;
  secret: string | null;
  events: string[];
  is_active: boolean;
  last_triggered_at: string | null;
  failure_count: number;
  created_at: string;
  updated_at: string;
}

export interface WebhookLog {
  id: string;
  webhook_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  response_status: number | null;
  response_body: string | null;
  success: boolean;
  created_at: string;
}

export const WEBHOOK_EVENTS = [
  { value: 'vote.created', label: 'New Vote' },
  { value: 'ticket.purchased', label: 'Ticket Purchased' },
  { value: 'payout.requested', label: 'Payout Requested' },
  { value: 'payout.completed', label: 'Payout Completed' },
  { value: 'contestant.added', label: 'Contestant Added' },
  { value: 'contest.ended', label: 'Contest Ended' },
  { value: 'event.created', label: 'Event Created' },
];

export const useWebhooks = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['webhooks', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organization_webhooks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Webhook[];
    },
    enabled: !!user,
  });
};

export const useWebhookLogs = (webhookId: string) => {
  return useQuery({
    queryKey: ['webhook-logs', webhookId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhook_logs')
        .select('*')
        .eq('webhook_id', webhookId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as WebhookLog[];
    },
    enabled: !!webhookId,
  });
};

export const useCreateWebhook = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (webhook: { name: string; url: string; secret?: string; events: string[] }) => {
      const { data, error } = await supabase
        .from('organization_webhooks')
        .insert({
          organization_id: user!.id,
          name: webhook.name,
          url: webhook.url,
          secret: webhook.secret || null,
          events: webhook.events,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success('Webhook created successfully');
    },
    onError: (error) => {
      console.error('Failed to create webhook:', error);
      toast.error('Failed to create webhook');
    },
  });
};

export const useUpdateWebhook = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Webhook> & { id: string }) => {
      const { data, error } = await supabase
        .from('organization_webhooks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success('Webhook updated');
    },
    onError: (error) => {
      console.error('Failed to update webhook:', error);
      toast.error('Failed to update webhook');
    },
  });
};

export const useDeleteWebhook = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (webhookId: string) => {
      const { error } = await supabase
        .from('organization_webhooks')
        .delete()
        .eq('id', webhookId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success('Webhook deleted');
    },
    onError: (error) => {
      console.error('Failed to delete webhook:', error);
      toast.error('Failed to delete webhook');
    },
  });
};

export const useTestWebhook = () => {
  return useMutation({
    mutationFn: async (webhookId: string) => {
      const { data, error } = await supabase.functions.invoke('send-webhook', {
        body: { webhookId, test: true },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Test webhook sent');
    },
    onError: (error) => {
      console.error('Failed to test webhook:', error);
      toast.error('Failed to send test webhook');
    },
  });
};
