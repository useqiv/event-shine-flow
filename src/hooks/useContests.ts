import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { queryCache, selectColumns } from '@/lib/queryConfig';

export interface Contest {
  id: string;
  title: string;
  description: string | null;
  category: string;
  image_url: string | null;
  start_date: string;
  end_date: string;
  vote_price: number;
  vote_currency: string;
  is_active: boolean;
  is_featured: boolean;
  total_votes: number;
  created_at: string;
  updated_at: string;
}

export interface Contestant {
  id: string;
  contest_id: string;
  name: string;
  bio: string | null;
  photo_url: string | null;
  performance: string | null;
  vote_count: number;
  is_public_votes: boolean;
  created_at: string;
  updated_at: string;
}

export interface Vote {
  id: string;
  user_id: string;
  contestant_id: string;
  contest_id: string;
  quantity: number;
  amount_paid: number;
  payment_method: string;
  created_at: string;
}

export const useContests = () => {
  return useQuery({
    queryKey: ['contests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contests')
        .select(selectColumns.contestCard)
        .eq('is_active', true)
        .gte('end_date', new Date().toISOString())
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Contest[];
    },
    ...queryCache.publicListing,
  });
};

export const useFeaturedContests = () => {
  return useQuery({
    queryKey: ['featured-contests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contests')
        .select(selectColumns.contestCard)
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data as Contest[];
    },
    ...queryCache.publicListing,
  });
};

export const useContest = (contestId: string) => {
  return useQuery({
    queryKey: ['contest', contestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contests')
        .select(selectColumns.contestDetail)
        .eq('id', contestId)
        .maybeSingle();
      
      if (error) throw error;
      return data as Contest | null;
    },
    enabled: !!contestId,
    ...queryCache.moderate,
  });
};

export const useContestants = (contestId: string) => {
  return useQuery({
    queryKey: ['contestants', contestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contestants')
        .select(selectColumns.contestantCard)
        .eq('contest_id', contestId)
        .order('vote_count', { ascending: false });
      
      if (error) throw error;
      return data as Contestant[];
    },
    enabled: !!contestId,
    ...queryCache.dynamic, // Vote counts change frequently
  });
};

export const useContestant = (contestantId: string) => {
  return useQuery({
    queryKey: ['contestant', contestantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contestants')
        .select('id, name, bio, photo_url, vote_count, contest_id, is_public_votes, performance, created_at, updated_at')
        .eq('id', contestantId)
        .single();
      
      if (error) throw error;
      return data as Contestant;
    },
    enabled: !!contestantId,
    ...queryCache.dynamic,
  });
};

export const useMyVotes = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-votes', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('votes')
        .select(`
          *,
          contestant:contestants(*, category:contest_categories(*)),
          contest:contests(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
};

export const useMyContestVotes = (contestId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-contest-votes', contestId, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('votes')
        .select(`
          *,
          contestant:contestants(id, name, photo_url)
        `)
        .eq('user_id', user.id)
        .eq('contest_id', contestId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && !!contestId,
  });
};

export const useVote = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      contestantId,
      contestId,
      quantity,
      amountPaid,
      currency,
      paymentMethod
    }: {
      contestantId: string;
      contestId: string;
      quantity: number;
      amountPaid: number;
      currency?: string;
      paymentMethod: 'wallet' | 'card' | 'bank_transfer' | 'usdt';
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      // If paying with wallet, deduct balance
      if (paymentMethod === 'wallet') {
        const { data: wallet, error: walletError } = await supabase
          .from('wallets')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (walletError) throw walletError;
        if (Number(wallet.balance) < amountPaid) {
          throw new Error('Insufficient wallet balance');
        }

        // Create wallet transaction
        await supabase
          .from('wallet_transactions')
          .insert({
            wallet_id: wallet.id,
            user_id: user.id,
            type: 'vote',
            amount: -amountPaid,
            description: `Vote for contestant`,
            status: 'completed'
          });

        // Update wallet balance
        await supabase
          .from('wallets')
          .update({ balance: Number(wallet.balance) - amountPaid })
          .eq('id', wallet.id);
      }

      // Create vote record
      const { data, error } = await supabase
        .from('votes')
        .insert({
          user_id: user.id,
          contestant_id: contestantId,
          contest_id: contestId,
          quantity,
          amount_paid: amountPaid,
          currency: currency || 'NGN',
          payment_method: paymentMethod
        })
        .select()
        .single();

      if (error) throw error;

      // Send organization transaction notification
      try {
        const { data: contest } = await supabase
          .from('contests')
          .select('organization_id, title')
          .eq('id', contestId)
          .single();

        const { data: contestant } = await supabase
          .from('contestants')
          .select('name')
          .eq('id', contestantId)
          .single();

        if (contest?.organization_id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', user.id)
            .single();

          await supabase.functions.invoke('send-org-transaction-notification', {
            body: {
              type: 'vote',
              organization_id: contest.organization_id,
              amount: amountPaid,
              currency: currency || 'NGN',
              quantity,
              contest_title: contest.title || 'Contest',
              contestant_name: contestant?.name || 'Contestant',
              voter_name: profile?.full_name || 'Anonymous',
              voter_email: profile?.email || user.email || '',
            }
          });
        }
      } catch (notifError) {
        console.error('Failed to send org transaction notification:', notifError);
      }

      // Create notification
      await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          title: 'Vote Successful!',
          message: `You have successfully cast ${quantity} vote(s).`,
          type: 'vote'
        });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contestants'] });
      queryClient.invalidateQueries({ queryKey: ['contest'] });
      queryClient.invalidateQueries({ queryKey: ['my-votes'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};
