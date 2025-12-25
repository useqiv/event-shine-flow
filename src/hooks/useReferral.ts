import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const REFERRAL_BONUS = 500; // ₦500 bonus for both referrer and referee

export const useApplyReferral = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, referralCode }: { userId: string; referralCode: string }) => {
      // Find the referrer by their referral code
      const { data: referrerWallet, error: referrerError } = await supabase
        .from('wallets')
        .select('id, user_id, balance, referral_earnings')
        .eq('referral_code', referralCode.toUpperCase())
        .maybeSingle();

      if (referrerError) throw referrerError;
      if (!referrerWallet) throw new Error('Invalid referral code');
      
      // Don't allow self-referral
      if (referrerWallet.user_id === userId) {
        throw new Error('Cannot use your own referral code');
      }

      // Get the new user's wallet
      const { data: newUserWallet, error: newUserError } = await supabase
        .from('wallets')
        .select('id, balance, referred_by')
        .eq('user_id', userId)
        .maybeSingle();

      if (newUserError) throw newUserError;
      if (!newUserWallet) throw new Error('Wallet not found');
      
      // Check if already referred
      if (newUserWallet.referred_by) {
        throw new Error('You have already used a referral code');
      }

      // Update new user's wallet with referral and bonus
      const { error: updateNewUserError } = await supabase
        .from('wallets')
        .update({
          referred_by: referrerWallet.user_id,
          balance: Number(newUserWallet.balance) + REFERRAL_BONUS
        })
        .eq('id', newUserWallet.id);

      if (updateNewUserError) throw updateNewUserError;

      // Create transaction for new user
      await supabase
        .from('wallet_transactions')
        .insert({
          wallet_id: newUserWallet.id,
          user_id: userId,
          type: 'referral',
          amount: REFERRAL_BONUS,
          description: 'Referral signup bonus',
          status: 'completed'
        });

      // Update referrer's wallet with earnings
      const { error: updateReferrerError } = await supabase
        .from('wallets')
        .update({
          balance: Number(referrerWallet.balance) + REFERRAL_BONUS,
          referral_earnings: Number(referrerWallet.referral_earnings) + REFERRAL_BONUS
        })
        .eq('id', referrerWallet.id);

      if (updateReferrerError) throw updateReferrerError;

      // Create transaction for referrer
      await supabase
        .from('wallet_transactions')
        .insert({
          wallet_id: referrerWallet.id,
          user_id: referrerWallet.user_id,
          type: 'referral',
          amount: REFERRAL_BONUS,
          description: 'Referral bonus earned',
          status: 'completed'
        });

      // Create notification for referrer
      await supabase
        .from('notifications')
        .insert({
          user_id: referrerWallet.user_id,
          title: 'Referral Bonus!',
          message: `You earned ₦${REFERRAL_BONUS} from a successful referral!`,
          type: 'wallet'
        });

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
    },
  });
};
