import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus, ArrowRightLeft } from 'lucide-react';
import { subDays, subMonths, startOfDay, endOfDay, format } from 'date-fns';

type Period = '7d' | '30d' | '90d';

interface PeriodStats {
  votes: number;
  tickets: number;
  revenue: number;
  users: number;
}

const DashboardComparisonWidget: React.FC = () => {
  const [period, setPeriod] = useState<Period>('7d');

  const getPeriodDates = (p: Period) => {
    const now = new Date();
    let days = 7;
    if (p === '30d') days = 30;
    if (p === '90d') days = 90;
    
    return {
      current: {
        start: startOfDay(subDays(now, days)),
        end: endOfDay(now),
      },
      previous: {
        start: startOfDay(subDays(now, days * 2)),
        end: endOfDay(subDays(now, days + 1)),
      }
    };
  };

  const { data, isLoading } = useQuery({
    queryKey: ['admin-comparison', period],
    queryFn: async () => {
      const dates = getPeriodDates(period);
      
      // Current period stats
      const [currentVotes, currentTickets, currentUsers] = await Promise.all([
        supabase
          .from('votes')
          .select('amount_paid')
          .gte('created_at', dates.current.start.toISOString())
          .lte('created_at', dates.current.end.toISOString()),
        supabase
          .from('tickets')
          .select('amount_paid')
          .gte('created_at', dates.current.start.toISOString())
          .lte('created_at', dates.current.end.toISOString()),
        supabase
          .from('profiles')
          .select('id')
          .gte('created_at', dates.current.start.toISOString())
          .lte('created_at', dates.current.end.toISOString()),
      ]);

      // Previous period stats
      const [previousVotes, previousTickets, previousUsers] = await Promise.all([
        supabase
          .from('votes')
          .select('amount_paid')
          .gte('created_at', dates.previous.start.toISOString())
          .lte('created_at', dates.previous.end.toISOString()),
        supabase
          .from('tickets')
          .select('amount_paid')
          .gte('created_at', dates.previous.start.toISOString())
          .lte('created_at', dates.previous.end.toISOString()),
        supabase
          .from('profiles')
          .select('id')
          .gte('created_at', dates.previous.start.toISOString())
          .lte('created_at', dates.previous.end.toISOString()),
      ]);

      const currentStats: PeriodStats = {
        votes: currentVotes.data?.length || 0,
        tickets: currentTickets.data?.length || 0,
        revenue: (currentVotes.data?.reduce((sum, v) => sum + (v.amount_paid || 0), 0) || 0) +
                 (currentTickets.data?.reduce((sum, t) => sum + (t.amount_paid || 0), 0) || 0),
        users: currentUsers.data?.length || 0,
      };

      const previousStats: PeriodStats = {
        votes: previousVotes.data?.length || 0,
        tickets: previousTickets.data?.length || 0,
        revenue: (previousVotes.data?.reduce((sum, v) => sum + (v.amount_paid || 0), 0) || 0) +
                 (previousTickets.data?.reduce((sum, t) => sum + (t.amount_paid || 0), 0) || 0),
        users: previousUsers.data?.length || 0,
      };

      return { current: currentStats, previous: previousStats, dates };
    },
    refetchInterval: 60000,
  });

  const getChangePercent = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const renderTrend = (current: number, previous: number) => {
    const change = getChangePercent(current, previous);
    if (change > 0) {
      return (
        <div className="flex items-center gap-1 text-green-600">
          <TrendingUp className="h-3 w-3" />
          <span className="text-xs font-medium">+{change}%</span>
        </div>
      );
    } else if (change < 0) {
      return (
        <div className="flex items-center gap-1 text-destructive">
          <TrendingDown className="h-3 w-3" />
          <span className="text-xs font-medium">{change}%</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 text-muted-foreground">
        <Minus className="h-3 w-3" />
        <span className="text-xs font-medium">0%</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-9 w-32" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const metrics = [
    { 
      label: 'Revenue', 
      current: formatCurrency(data?.current.revenue || 0),
      previous: formatCurrency(data?.previous.revenue || 0),
      change: getChangePercent(data?.current.revenue || 0, data?.previous.revenue || 0),
      rawCurrent: data?.current.revenue || 0,
      rawPrevious: data?.previous.revenue || 0,
    },
    { 
      label: 'Votes', 
      current: data?.current.votes?.toLocaleString() || '0',
      previous: data?.previous.votes?.toLocaleString() || '0',
      change: getChangePercent(data?.current.votes || 0, data?.previous.votes || 0),
      rawCurrent: data?.current.votes || 0,
      rawPrevious: data?.previous.votes || 0,
    },
    { 
      label: 'Tickets', 
      current: data?.current.tickets?.toLocaleString() || '0',
      previous: data?.previous.tickets?.toLocaleString() || '0',
      change: getChangePercent(data?.current.tickets || 0, data?.previous.tickets || 0),
      rawCurrent: data?.current.tickets || 0,
      rawPrevious: data?.previous.tickets || 0,
    },
    { 
      label: 'New Users', 
      current: data?.current.users?.toLocaleString() || '0',
      previous: data?.previous.users?.toLocaleString() || '0',
      change: getChangePercent(data?.current.users || 0, data?.previous.users || 0),
      rawCurrent: data?.current.users || 0,
      rawPrevious: data?.previous.users || 0,
    },
  ];

  const periodLabels: Record<Period, string> = {
    '7d': 'Last 7 days',
    '30d': 'Last 30 days',
    '90d': 'Last 90 days',
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Period Comparison</CardTitle>
          </div>
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <CardDescription>
          Compare {periodLabels[period]} vs previous {period.replace('d', '')} days
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
                {renderTrend(metric.rawCurrent, metric.rawPrevious)}
              </div>
              <div>
                <p className="text-xl font-bold">{metric.current}</p>
                <p className="text-xs text-muted-foreground">
                  vs {metric.previous} previous
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardComparisonWidget;
