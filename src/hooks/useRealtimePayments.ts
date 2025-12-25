import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useRealtimePayments = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Subscribe to new votes
    const votesChannel = supabase
      .channel('admin-votes-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'votes'
        },
        (payload) => {
          console.log('New vote received:', payload);
          // Invalidate queries to refetch data
          queryClient.invalidateQueries({ queryKey: ['admin-votes'] });
          queryClient.invalidateQueries({ queryKey: ['admin-statistics'] });
          
          const vote = payload.new as any;
          toast.success('New Vote Payment', {
            description: `${vote.quantity} vote(s) - ₦${vote.amount_paid?.toLocaleString()}`,
          });
        }
      )
      .subscribe();

    // Subscribe to new tickets
    const ticketsChannel = supabase
      .channel('admin-tickets-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tickets'
        },
        (payload) => {
          console.log('New ticket received:', payload);
          // Invalidate queries to refetch data
          queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
          queryClient.invalidateQueries({ queryKey: ['admin-statistics'] });
          
          const ticket = payload.new as any;
          toast.success('New Ticket Purchase', {
            description: `${ticket.quantity} ticket(s) - ₦${ticket.amount_paid?.toLocaleString()}`,
          });
        }
      )
      .subscribe();

    // Subscribe to wallet transactions for pending payments
    const walletChannel = supabase
      .channel('admin-wallet-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallet_transactions'
        },
        (payload) => {
          console.log('Wallet transaction update:', payload);
          queryClient.invalidateQueries({ queryKey: ['admin-wallet-transactions'] });
          queryClient.invalidateQueries({ queryKey: ['pending-crypto-payments'] });
          
          if (payload.eventType === 'INSERT') {
            const tx = payload.new as any;
            if (tx.type === 'crypto_payment' && tx.status === 'pending') {
              toast.info('New Crypto Payment Pending', {
                description: `Verification required - $${tx.amount}`,
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(votesChannel);
      supabase.removeChannel(ticketsChannel);
      supabase.removeChannel(walletChannel);
    };
  }, [queryClient]);
};

// Hook for user-facing real-time updates
export const useRealtimeUserPayments = (userId: string | undefined) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`user-payments-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'votes',
          filter: `user_id=eq.${userId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['my-votes'] });
          toast.success('Vote Confirmed!', {
            description: 'Your vote has been recorded successfully.',
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tickets',
          filter: `user_id=eq.${userId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
          toast.success('Ticket Confirmed!', {
            description: 'Your ticket purchase has been confirmed.',
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
};
