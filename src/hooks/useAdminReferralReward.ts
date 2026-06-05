import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RewardParams {
  userId: string;
  amount: number;
  reason: string;
  currency?: string;
}

export const useAdminRewardReferral = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, amount, reason, currency = 'NGN' }: RewardParams) => {
      const { data: result, error } = await supabase.rpc('credit_wallet_safely', {
        p_user_id: userId,
        p_amount: amount,
        p_currency: currency,
        p_type: 'referral',
        p_description: `Admin reward: ${reason}`,
        p_reference_id: null,
        p_update_referral_earnings: true,
      });

      if (error) throw error;

      const credit = result as { success?: boolean; error?: string };
      if (!credit?.success) {
        throw new Error(credit?.error || 'Failed to credit wallet');
      }

      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title: 'Referral Reward!',
          message: `You received a ${currency} ${amount.toLocaleString()} referral reward! ${reason}`,
          type: 'wallet',
        });

      if (notifError) throw notifError;

      return { success: true };
    },
    onSuccess: () => {
      toast.success('Referral reward sent successfully!');
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-currency-balances'] });
      queryClient.invalidateQueries({ queryKey: ['referral-leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send reward');
    },
  });
};
