import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/components/ui/currency-selector';
import {
  getBaseAmountsByTransactionId,
  getConvenienceFeeSettings,
  resolveTicketBaseAmount,
  resolveVoteBaseAmount,
  stripConvenienceFeeFromGross,
} from '@/lib/baseAmount';
import { Trophy, Calendar, TrendingUp, Crown, Heart } from 'lucide-react';

interface TopPerformer {
  id: string;
  title: string;
  type: 'contest' | 'event' | 'campaign';
  revenue: number;
  currency: string;
  itemCount: number;
  itemLabel: string;
}

const TopPerformersWidget = () => {
  const { user } = useAuth();

  const { data: topPerformers, isLoading } = useQuery({
    queryKey: ['top-performers', user?.id],
    queryFn: async (): Promise<TopPerformer[]> => {
      const convenienceFeeSettings = await getConvenienceFeeSettings();

      const { data: contests } = await supabase
        .from('contests')
        .select('id, title, vote_currency, vote_price')
        .eq('organization_id', user!.id);

      const contestIds = contests?.map((c) => c.id) || [];
      const contestVotePriceMap: Record<string, number> = {};
      contests?.forEach((c) => {
        contestVotePriceMap[c.id] = Number(c.vote_price) || 0;
      });

      const contestRevenues: TopPerformer[] = [];
      if (contestIds.length > 0) {
        const [{ data: votes }, { data: voteOptions }] = await Promise.all([
          supabase
            .from('votes')
            .select(
              'contest_id, amount_paid, net_amount, platform_commission, quantity, transaction_id'
            )
            .in('contest_id', contestIds),
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

        const revenueMap: Record<string, { revenue: number; votes: number }> = {};
        const baseAmountMap = await getBaseAmountsByTransactionId(
          votes?.map((v) => v.transaction_id) || []
        );

        votes?.forEach((v) => {
          if (!revenueMap[v.contest_id]) {
            revenueMap[v.contest_id] = { revenue: 0, votes: 0 };
          }
          const walletBaseAmount = v.transaction_id
            ? baseAmountMap.get(v.transaction_id)
            : undefined;
          const baseAmount = resolveVoteBaseAmount({
            transactionId: v.transaction_id,
            walletBaseAmount,
            amountPaid: v.amount_paid,
            netAmount: v.net_amount,
            platformCommission: v.platform_commission,
            quantity: v.quantity,
            voteOptionPrice: voteOptionPriceMap.get(`${v.contest_id}:${v.quantity}`) ?? null,
            contestVotePrice: contestVotePriceMap[v.contest_id] ?? null,
            convenienceFeeSettings,
          });
          revenueMap[v.contest_id].revenue += baseAmount;
          revenueMap[v.contest_id].votes += v.quantity;
        });

        contests?.forEach((c) => {
          const data = revenueMap[c.id] || { revenue: 0, votes: 0 };
          if (data.revenue > 0) {
            contestRevenues.push({
              id: c.id,
              title: c.title,
              type: 'contest',
              revenue: data.revenue,
              currency: c.vote_currency || 'USD',
              itemCount: data.votes,
              itemLabel: 'votes',
            });
          }
        });
      }

      const { data: events } = await supabase
        .from('events')
        .select('id, title')
        .eq('organization_id', user!.id);

      const eventIds = events?.map((e) => e.id) || [];

      const eventRevenues: TopPerformer[] = [];
      if (eventIds.length > 0) {
        const { data: ticketTypes } = await supabase
          .from('ticket_types')
          .select('id, event_id, currency, price')
          .in('event_id', eventIds);

        const ticketTypeCurrencyMap: Record<string, string> = {};
        const ticketTypePriceMap = new Map<string, number>();
        ticketTypes?.forEach((tt) => {
          ticketTypeCurrencyMap[tt.id] = tt.currency || 'USD';
          ticketTypePriceMap.set(tt.id, Number(tt.price) || 0);
        });

        const { data: tickets } = await supabase
          .from('tickets')
          .select(
            'event_id, amount_paid, net_amount, platform_commission, quantity, ticket_type_id, transaction_id'
          )
          .in('event_id', eventIds);

        const revenueMap: Record<string, { revenue: number; tickets: number; currency: string }> =
          {};
        const baseAmountMap = await getBaseAmountsByTransactionId(
          tickets?.map((t) => t.transaction_id) || []
        );

        tickets?.forEach((t) => {
          if (!revenueMap[t.event_id]) {
            revenueMap[t.event_id] = {
              revenue: 0,
              tickets: 0,
              currency: ticketTypeCurrencyMap[t.ticket_type_id] || 'USD',
            };
          }
          const walletBaseAmount = t.transaction_id
            ? baseAmountMap.get(t.transaction_id)
            : undefined;
          const baseAmount = resolveTicketBaseAmount({
            transactionId: t.transaction_id,
            walletBaseAmount,
            amountPaid: t.amount_paid,
            netAmount: t.net_amount,
            platformCommission: t.platform_commission,
            quantity: t.quantity,
            ticketPrice: ticketTypePriceMap.get(t.ticket_type_id) ?? null,
            convenienceFeeSettings,
          });
          revenueMap[t.event_id].revenue += baseAmount;
          revenueMap[t.event_id].tickets += t.quantity;
        });

        events?.forEach((e) => {
          const data = revenueMap[e.id] || { revenue: 0, tickets: 0, currency: 'USD' };
          if (data.revenue > 0) {
            eventRevenues.push({
              id: e.id,
              title: e.title,
              type: 'event',
              revenue: data.revenue,
              currency: data.currency,
              itemCount: data.tickets,
              itemLabel: 'tickets',
            });
          }
        });
      }

      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('id, title, currency')
        .eq('creator_id', user!.id);

      const campaignIds = campaigns?.map((c) => c.id) || [];
      const campaignRevenues: TopPerformer[] = [];

      if (campaignIds.length > 0) {
        const { data: donations } = await supabase
          .from('donations')
          .select('campaign_id, amount, net_amount, platform_commission, transaction_id')
          .in('campaign_id', campaignIds)
          .eq('status', 'completed');

        const campaignTitleMap = new Map(campaigns?.map((c) => [c.id, c.title]) || []);
        const campaignCurrencyMap = new Map(campaigns?.map((c) => [c.id, c.currency || 'USD']) || []);
        const revenueMap: Record<string, { revenue: number; donations: number }> = {};
        const baseAmountMap = await getBaseAmountsByTransactionId(
          donations?.map((d) => d.transaction_id) || [],
        );

        donations?.forEach((d) => {
          if (!revenueMap[d.campaign_id]) {
            revenueMap[d.campaign_id] = { revenue: 0, donations: 0 };
          }
          const netAmount = Number(d.net_amount);
          const platformCommission = Number(d.platform_commission);
          const settledBaseAmount =
            Number.isFinite(netAmount) && Number.isFinite(platformCommission)
              ? netAmount + platformCommission
              : 0;
          const normalizedSettledAmount = stripConvenienceFeeFromGross(
            settledBaseAmount,
            convenienceFeeSettings,
          );
          const normalizedRecordedAmount = stripConvenienceFeeFromGross(
            Number(d.amount) || 0,
            convenienceFeeSettings,
          );
          const baseAmount =
            baseAmountMap.get(d.transaction_id) ??
            normalizedSettledAmount ??
            normalizedRecordedAmount ??
            0;
          revenueMap[d.campaign_id].revenue += Number(baseAmount) || 0;
          revenueMap[d.campaign_id].donations += 1;
        });

        campaignIds.forEach((id) => {
          const data = revenueMap[id] || { revenue: 0, donations: 0 };
          if (data.revenue > 0) {
            campaignRevenues.push({
              id,
              title: campaignTitleMap.get(id) || 'Campaign',
              type: 'campaign',
              revenue: data.revenue,
              currency: campaignCurrencyMap.get(id) || 'USD',
              itemCount: data.donations,
              itemLabel: 'donations',
            });
          }
        });
      }

      const allPerformers = [...contestRevenues, ...eventRevenues, ...campaignRevenues];
      allPerformers.sort((a, b) => b.revenue - a.revenue);

      return allPerformers.slice(0, 5);
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Top Performers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!topPerformers || topPerformers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Top Performers
          </CardTitle>
          <CardDescription>Your highest revenue contests, events, and campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <TrendingUp className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>No revenue data yet</p>
            <p className="text-sm">Start selling to see top performers</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5" />
          Top Performers
        </CardTitle>
        <CardDescription>Your highest revenue contests, events, and campaigns</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {topPerformers.map((item, index) => {
            const href =
              item.type === 'contest'
                ? `/org/contests/${item.id}`
                : item.type === 'event'
                  ? `/org/events/${item.id}`
                  : `/org/campaigns/${item.id}/analytics`;

            return (
            <Link
              key={item.id}
              to={href}
              className="block"
            >
              <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors min-w-0">
                <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 text-primary font-bold text-xs sm:text-sm shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {item.type === 'contest' ? (
                      <Trophy className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    ) : item.type === 'event' ? (
                      <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <Heart className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    )}
                    <p className="font-medium truncate">{item.title}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {item.itemCount.toLocaleString()} {item.itemLabel}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold text-green-600 dark:text-green-400 text-xs sm:text-sm">
                    {formatCurrency(item.revenue, item.currency)}
                  </p>
                  <Badge variant="outline" className="text-[10px] sm:text-xs">
                    {item.type}
                  </Badge>
                </div>
              </div>
            </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default TopPerformersWidget;
