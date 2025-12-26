import React, { useMemo } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimePayments } from '@/hooks/useRealtimePayments';
import { formatCurrency } from '@/components/ui/currency-selector';
import CurrencyDisplay from '@/components/ui/currency-display';
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
  
  // Platform default currency
  const platformCurrency = 'NGN';

  // Fetch votes
  const { data: votes, isLoading: votesLoading } = useQuery({
    queryKey: ['analytics-votes', timeRange],
    queryFn: async () => {
      const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = subDays(new Date(), daysBack).toISOString();
      
      const { data, error } = await supabase
        .from('votes')
        .select('id, amount_paid, payment_method, created_at, quantity')
        .gte('created_at', startDate)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch tickets
  const { data: tickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ['analytics-tickets', timeRange],
    queryFn: async () => {
      const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = subDays(new Date(), daysBack).toISOString();
      
      const { data, error } = await supabase
        .from('tickets')
        .select('id, amount_paid, payment_method, created_at, quantity')
        .gte('created_at', startDate)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

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

      const voteRevenue = votes?.filter(v => {
        const date = new Date(v.created_at);
        return date >= dayStart && date < dayEnd;
      }).reduce((sum, v) => sum + v.amount_paid, 0) || 0;

      const ticketRevenue = tickets?.filter(t => {
        const date = new Date(t.created_at);
        return date >= dayStart && date < dayEnd;
      }).reduce((sum, t) => sum + t.amount_paid, 0) || 0;

      return {
        date: format(day, timeRange === '7d' ? 'EEE' : 'MMM d'),
        votes: voteRevenue,
        tickets: ticketRevenue,
        total: voteRevenue + ticketRevenue
      };
    });
  }, [votes, tickets, timeRange]);

  // Payment method distribution
  const paymentMethodData = useMemo(() => {
    const methods: Record<string, number> = {};
    
    votes?.forEach(v => {
      const method = v.payment_method || 'unknown';
      methods[method] = (methods[method] || 0) + v.amount_paid;
    });
    
    tickets?.forEach(t => {
      const method = t.payment_method || 'unknown';
      methods[method] = (methods[method] || 0) + t.amount_paid;
    });

    return Object.entries(methods).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      percentage: 0
    })).map((item, _, arr) => ({
      ...item,
      percentage: Math.round((item.value / arr.reduce((s, i) => s + i.value, 0)) * 100) || 0
    }));
  }, [votes, tickets]);

  // Peak transaction hours
  const peakHoursData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      label: format(new Date().setHours(i, 0, 0, 0), 'ha'),
      transactions: 0,
      amount: 0
    }));

    votes?.forEach(v => {
      const hour = new Date(v.created_at).getHours();
      hours[hour].transactions += 1;
      hours[hour].amount += v.amount_paid;
    });

    tickets?.forEach(t => {
      const hour = new Date(t.created_at).getHours();
      hours[hour].transactions += 1;
      hours[hour].amount += t.amount_paid;
    });

    return hours;
  }, [votes, tickets]);

  // Summary stats
  const summaryStats = useMemo(() => {
    const totalVoteRevenue = votes?.reduce((sum, v) => sum + v.amount_paid, 0) || 0;
    const totalTicketRevenue = tickets?.reduce((sum, t) => sum + t.amount_paid, 0) || 0;
    const totalTransactions = (votes?.length || 0) + (tickets?.length || 0);
    const avgTransaction = totalTransactions > 0 
      ? (totalVoteRevenue + totalTicketRevenue) / totalTransactions 
      : 0;

    // Find peak hour
    const peakHour = peakHoursData.reduce((max, h) => 
      h.transactions > max.transactions ? h : max, peakHoursData[0]);

    return {
      totalRevenue: totalVoteRevenue + totalTicketRevenue,
      voteRevenue: totalVoteRevenue,
      ticketRevenue: totalTicketRevenue,
      totalTransactions,
      avgTransaction,
      peakHour: peakHour.label
    };
  }, [votes, tickets, peakHoursData]);

  const formatAmount = (amount: number) => {
    return formatCurrency(amount, platformCurrency);
  };

  const isLoading = votesLoading || ticketsLoading;

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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <div className="text-2xl font-bold"><CurrencyDisplay amount={summaryStats.totalRevenue} currency={platformCurrency} size="lg" /></div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Transactions</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{summaryStats.totalTransactions.toLocaleString()}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Transaction</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold"><CurrencyDisplay amount={summaryStats.avgTransaction} currency={platformCurrency} size="lg" /></div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Peak Hour</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{summaryStats.peakHour}</div>
              )}
            </CardContent>
          </Card>
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

        {/* Revenue Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Breakdown</CardTitle>
            <CardDescription>Compare vote revenue vs ticket revenue</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : (
              <div className="grid grid-cols-2 gap-6">
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="h-5 w-5 text-primary" />
                    <span className="font-medium">Vote Revenue</span>
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    <CurrencyDisplay amount={summaryStats.voteRevenue} currency={platformCurrency} size="lg" />
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {votes?.length || 0} transactions
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-chart-2/10 border border-chart-2/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-5 w-5 text-chart-2" />
                    <span className="font-medium">Ticket Revenue</span>
                  </div>
                  <div className="text-2xl font-bold" style={{ color: 'hsl(var(--chart-2))' }}>
                    <CurrencyDisplay amount={summaryStats.ticketRevenue} currency={platformCurrency} size="lg" />
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {tickets?.length || 0} transactions
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
