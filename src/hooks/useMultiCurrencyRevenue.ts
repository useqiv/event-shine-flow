import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface CurrencyRevenue {
  currency: string;
  voteRevenue: number;
  voteCount: number;
  ticketRevenue: number;
  ticketCount: number;
  donationRevenue: number;
  donationCount: number;
  totalRevenue: number;
  totalTransactions: number;
}

export const useMultiCurrencyRevenue = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['admin-multi-currency-revenue'],
    queryFn: async (): Promise<CurrencyRevenue[]> => {
      // Fetch vote revenue by currency (from contest's vote_currency)
      const { data: voteData, error: voteError } = await supabase
        .from('votes')
        .select(`
          amount_paid,
          contests!inner(vote_currency)
        `);

      if (voteError) throw voteError;

      // Fetch ticket revenue by currency (from event's currency)
      // Include active, confirmed, and used tickets (exclude cancelled/refunded)
      const { data: ticketData, error: ticketError } = await supabase
        .from('tickets')
        .select(`
          amount_paid,
          status,
          events!inner(currency)
        `)
        .in('status', ['active', 'confirmed', 'used']);

      if (ticketError) throw ticketError;

      // Fetch donation revenue by currency
      const { data: donationData, error: donationError } = await supabase
        .from('donations')
        .select('amount, currency, status')
        .eq('status', 'completed');

      if (donationError) throw donationError;

      // Aggregate by currency
      const currencyMap: Record<string, CurrencyRevenue> = {};

      // Process votes
      voteData?.forEach((vote: any) => {
        const currency = vote.contests?.vote_currency || 'NGN';
        if (!currencyMap[currency]) {
          currencyMap[currency] = {
            currency,
            voteRevenue: 0,
            voteCount: 0,
            ticketRevenue: 0,
            ticketCount: 0,
            donationRevenue: 0,
            donationCount: 0,
            totalRevenue: 0,
            totalTransactions: 0,
          };
        }
        currencyMap[currency].voteRevenue += Number(vote.amount_paid) || 0;
        currencyMap[currency].voteCount += 1;
      });

      // Process tickets
      ticketData?.forEach((ticket: any) => {
        const currency = ticket.events?.currency || 'NGN';
        if (!currencyMap[currency]) {
          currencyMap[currency] = {
            currency,
            voteRevenue: 0,
            voteCount: 0,
            ticketRevenue: 0,
            ticketCount: 0,
            donationRevenue: 0,
            donationCount: 0,
            totalRevenue: 0,
            totalTransactions: 0,
          };
        }
        currencyMap[currency].ticketRevenue += Number(ticket.amount_paid) || 0;
        currencyMap[currency].ticketCount += 1;
      });

      // Process donations
      donationData?.forEach((donation: any) => {
        const currency = donation.currency || 'USD';
        if (!currencyMap[currency]) {
          currencyMap[currency] = {
            currency,
            voteRevenue: 0,
            voteCount: 0,
            ticketRevenue: 0,
            ticketCount: 0,
            donationRevenue: 0,
            donationCount: 0,
            totalRevenue: 0,
            totalTransactions: 0,
          };
        }
        currencyMap[currency].donationRevenue += Number(donation.amount) || 0;
        currencyMap[currency].donationCount += 1;
      });

      // Calculate totals
      Object.values(currencyMap).forEach((item) => {
        item.totalRevenue = item.voteRevenue + item.ticketRevenue + item.donationRevenue;
        item.totalTransactions = item.voteCount + item.ticketCount + item.donationCount;
      });

      // Sort by total revenue descending
      return Object.values(currencyMap).sort((a, b) => b.totalRevenue - a.totalRevenue);
    },
    enabled: !!user,
    refetchInterval: 60000, // Refresh every minute
  });
};
