import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  balance_currency: string;
  referral_earnings: number;
  referral_code: string;
  referred_by: string | null;
  low_balance_threshold: number | null;
  created_at: string;
  updated_at: string;
}

export interface WalletCurrencyBalance {
  id: string;
  wallet_id: string;
  currency: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  user_id: string;
  type: 'deposit' | 'withdrawal' | 'vote' | 'ticket' | 'referral' | 'voucher';
  amount: number;
  currency: string;
  description: string | null;
  reference_id: string | null;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

export const useWallet = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['wallet', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Wallet | null;
    },
    enabled: !!user?.id,
  });
};

// Fetch multi-currency balances for the wallet
export const useWalletCurrencyBalances = () => {
  const { user } = useAuth();
  const { data: wallet } = useWallet();

  return useQuery({
    queryKey: ['wallet-currency-balances', wallet?.id],
    queryFn: async () => {
      if (!wallet?.id) return [];
      
      const { data, error } = await supabase
        .from('wallet_currency_balances')
        .select('*')
        .eq('wallet_id', wallet.id)
        .order('balance', { ascending: false });
      
      if (error) throw error;
      return data as WalletCurrencyBalance[];
    },
    enabled: !!wallet?.id,
  });
};

export const useWalletTransactions = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['wallet-transactions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as WalletTransaction[];
    },
    enabled: !!user?.id,
  });
};

export const useFundWallet = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ amount, paymentMethod }: { amount: number; paymentMethod: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Get wallet
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (walletError) throw walletError;

      // Create transaction
      const { data: transaction, error: txError } = await supabase
        .from('wallet_transactions')
        .insert({
          wallet_id: wallet.id,
          user_id: user.id,
          type: 'deposit',
          amount,
          description: `Wallet funded via ${paymentMethod}`,
          status: 'completed'
        })
        .select()
        .single();

      if (txError) throw txError;

      // Update wallet balance
      const { error: updateError } = await supabase
        .from('wallets')
        .update({ balance: Number(wallet.balance) + amount })
        .eq('id', wallet.id);

      if (updateError) throw updateError;

      return transaction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
    },
  });
};

export const useRedeemVoucher = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (voucherCode: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Get voucher
      const { data: voucher, error: voucherError } = await supabase
        .from('vouchers')
        .select('*')
        .eq('code', voucherCode.toUpperCase())
        .eq('is_used', false)
        .maybeSingle();

      if (voucherError) throw voucherError;
      if (!voucher) throw new Error('Invalid or expired voucher');

      // Get wallet
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (walletError) throw walletError;

      // Mark voucher as used
      const { error: updateVoucherError } = await supabase
        .from('vouchers')
        .update({ is_used: true, used_by: user.id })
        .eq('id', voucher.id);

      if (updateVoucherError) throw updateVoucherError;

      // Create transaction
      await supabase
        .from('wallet_transactions')
        .insert({
          wallet_id: wallet.id,
          user_id: user.id,
          type: 'voucher',
          amount: voucher.amount,
          description: `Voucher redeemed: ${voucherCode}`,
          status: 'completed'
        });

      // Update wallet balance
      await supabase
        .from('wallets')
        .update({ balance: Number(wallet.balance) + Number(voucher.amount) })
        .eq('id', wallet.id);

      return voucher;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
    },
  });
};

export const useUpdateLowBalanceThreshold = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (threshold: number | null) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('wallets')
        .update({ low_balance_threshold: threshold })
        .eq('user_id', user.id);

      if (error) throw error;
      return threshold;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
  });
};
