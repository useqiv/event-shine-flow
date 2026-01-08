import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface PendingPayoutByCurrency {
  currency: string;
  totalAmount: number;
  count: number;
}

export const usePendingPayoutsByCurrency = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['pending-payouts-by-currency'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payouts')
        .select('currency, amount')
        .eq('status', 'pending');

      if (error) throw error;

      // Aggregate by currency
      const currencyMap: Record<string, { totalAmount: number; count: number }> = {};
      
      data?.forEach((payout) => {
        const currency = payout.currency || 'NGN';
        if (!currencyMap[currency]) {
          currencyMap[currency] = { totalAmount: 0, count: 0 };
        }
        currencyMap[currency].totalAmount += payout.amount || 0;
        currencyMap[currency].count += 1;
      });

      // Convert to array and sort by total amount
      const result: PendingPayoutByCurrency[] = Object.entries(currencyMap)
        .map(([currency, data]) => ({
          currency,
          ...data,
        }))
        .sort((a, b) => b.totalAmount - a.totalAmount);

      return result;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });
};
