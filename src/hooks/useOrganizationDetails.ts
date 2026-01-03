import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useOrganizationDetails = (organizationId: string | null) => {
  const contestsQuery = useQuery({
    queryKey: ['org-contests', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from('contests')
        .select('id, title, category, start_date, end_date, is_active, total_votes, vote_price, vote_currency')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });

  const eventsQuery = useQuery({
    queryKey: ['org-events', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from('events')
        .select('id, title, category, event_date, venue, is_active, currency')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });

  const campaignsQuery = useQuery({
    queryKey: ['org-campaigns', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from('campaigns')
        .select('id, title, category, status, goal_amount, current_amount, currency, donor_count')
        .eq('creator_id', organizationId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });

  const formsQuery = useQuery({
    queryKey: ['org-forms', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from('forms')
        .select('id, title, is_active, is_accepting_responses, created_at')
        .eq('user_id', organizationId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });

  return {
    contests: contestsQuery.data || [],
    events: eventsQuery.data || [],
    campaigns: campaignsQuery.data || [],
    forms: formsQuery.data || [],
    isLoading: contestsQuery.isLoading || eventsQuery.isLoading || campaignsQuery.isLoading || formsQuery.isLoading,
  };
};
