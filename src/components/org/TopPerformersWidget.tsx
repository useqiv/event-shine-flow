import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/components/ui/currency-selector';
import { getBaseAmountsByTransactionId } from '@/lib/baseAmount';
import { Trophy, Calendar, TrendingUp, Crown } from 'lucide-react';

interface TopPerformer {
  id: string;
  title: string;
  type: 'contest' | 'event';
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
      // Fetch contests with their revenue
      const { data: contests } = await supabase
        .from('contests')
        .select('id, title, vote_currency')
        .eq('organization_id', user!.id);

      const contestIds = contests?.map(c => c.id) || [];
      
      // Fetch votes for contests
      const contestRevenues: TopPerformer[] = [];
      if (contestIds.length > 0) {
        const { data: votes } = await supabase
          .from('votes')
          .select('contest_id, amount_paid, quantity, transaction_id')
          .in('contest_id', contestIds);

        const revenueMap: Record<string, { revenue: number; votes: number }> = {};
        const baseAmountMap = await getBaseAmountsByTransactionId(votes?.map((v: any) => v.transaction_id) || []);
        votes?.forEach(v => {
          if (!revenueMap[v.contest_id]) {
            revenueMap[v.contest_id] = { revenue: 0, votes: 0 };
          }
          const baseAmount = baseAmountMap.get(v.transaction_id) ?? 0;
          revenueMap[v.contest_id].revenue += Number(baseAmount);
          revenueMap[v.contest_id].votes += v.quantity;
        });

        contests?.forEach(c => {
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

      // Fetch events with their revenue
      const { data: events } = await supabase
        .from('events')
        .select('id, title')
        .eq('organization_id', user!.id);

      const eventIds = events?.map(e => e.id) || [];
      
      const eventRevenues: TopPerformer[] = [];
      if (eventIds.length > 0) {
        // Get ticket types with currency
        const { data: ticketTypes } = await supabase
          .from('ticket_types')
          .select('id, event_id, currency')
          .in('event_id', eventIds);

        const ticketTypeCurrencyMap: Record<string, string> = {};
        ticketTypes?.forEach(tt => {
          ticketTypeCurrencyMap[tt.id] = tt.currency || 'USD';
        });

        // Get tickets
        const { data: tickets } = await supabase
          .from('tickets')
          .select('event_id, amount_paid, quantity, ticket_type_id, transaction_id')
          .in('event_id', eventIds);

        const revenueMap: Record<string, { revenue: number; tickets: number; currency: string }> = {};
        const baseAmountMap = await getBaseAmountsByTransactionId(tickets?.map((t: any) => t.transaction_id) || []);
        tickets?.forEach(t => {
          if (!revenueMap[t.event_id]) {
            revenueMap[t.event_id] = { revenue: 0, tickets: 0, currency: ticketTypeCurrencyMap[t.ticket_type_id] || 'USD' };
          }
          const baseAmount = baseAmountMap.get(t.transaction_id) ?? 0;
          revenueMap[t.event_id].revenue += Number(baseAmount);
          revenueMap[t.event_id].tickets += t.quantity;
        });

        events?.forEach(e => {
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

      // Combine and sort by revenue (descending)
      const allPerformers = [...contestRevenues, ...eventRevenues];
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
          <CardDescription>Your highest revenue contests and events</CardDescription>
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
        <CardDescription>Your highest revenue contests and events</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {topPerformers.map((item, index) => (
            <Link 
              key={item.id} 
              to={item.type === 'contest' ? `/org/contests/${item.id}` : `/org/events/${item.id}`}
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
                    ) : (
                      <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
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
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TopPerformersWidget;
