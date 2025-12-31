import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useInfluencerProfile = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['influencer-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('influencer_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
};

export const useInfluencerLinks = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['influencer-links', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('influencer_links')
        .select(`
          *,
          contests:contest_id(title),
          events:event_id(title)
        `)
        .eq('influencer_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });
};

export const useInfluencerStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['influencer-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Get all links for this influencer
      const { data: links, error: linksError } = await supabase
        .from('influencer_links')
        .select('total_clicks, total_conversions, total_revenue, total_commission')
        .eq('influencer_user_id', user.id);

      if (linksError) throw linksError;

      // Calculate totals
      const totals = (links || []).reduce(
        (acc, link) => ({
          total_clicks: acc.total_clicks + (link.total_clicks || 0),
          total_conversions: acc.total_conversions + (link.total_conversions || 0),
          total_revenue: acc.total_revenue + Number(link.total_revenue || 0),
          total_commission: acc.total_commission + Number(link.total_commission || 0),
        }),
        { total_clicks: 0, total_conversions: 0, total_revenue: 0, total_commission: 0 }
      );

      // Get pending payouts
      const { data: pendingPayouts, error: payoutsError } = await supabase
        .from('influencer_payouts')
        .select('amount')
        .eq('influencer_user_id', user.id)
        .in('status', ['pending', 'processing']);

      if (payoutsError) throw payoutsError;

      const pending_payout = (pendingPayouts || []).reduce((acc, p) => acc + Number(p.amount), 0);

      // Get paid payouts
      const { data: paidPayouts, error: paidError } = await supabase
        .from('influencer_payouts')
        .select('amount')
        .eq('influencer_user_id', user.id)
        .eq('status', 'completed');

      if (paidError) throw paidError;

      const paid_earnings = (paidPayouts || []).reduce((acc, p) => acc + Number(p.amount), 0);

      return {
        ...totals,
        pending_payout,
        paid_earnings,
        available_balance: totals.total_commission - pending_payout - paid_earnings,
      };
    },
    enabled: !!user?.id,
  });
};

export const useInfluencerPayouts = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['influencer-payouts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('influencer_payouts')
        .select('*')
        .eq('influencer_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });
};

export const useRequestPayout = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      amount: number;
      currency: string;
      payment_method: string;
      bank_name?: string;
      account_number?: string;
      account_name?: string;
      usdt_address?: string;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase.from('influencer_payouts').insert({
        influencer_user_id: user.id,
        ...params,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['influencer-payouts'] });
      queryClient.invalidateQueries({ queryKey: ['influencer-stats'] });
      toast.success('Payout request submitted successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to submit payout request: ' + error.message);
    },
  });
};

export const useUpdateInfluencerProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      display_name?: string;
      bio?: string;
      payment_method?: string;
      bank_name?: string;
      account_number?: string;
      account_name?: string;
      usdt_address?: string;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Try to update, if no rows affected, insert
      const { data: existing } = await supabase
        .from('influencer_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('influencer_profiles')
          .update(params)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('influencer_profiles').insert({
          user_id: user.id,
          ...params,
        });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['influencer-profile'] });
      toast.success('Profile updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update profile: ' + error.message);
    },
  });
};

export const useClaimInfluencerCode = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (code: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const normalizedCode = code.trim().toUpperCase();

      // Find the link by code
      const { data: link, error: findError } = await supabase
        .from('influencer_links')
        .select('id, influencer_user_id')
        .eq('code', normalizedCode)
        .maybeSingle();

      if (findError) {
        throw new Error('Error finding influencer code');
      }

      if (!link) {
        throw new Error('Influencer code not found');
      }

      // Check if already claimed
      if (link.influencer_user_id === user.id) {
        throw new Error('You have already claimed this code');
      }

      if (link.influencer_user_id) {
        throw new Error('This code is already claimed by another influencer');
      }

      // Claim the link (only if still unclaimed). IMPORTANT: a successful request can still affect 0 rows.
      const { data: updatedLink, error: updateError } = await supabase
        .from('influencer_links')
        .update({ influencer_user_id: user.id })
        .eq('id', link.id)
        .is('influencer_user_id', null)
        .select(
          `
            *,
            contests:contest_id(title),
            events:event_id(title)
          `
        )
        .maybeSingle();

      if (updateError) throw updateError;

      // If 0 rows were updated, Supabase returns null data with no error.
      if (!updatedLink) {
        throw new Error('This code was already claimed. Please refresh and try another code.');
      }

      return updatedLink;
    },
    onSuccess: (updatedLink) => {
      if (!user?.id) return;

      // Update cached links immediately so the UI reflects the claim without waiting.
      queryClient.setQueryData(['influencer-links', user.id], (prev: any) => {
        const current = Array.isArray(prev) ? prev : [];
        if (current.some((l: any) => l.id === updatedLink.id)) return current;
        return [updatedLink, ...current];
      });

      queryClient.invalidateQueries({ queryKey: ['influencer-links', user.id] });
      queryClient.invalidateQueries({ queryKey: ['influencer-stats', user.id] });
      toast.success('Influencer code claimed successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};
