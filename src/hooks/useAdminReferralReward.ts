import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RewardParams {
  userId: string;
  amount: number;
  reason: string;
}

export const useAdminRewardReferral = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, amount, reason }: RewardParams) => {
      // Get the user's wallet
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('id, balance, referral_earnings')
        .eq('user_id', userId)
        .maybeSingle();

      if (walletError) throw walletError;
      if (!wallet) throw new Error('Wallet not found for user');

      // Update wallet balance and referral earnings
      const { error: updateError } = await supabase
        .from('wallets')
        .update({
          balance: Number(wallet.balance) + amount,
          referral_earnings: Number(wallet.referral_earnings) + amount,
        })
        .eq('id', wallet.id);

      if (updateError) throw updateError;

      // Create wallet transaction
      const { error: txError } = await supabase
        .from('wallet_transactions')
        .insert({
          wallet_id: wallet.id,
          user_id: userId,
          type: 'referral',
          amount: amount,
          description: `Admin reward: ${reason}`,
          status: 'completed',
        });

      if (txError) throw txError;

      // Create notification for user
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title: 'Referral Reward!',
          message: `You received a ₦${amount.toLocaleString()} referral bonus! ${reason}`,
          type: 'wallet',
        });

      if (notifError) throw notifError;

      return { success: true };
    },
    onSuccess: () => {
      toast.success('Referral reward sent successfully!');
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['referral-leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send reward');
    },
  });
};
