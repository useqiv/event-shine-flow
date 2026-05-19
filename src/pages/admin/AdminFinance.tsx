import React, { useState, useEffect, useMemo } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAdminStatistics, usePlatformSettings } from '@/hooks/useAdminData';
import { usePlatformCurrency } from '@/hooks/usePlatformCurrency';
import { formatCurrency } from '@/components/ui/currency-selector';
import CurrencySelector from '@/components/ui/currency-selector';
import CurrencyDisplay from '@/components/ui/currency-display';
import {
  DollarSign,
  Wallet,
  CreditCard,
  BarChart3,
  Percent,
  Vote,
  Ticket,
  Users,
  Coins,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import {
  buildRevenueBreakdownPie,
  fetchAdminFinanceOverview,
  getFinanceStatsForCurrency,
} from '@/lib/adminFinanceRevenue';
import { normalizeRevenueByCurrency } from '@/lib/revenueByCurrency';

const AdminFinance: React.FC = () => {
  const { data: stats, isLoading: statsLoading } = useAdminStatistics();
  const platformCurrency = usePlatformCurrency();
  const [selectedCurrency, setSelectedCurrency] = useState<string>(platformCurrency);

  useEffect(() => {
    if (platformCurrency) {
      setSelectedCurrency(platformCurrency);
    }
  }, [platformCurrency]);

  const { data: financeOverview, isLoading: overviewLoading } = useQuery({
    queryKey: ['admin-finance-overview'],
    queryFn: () => fetchAdminFinanceOverview(),
  });

  const { data: revenueData = [], isLoading: revenueLoading } = useQuery({
    queryKey: ['admin-monthly-revenue', selectedCurrency],
    queryFn: async () => {
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const start = startOfMonth(date);
        const end = endOfMonth(date);
        const monthOverview = await fetchAdminFinanceOverview({
          start: start.toISOString(),
          end: end.toISOString(),
        });
        const monthStats = getFinanceStatsForCurrency(monthOverview, selectedCurrency);
        months.push({
          month: format(date, 'MMM'),
          votes: monthStats.votes,
          tickets: monthStats.tickets,
          donations: monthStats.donations,
          forms: monthStats.forms,
        });
      }
      return months;
    },
  });

  const { data: currencyStats, isLoading: currencyStatsLoading } = useQuery({
    queryKey: ['admin-revenue-by-currency', selectedCurrency, financeOverview],
    queryFn: async () => {
      const source = getFinanceStatsForCurrency(financeOverview, selectedCurrency);
      const total = source.total;

      const { data: pendingPayouts } = await supabase
        .from('payouts')
        .select('amount, currency')
        .eq('status', 'pending')
        .eq('currency', selectedCurrency);

      const { data: completedPayouts } = await supabase
        .from('payouts')
        .select('amount, currency')
        .eq('status', 'completed')
        .eq('currency', selectedCurrency);

      const pendingTotal = pendingPayouts?.reduce((sum, p) => sum + p.amount, 0) || 0;
      const completedTotal = completedPayouts?.reduce((sum, p) => sum + p.amount, 0) || 0;

      return {
        ...source,
        pendingPayouts: pendingTotal,
        completedPayouts: completedTotal,
        breakdown: buildRevenueBreakdownPie(source),
      };
    },
    enabled: !!financeOverview,
  });

  const allCurrenciesGross = useMemo(() => {
    if (!financeOverview) return {};
    return normalizeRevenueByCurrency(
      Object.fromEntries(
        Object.entries(financeOverview.byCurrency).map(([code, s]) => [code, s.total]),
      ),
    );
  }, [financeOverview]);

  const revenueBreakdown = currencyStats?.breakdown || buildRevenueBreakdownPie(
    getFinanceStatsForCurrency(financeOverview, selectedCurrency),
  );

  const { data: platformSettings } = usePlatformSettings();
  const voteCommission = parseFloat(
    platformSettings?.find((s) => s.setting_key === 'vote_commission_percentage')?.setting_value ||
      '10',
  );
  const ticketCommission = parseFloat(
    platformSettings?.find((s) => s.setting_key === 'ticket_commission_percentage')?.setting_value ||
      '10',
  );
  const campaignCommission = parseFloat(
    platformSettings?.find((s) => s.setting_key === 'campaign_commission_percentage')
      ?.setting_value || '10',
  );
  const influencerCommission = parseFloat(
    platformSettings?.find((s) => s.setting_key === 'influencer_commission_percentage')
      ?.setting_value || '5',
  );

  const votesRevenue = currencyStats?.votes || 0;
  const ticketsRevenue = currencyStats?.tickets || 0;
  const totalRevenue = currencyStats?.total || 0;
  const platformEarnings =
    votesRevenue * (voteCommission / 100) + ticketsRevenue * (ticketCommission / 100);
  const pendingPayouts = currencyStats?.pendingPayouts || 0;
  const completedPayouts = currencyStats?.completedPayouts || 0;
  const netRevenue = totalRevenue - platformEarnings;
  const availableForPayout = netRevenue - pendingPayouts - completedPayouts;

  const isLoading = statsLoading || overviewLoading || revenueLoading || currencyStatsLoading;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Finance & Revenue</h1>
            <p className="text-muted-foreground">Platform financial overview</p>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-8 w-24 mb-2" />
                  <Skeleton className="h-4 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  const hasMultipleCurrencies = Object.keys(allCurrenciesGross).length > 1;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Finance & Revenue</h1>
            <p className="text-muted-foreground">
              Platform financial overview — amounts use actual paid currency
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">View currency:</span>
            <CurrencySelector
              value={selectedCurrency}
              onValueChange={setSelectedCurrency}
              className="w-[180px]"
            />
          </div>
        </div>

        {/* All currencies at a glance */}
        {Object.keys(allCurrenciesGross).length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Coins className="h-5 w-5" />
                Revenue by currency
              </CardTitle>
              <CardDescription>
                {hasMultipleCurrencies
                  ? 'Totals are never mixed across currencies. USD reflects amount_paid on USD votes, not listing price.'
                  : 'All platform revenue in one currency.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {financeOverview?.activeCurrencies.map((code) => {
                  const source = financeOverview.byCurrency[code];
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => setSelectedCurrency(code)}
                      className={`text-left p-4 rounded-lg border transition-colors ${
                        selectedCurrency === code
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">{code}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {(source?.voteCount || 0) +
                            (source?.ticketCount || 0) +
                            (source?.donationCount || 0) +
                            (source?.formCount || 0)}{' '}
                          txns
                        </span>
                      </div>
                      <CurrencyDisplay
                        amount={source?.total || 0}
                        currency={code}
                        size="lg"
                        showConversion={false}
                      />
                      <div className="mt-2 space-y-0.5 text-[10px] text-muted-foreground">
                        {(source?.votes || 0) > 0 && (
                          <div>
                            Votes:{' '}
                            <CurrencyDisplay
                              amount={source.votes}
                              currency={code}
                              size="sm"
                              showConversion={false}
                            />
                          </div>
                        )}
                        {(source?.tickets || 0) > 0 && (
                          <div>
                            Tickets:{' '}
                            <CurrencyDisplay
                              amount={source.tickets}
                              currency={code}
                              size="sm"
                              showConversion={false}
                            />
                          </div>
                        )}
                        {(source?.donations || 0) > 0 && (
                          <div>
                            Donations:{' '}
                            <CurrencyDisplay
                              amount={source.donations}
                              currency={code}
                              size="sm"
                              showConversion={false}
                            />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Key Financial Stats — selected currency only */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Revenue ({selectedCurrency})
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <CurrencyDisplay amount={totalRevenue} currency={selectedCurrency} size="lg" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Paid in {selectedCurrency} only
                {currencyStats?.voteCount ? ` · ${currencyStats.voteCount} votes` : ''}
                {currencyStats?.ticketCount ? ` · ${currencyStats.ticketCount} tickets` : ''}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Platform Earnings ({selectedCurrency})
              </CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <CurrencyDisplay amount={platformEarnings} currency={selectedCurrency} size="lg" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Based on configured rates</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Payouts ({selectedCurrency})
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">
                <CurrencyDisplay amount={pendingPayouts} currency={selectedCurrency} size="lg" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting processing</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Org Available ({selectedCurrency})
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${availableForPayout >= 0 ? 'text-success' : 'text-destructive'}`}
              >
                <CurrencyDisplay amount={availableForPayout} currency={selectedCurrency} size="lg" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Net revenue − payouts</p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Chart */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Revenue Trend ({selectedCurrency})</CardTitle>
              <CardDescription>
                Monthly revenue in {selectedCurrency} from votes, tickets, donations & forms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorVotes" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis
                      className="text-xs"
                      tickFormatter={(value) =>
                        formatCurrency(value / 1000, selectedCurrency).replace(/,/g, '') + 'k'
                      }
                    />
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        formatCurrency(value, selectedCurrency),
                        name,
                      ]}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="votes"
                      stroke="hsl(var(--chart-1))"
                      fillOpacity={1}
                      fill="url(#colorVotes)"
                      name="Votes"
                    />
                    <Area
                      type="monotone"
                      dataKey="tickets"
                      stroke="hsl(var(--chart-2))"
                      fillOpacity={1}
                      fill="url(#colorTickets)"
                      name="Tickets"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Breakdown</CardTitle>
              <CardDescription>Distribution in {selectedCurrency}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={revenueBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {revenueBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip formatter={(value: number) => `${value}%`} />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5" />
                Commission Rates
              </CardTitle>
              <CardDescription>Platform commission breakdown by type</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Vote className="h-4 w-4 text-primary" />
                  <span className="text-sm">Vote Purchases</span>
                </div>
                <span className="font-bold text-lg">{voteCommission}%</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Ticket className="h-4 w-4 text-primary" />
                  <span className="text-sm">Ticket Sales</span>
                </div>
                <span className="font-bold text-lg">{ticketCommission}%</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <span className="text-sm">Campaigns</span>
                </div>
                <span className="font-bold text-lg">{campaignCommission}%</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="text-sm">Influencer Referrals</span>
                </div>
                <span className="font-bold text-lg">{influencerCommission}%</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Sources ({selectedCurrency})</CardTitle>
              <CardDescription>Detailed breakdown for selected currency</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: 'Votes', amount: votesRevenue, color: 'hsl(var(--chart-1))' },
                { name: 'Tickets', amount: ticketsRevenue, color: 'hsl(var(--chart-2))' },
                {
                  name: 'Donations',
                  amount: currencyStats?.donations || 0,
                  color: 'hsl(var(--chart-3))',
                },
                { name: 'Forms', amount: currencyStats?.forms || 0, color: 'hsl(var(--chart-4))' },
              ]
                .filter((item) => item.amount > 0)
                .map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span>{item.name}</span>
                    </div>
                    <span className="font-medium">
                      <CurrencyDisplay
                        amount={item.amount}
                        currency={selectedCurrency}
                        showConversion={false}
                      />
                      {totalRevenue > 0 && (
                        <span className="text-muted-foreground text-sm ml-1">
                          ({Math.round((item.amount / totalRevenue) * 100)}%)
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              {totalRevenue === 0 && (
                <p className="text-sm text-muted-foreground">No revenue in {selectedCurrency}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Platform Metrics</CardTitle>
              <CardDescription>Key performance indicators</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Votes Generated</span>
                <span className="font-medium">{stats?.total_votes?.toLocaleString() || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Tickets Sold</span>
                <span className="font-medium">{stats?.total_tickets_sold?.toLocaleString() || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Active Contests</span>
                <span className="font-medium">{stats?.active_contests || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Active Events</span>
                <span className="font-medium">{stats?.active_events || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminFinance;
