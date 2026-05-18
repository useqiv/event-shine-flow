import React, { useMemo } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimePayments } from '@/hooks/useRealtimePayments';
import { usePlatformCurrency } from '@/hooks/usePlatformCurrency';
import { formatCurrency } from '@/components/ui/currency-selector';
import CurrencyDisplay from '@/components/ui/currency-display';
import { getBaseAmountsByTransactionId } from '@/lib/baseAmount';
import RevenueForecast from '@/components/admin/RevenueForecast';
import { 
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { format, subDays, startOfDay, eachDayOfInterval, eachHourOfInterval, startOfHour, subHours } from 'date-fns';
import { TrendingUp, CreditCard, Wallet, DollarSign, Calendar, Clock } from 'lucide-react';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

const AdminPaymentAnalytics = () => {
  useRealtimePayments();
  const [timeRange, setTimeRange] = React.useState('7d');
  
  // Platform default currency from settings
  const platformCurrency = usePlatformCurrency();

  // Fetch votes - group revenue by actual paid currency (votes.currency)
  const { data: votes, isLoading: votesLoading } = useQuery({
    queryKey: ['analytics-votes', timeRange],
    queryFn: async () => {
      const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = subDays(new Date(), daysBack).toISOString();
      
      const { data, error } = await supabase
        .from('votes')
        .select(`
          id,
          transaction_id,
          payment_method,
          created_at,
          quantity,
          amount_paid,
          currency,
          contest:contests(vote_currency, vote_price)
        `)
        .gte('created_at', startDate)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      const baseAmountMap = await getBaseAmountsByTransactionId(
        data?.map((v: any) => v.transaction_id) || []
      );

      return (data || []).map((v: any) => {
        const listing = (v.contest?.vote_currency || 'NGN').toUpperCase();
        const paid = (v.currency || listing).toUpperCase();
        const catalogFallback =
          paid === listing
            ? (Number(v.contest?.vote_price) || 0) * (Number(v.quantity) || 0)
            : 0;
        return {
          ...v,
          base_amount:
            baseAmountMap.get(v.transaction_id) ??
            Number(v.amount_paid) ||
            catalogFallback,
        };
      });
    },
  });

  // Fetch tickets - currency comes from ticket_type.currency
  const { data: tickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ['analytics-tickets', timeRange],
    queryFn: async () => {
      const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = subDays(new Date(), daysBack).toISOString();
      
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          id,
          transaction_id,
          payment_method,
          created_at,
          quantity,
          status,
          ticket_type:ticket_types(currency, price)
        `)
        .gte('created_at', startDate)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      const baseAmountMap = await getBaseAmountsByTransactionId(
        data?.map((t: any) => t.transaction_id) || []
      );

      return (data || []).map((t: any) => ({
        ...t,
        base_amount:
          baseAmountMap.get(t.transaction_id) ??
          ((Number(t.ticket_type?.price) || 0) * (Number(t.quantity) || 0)),
      }));
    },
  });

  // Fetch donations
  const { data: donations, isLoading: donationsLoading } = useQuery({
    queryKey: ['analytics-donations', timeRange],
    queryFn: async () => {
      const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = subDays(new Date(), daysBack).toISOString();
      
      const { data, error } = await supabase
        .from('donations')
        .select('id, amount, currency, payment_method, created_at, status')
        .gte('created_at', startDate)
        .eq('status', 'completed')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch form payments
  const { data: formPayments, isLoading: formsLoading } = useQuery({
    queryKey: ['analytics-forms', timeRange],
    queryFn: async () => {
      const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = subDays(new Date(), daysBack).toISOString();
      
      const { data, error } = await supabase
        .from('form_responses')
        .select(`
          id,
          payment_amount,
          payment_status,
          submitted_at,
          form:forms(payment_currency)
        `)
        .gte('submitted_at', startDate)
        .eq('payment_status', 'completed')
        .not('payment_amount', 'is', null)
        .order('submitted_at', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  // Filter successful transactions (same logic as payment history)
  const successStatuses = ['completed', 'active', 'confirmed', 'used'];

  // Multi-currency revenue breakdown
  const currencyBreakdown = useMemo(() => {
    const byCurrency: Record<string, { votes: number; tickets: number; donations: number; forms: number; total: number; count: number }> = {};
    
    votes?.forEach((v: any) => {
      const currency = v.currency || v.contest?.vote_currency || 'NGN';
      if (!byCurrency[currency]) {
        byCurrency[currency] = { votes: 0, tickets: 0, donations: 0, forms: 0, total: 0, count: 0 };
      }
      byCurrency[currency].votes += Number(v.base_amount) || 0;
      byCurrency[currency].total += Number(v.base_amount) || 0;
      byCurrency[currency].count += 1;
    });
    
    tickets?.forEach((t: any) => {
      if (!successStatuses.includes(t.status)) return;
      const currency = t.ticket_type?.currency || 'NGN';
      if (!byCurrency[currency]) {
        byCurrency[currency] = { votes: 0, tickets: 0, donations: 0, forms: 0, total: 0, count: 0 };
      }
      byCurrency[currency].tickets += Number(t.base_amount) || 0;
      byCurrency[currency].total += Number(t.base_amount) || 0;
      byCurrency[currency].count += 1;
    });

    donations?.forEach((d: any) => {
      const currency = d.currency || 'USD';
      if (!byCurrency[currency]) {
        byCurrency[currency] = { votes: 0, tickets: 0, donations: 0, forms: 0, total: 0, count: 0 };
      }
      byCurrency[currency].donations += d.amount;
      byCurrency[currency].total += d.amount;
      byCurrency[currency].count += 1;
    });

    formPayments?.forEach((f: any) => {
      const currency = f.form?.payment_currency || 'NGN';
      if (!byCurrency[currency]) {
        byCurrency[currency] = { votes: 0, tickets: 0, donations: 0, forms: 0, total: 0, count: 0 };
      }
      byCurrency[currency].forms += f.payment_amount || 0;
      byCurrency[currency].total += f.payment_amount || 0;
      byCurrency[currency].count += 1;
    });
    
    return Object.entries(byCurrency)
      .map(([currency, data]) => ({ currency, ...data }))
      .sort((a, b) => b.total - a.total);
  }, [votes, tickets, donations, formPayments]);

  // Revenue trend data
  const revenueTrendData = useMemo(() => {
    const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const days = eachDayOfInterval({
      start: subDays(new Date(), daysBack - 1),
      end: new Date()
    });

    return days.map(day => {
      const dayStart = startOfDay(day);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const voteRevenue = votes?.filter((v: any) => {
        const date = new Date(v.created_at);
        return date >= dayStart && date < dayEnd;
      }).reduce((sum: number, v: any) => sum + (Number(v.base_amount) || 0), 0) || 0;

      const ticketRevenue = tickets?.filter((t: any) => {
        const date = new Date(t.created_at);
        return date >= dayStart && date < dayEnd && successStatuses.includes(t.status);
      }).reduce((sum: number, t: any) => sum + (Number(t.base_amount) || 0), 0) || 0;

      const donationRevenue = donations?.filter((d: any) => {
        const date = new Date(d.created_at);
        return date >= dayStart && date < dayEnd;
      }).reduce((sum: number, d: any) => sum + d.amount, 0) || 0;

      const formRevenue = formPayments?.filter((f: any) => {
        const date = new Date(f.submitted_at);
        return date >= dayStart && date < dayEnd;
      }).reduce((sum: number, f: any) => sum + (f.payment_amount || 0), 0) || 0;

      return {
        date: format(day, timeRange === '7d' ? 'EEE' : 'MMM d'),
        votes: voteRevenue,
        tickets: ticketRevenue,
        donations: donationRevenue,
        forms: formRevenue,
        total: voteRevenue + ticketRevenue + donationRevenue + formRevenue
      };
    });
  }, [votes, tickets, donations, formPayments, timeRange]);

  // Payment method distribution
  const paymentMethodData = useMemo(() => {
    const methods: Record<string, number> = {};
    
    votes?.forEach((v: any) => {
      const method = v.payment_method || 'unknown';
      methods[method] = (methods[method] || 0) + (Number(v.base_amount) || 0);
    });
    
    tickets?.forEach((t: any) => {
      if (!successStatuses.includes(t.status)) return;
      const method = t.payment_method || 'unknown';
      methods[method] = (methods[method] || 0) + (Number(t.base_amount) || 0);
    });

    donations?.forEach((d: any) => {
      const method = d.payment_method || 'unknown';
      methods[method] = (methods[method] || 0) + d.amount;
    });

    return Object.entries(methods).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      percentage: 0
    })).map((item, _, arr) => ({
      ...item,
      percentage: Math.round((item.value / arr.reduce((s, i) => s + i.value, 0)) * 100) || 0
    }));
  }, [votes, tickets, donations]);

  // Peak transaction hours
  const peakHoursData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      label: format(new Date().setHours(i, 0, 0, 0), 'ha'),
      transactions: 0,
      amount: 0
    }));

    votes?.forEach((v: any) => {
      const hour = new Date(v.created_at).getHours();
      hours[hour].transactions += 1;
      hours[hour].amount += Number(v.base_amount) || 0;
    });

    tickets?.forEach((t: any) => {
      if (!successStatuses.includes(t.status)) return;
      const hour = new Date(t.created_at).getHours();
      hours[hour].transactions += 1;
      hours[hour].amount += Number(t.base_amount) || 0;
    });

    donations?.forEach((d: any) => {
      const hour = new Date(d.created_at).getHours();
      hours[hour].transactions += 1;
      hours[hour].amount += d.amount;
    });

    formPayments?.forEach((f: any) => {
      const hour = new Date(f.submitted_at).getHours();
      hours[hour].transactions += 1;
      hours[hour].amount += f.payment_amount || 0;
    });

    return hours;
  }, [votes, tickets, donations, formPayments]);

  // Summary stats
  const summaryStats = useMemo(() => {
    const totalVoteRevenue = votes?.reduce((sum: number, v: any) => sum + (Number(v.base_amount) || 0), 0) || 0;
    const totalTicketRevenue = tickets?.filter((t: any) => successStatuses.includes(t.status))
      .reduce((sum: number, t: any) => sum + (Number(t.base_amount) || 0), 0) || 0;
    const totalDonationRevenue = donations?.reduce((sum: number, d: any) => sum + d.amount, 0) || 0;
    const totalFormRevenue = formPayments?.reduce((sum: number, f: any) => sum + (f.payment_amount || 0), 0) || 0;
    
    const totalTransactions = (votes?.length || 0) + 
      (tickets?.filter((t: any) => successStatuses.includes(t.status)).length || 0) + 
      (donations?.length || 0) + 
      (formPayments?.length || 0);
    
    const totalRevenue = totalVoteRevenue + totalTicketRevenue + totalDonationRevenue + totalFormRevenue;
    const avgTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    // Find peak hour
    const peakHour = peakHoursData.reduce((max, h) => 
      h.transactions > max.transactions ? h : max, peakHoursData[0]);

    return {
      totalRevenue,
      voteRevenue: totalVoteRevenue,
      ticketRevenue: totalTicketRevenue,
      donationRevenue: totalDonationRevenue,
      formRevenue: totalFormRevenue,
      totalTransactions,
      avgTransaction,
      peakHour: peakHour.label
    };
  }, [votes, tickets, donations, formPayments, peakHoursData]);

  const formatAmount = (amount: number) => {
    return formatCurrency(amount, platformCurrency);
  };

  const isLoading = votesLoading || ticketsLoading || donationsLoading || formsLoading;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Payment Analytics</h1>
            <p className="text-muted-foreground">Revenue trends and transaction insights</p>
          </div>
        </div>

        <Tabs defaultValue="analytics" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="forecast">Revenue Forecast</TabsTrigger>
            </TabsList>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <TabsContent value="analytics" className="space-y-6">

        {/* Per-Currency Revenue Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            <>
              <Card><CardContent className="pt-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
              <Card><CardContent className="pt-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
              <Card><CardContent className="pt-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
              <Card><CardContent className="pt-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
            </>
          ) : currencyBreakdown.length > 0 ? (
            <>
              {currencyBreakdown.slice(0, 3).map((item) => (
                <Card key={item.currency}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{item.currency} Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      <CurrencyDisplay amount={item.total} currency={item.currency} size="lg" showConversion={false} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{item.count} transactions</p>
                  </CardContent>
                </Card>
              ))}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Transactions</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summaryStats.totalTransactions.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">Peak: {summaryStats.peakHour}</p>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="col-span-full">
              <CardContent className="pt-6 text-center text-muted-foreground">
                No transactions in selected period
              </CardContent>
            </Card>
          )}
        </div>

        {/* Revenue Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Daily revenue from votes and ticket sales</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueTrendData}>
                  <defs>
                    <linearGradient id="colorVotes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                    <YAxis 
                      tickFormatter={(v) => formatAmount(v / 1000).replace(/,/g, '') + 'k'}
                      className="text-xs"
                    />
                  <Tooltip 
                      formatter={(value: number) => formatAmount(value)}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="votes" 
                    stroke="hsl(var(--primary))" 
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
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Payment Method Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>Revenue distribution by payment method</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[250px] w-full" />
              ) : paymentMethodData.length === 0 ? (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  No payment data available
                </div>
              ) : (
                <div className="flex items-center gap-8">
                  <ResponsiveContainer width="50%" height={250}>
                    <PieChart>
                      <Pie
                        data={paymentMethodData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {paymentMethodData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatAmount(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-3">
                    {paymentMethodData.map((item, index) => (
                      <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-sm">{item.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{item.percentage}%</div>
                          <div className="text-xs text-muted-foreground"><CurrencyDisplay amount={item.value} currency={platformCurrency} size="sm" /></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Peak Transaction Hours */}
          <Card>
            <CardHeader>
              <CardTitle>Peak Transaction Hours</CardTitle>
              <CardDescription>Transaction volume by hour of day</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[250px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={peakHoursData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="label" 
                      className="text-xs"
                      interval={2}
                    />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        name === 'amount' ? formatAmount(value) : value,
                        name === 'amount' ? 'Revenue' : 'Transactions'
                      ]}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar 
                      dataKey="transactions" 
                      fill="hsl(var(--primary))" 
                      radius={[4, 4, 0, 0]}
                      name="Transactions"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Multi-Currency Revenue Breakdown */}
        {currencyBreakdown.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Currency</CardTitle>
              <CardDescription>Breakdown of revenue across all currencies</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currencyBreakdown.map((item) => (
                    <div key={item.currency} className="p-4 rounded-lg bg-muted/50 border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-lg">{item.currency}</span>
                        <span className="text-xs text-muted-foreground">{item.count} txns</span>
                      </div>
                      <div className="text-2xl font-bold">
                        <CurrencyDisplay amount={item.total} currency={item.currency} size="lg" />
                      </div>
                      <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                        {item.votes > 0 && <div>Votes: <CurrencyDisplay amount={item.votes} currency={item.currency} size="sm" /></div>}
                        {item.tickets > 0 && <div>Tickets: <CurrencyDisplay amount={item.tickets} currency={item.currency} size="sm" /></div>}
                        {item.donations > 0 && <div>Donations: <CurrencyDisplay amount={item.donations} currency={item.currency} size="sm" /></div>}
                        {item.forms > 0 && <div>Forms: <CurrencyDisplay amount={item.forms} currency={item.currency} size="sm" /></div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Revenue Breakdown by Type */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Breakdown by Type</CardTitle>
            <CardDescription>Compare revenue from different sources</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="h-5 w-5 text-primary" />
                    <span className="font-medium">Votes</span>
                  </div>
                  <div className="text-xl font-bold text-primary">
                    <CurrencyDisplay amount={summaryStats.voteRevenue} currency={platformCurrency} size="lg" />
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {votes?.length || 0} transactions
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-chart-2/10 border border-chart-2/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-5 w-5 text-chart-2" />
                    <span className="font-medium">Tickets</span>
                  </div>
                  <div className="text-xl font-bold" style={{ color: 'hsl(var(--chart-2))' }}>
                    <CurrencyDisplay amount={summaryStats.ticketRevenue} currency={platformCurrency} size="lg" />
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {tickets?.filter((t: any) => successStatuses.includes(t.status)).length || 0} transactions
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-chart-3/10 border border-chart-3/20">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-5 w-5 text-chart-3" />
                    <span className="font-medium">Donations</span>
                  </div>
                  <div className="text-xl font-bold" style={{ color: 'hsl(var(--chart-3))' }}>
                    <CurrencyDisplay amount={summaryStats.donationRevenue} currency={platformCurrency} size="lg" />
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {donations?.length || 0} transactions
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-chart-4/10 border border-chart-4/20">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="h-5 w-5 text-chart-4" />
                    <span className="font-medium">Forms</span>
                  </div>
                  <div className="text-xl font-bold" style={{ color: 'hsl(var(--chart-4))' }}>
                    <CurrencyDisplay amount={summaryStats.formRevenue} currency={platformCurrency} size="lg" />
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {formPayments?.length || 0} transactions
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="forecast">
            <RevenueForecast />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminPaymentAnalytics;
