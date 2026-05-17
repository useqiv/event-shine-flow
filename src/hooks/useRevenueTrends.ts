import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { subDays, format } from 'date-fns';
import {
  getBaseAmountsByTransactionId,
  getConvenienceFeeSettings,
  resolveTicketBaseAmount,
  resolveVoteBaseAmount,
} from '@/lib/baseAmount';

interface DailyRevenue {
  date: string;
  tickets: number;
  votes: number;
  total: number;
}

export const useRevenueTrends = (days: number = 30, currency?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['revenue-trends', user?.id, days, currency],
    queryFn: async (): Promise<DailyRevenue[]> => {
      const startDate = subDays(new Date(), days);
      const convenienceFeeSettings = await getConvenienceFeeSettings();

      const { data: events } = await supabase
        .from('events')
        .select('id')
        .eq('organization_id', user!.id);

      const eventIds = events?.map((e) => e.id) || [];

      const { data: contests } = await supabase
        .from('contests')
        .select('id, vote_currency, vote_price')
        .eq('organization_id', user!.id);

      const filteredContests = currency
        ? contests?.filter((c) => c.vote_currency === currency)
        : contests;
      const contestIds = filteredContests?.map((c) => c.id) || [];

      const contestVotePriceMap: Record<string, number> = {};
      filteredContests?.forEach((c) => {
        contestVotePriceMap[c.id] = Number(c.vote_price) || 0;
      });

      const ticketsByDate: Record<string, number> = {};
      if (eventIds.length > 0) {
        const { data: ticketTypes } = await supabase
          .from('ticket_types')
          .select('id, currency, event_id, price')
          .in('event_id', eventIds);

        const filteredTicketTypes = currency
          ? ticketTypes?.filter((tt) => tt.currency === currency)
          : ticketTypes;
        const filteredTicketTypeIds = filteredTicketTypes?.map((tt) => tt.id) || [];
        const ticketTypePriceMap = new Map(
          (filteredTicketTypes || []).map((tt) => [tt.id, Number(tt.price) || 0])
        );

        if (filteredTicketTypeIds.length > 0) {
          const { data: tickets } = await supabase
            .from('tickets')
            .select(
              'amount_paid, net_amount, platform_commission, quantity, created_at, ticket_type_id, transaction_id'
            )
            .in('ticket_type_id', filteredTicketTypeIds)
            .gte('created_at', startDate.toISOString());

          const baseAmountMap = await getBaseAmountsByTransactionId(
            tickets?.map((t) => t.transaction_id) || []
          );

          tickets?.forEach((ticket) => {
            const dateKey = format(new Date(ticket.created_at), 'yyyy-MM-dd');
            const walletBaseAmount = ticket.transaction_id
              ? baseAmountMap.get(ticket.transaction_id)
              : undefined;
            const baseAmount = resolveTicketBaseAmount({
              transactionId: ticket.transaction_id,
              walletBaseAmount,
              amountPaid: ticket.amount_paid,
              netAmount: ticket.net_amount,
              platformCommission: ticket.platform_commission,
              quantity: ticket.quantity,
              ticketPrice: ticketTypePriceMap.get(ticket.ticket_type_id) ?? null,
              convenienceFeeSettings,
            });
            ticketsByDate[dateKey] = (ticketsByDate[dateKey] || 0) + baseAmount;
          });
        }
      }

      const votesByDate: Record<string, number> = {};
      if (contestIds.length > 0) {
        const [{ data: votes }, { data: voteOptions }] = await Promise.all([
          supabase
            .from('votes')
            .select(
              'amount_paid, net_amount, platform_commission, quantity, created_at, contest_id, transaction_id'
            )
            .in('contest_id', contestIds)
            .gte('created_at', startDate.toISOString()),
          supabase
            .from('contest_vote_options')
            .select('contest_id, vote_quantity, price')
            .in('contest_id', contestIds),
        ]);

        const voteOptionPriceMap = new Map<string, number>();
        voteOptions?.forEach((option) => {
          voteOptionPriceMap.set(
            `${option.contest_id}:${option.vote_quantity}`,
            Number(option.price) || 0
          );
        });

        const baseAmountMap = await getBaseAmountsByTransactionId(
          votes?.map((v) => v.transaction_id) || []
        );

        votes?.forEach((vote) => {
          const dateKey = format(new Date(vote.created_at), 'yyyy-MM-dd');
          const walletBaseAmount = vote.transaction_id
            ? baseAmountMap.get(vote.transaction_id)
            : undefined;
          const baseAmount = resolveVoteBaseAmount({
            transactionId: vote.transaction_id,
            walletBaseAmount,
            amountPaid: vote.amount_paid,
            netAmount: vote.net_amount,
            platformCommission: vote.platform_commission,
            quantity: vote.quantity,
            voteOptionPrice: voteOptionPriceMap.get(`${vote.contest_id}:${vote.quantity}`) ?? null,
            contestVotePrice: contestVotePriceMap[vote.contest_id] ?? null,
            convenienceFeeSettings,
          });
          votesByDate[dateKey] = (votesByDate[dateKey] || 0) + baseAmount;
        });
      }

      const dailyData: DailyRevenue[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dateKey = format(date, 'yyyy-MM-dd');
        const tickets = ticketsByDate[dateKey] || 0;
        const votes = votesByDate[dateKey] || 0;

        dailyData.push({
          date: format(date, 'MMM d'),
          tickets,
          votes,
          total: tickets + votes,
        });
      }

      return dailyData;
    },
    enabled: !!user,
  });
};
