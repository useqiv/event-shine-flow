import React from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminStatistics } from '@/hooks/useAdminData';
import { usePlatformCurrency } from '@/hooks/usePlatformCurrency';
import { formatCurrency } from '@/components/ui/currency-selector';
import CurrencyDisplay from '@/components/ui/currency-display';
import { 
  DollarSign, 
  TrendingUp, 
  Wallet, 
  CreditCard,
  BarChart3,
  PieChart
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
  Legend
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

const AdminFinance: React.FC = () => {
  const { data: stats, isLoading: statsLoading } = useAdminStatistics();

  // Default currency for admin pages (from platform settings)
  const platformCurrency = usePlatformCurrency();

  // Fetch real monthly revenue data from votes and tickets
  const { data: revenueData = [], isLoading: revenueLoading } = useQuery({
    queryKey: ['admin-monthly-revenue'],
    queryFn: async () => {
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const start = startOfMonth(date);
        const end = endOfMonth(date);
        
        // Get votes revenue for this month
        const { data: votes } = await supabase
          .from('votes')
          .select('amount_paid')
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString());
        
        // Get tickets revenue for this month
        const { data: tickets } = await supabase
          .from('tickets')
          .select('amount_paid')
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString());
        
        const votesRevenue = votes?.reduce((sum, v) => sum + v.amount_paid, 0) || 0;
        const ticketsRevenue = tickets?.reduce((sum, t) => sum + t.amount_paid, 0) || 0;
        
        months.push({
          month: format(date, 'MMM'),
          votes: votesRevenue,
          tickets: ticketsRevenue,
        });
      }
      return months;
    },
  });

  // Fetch actual revenue breakdown from database
  const { data: actualBreakdown } = useQuery({
    queryKey: ['admin-revenue-breakdown'],
    queryFn: async () => {
      const { data: votes } = await supabase
        .from('votes')
        .select('amount_paid');
      
      const { data: tickets } = await supabase
        .from('tickets')
        .select('amount_paid');
      
      const votesTotal = votes?.reduce((sum, v) => sum + v.amount_paid, 0) || 0;
      const ticketsTotal = tickets?.reduce((sum, t) => sum + t.amount_paid, 0) || 0;
      const total = votesTotal + ticketsTotal;
      
      if (total === 0) {
        return [
          { name: 'Votes', value: 0, color: 'hsl(var(--chart-1))' },
          { name: 'Tickets', value: 0, color: 'hsl(var(--chart-2))' },
        ];
      }
      
      return [
        { name: 'Votes', value: Math.round((votesTotal / total) * 100), color: 'hsl(var(--chart-1))' },
        { name: 'Tickets', value: Math.round((ticketsTotal / total) * 100), color: 'hsl(var(--chart-2))' },
      ];
    },
  });

  const revenueBreakdown = actualBreakdown || [
    { name: 'Votes', value: 0, color: 'hsl(var(--chart-1))' },
    { name: 'Tickets', value: 0, color: 'hsl(var(--chart-2))' },
  ];

  const commissionRate = 10; // Default commission rate
  const totalRevenue = stats?.total_revenue || 0;
  const platformEarnings = totalRevenue * (commissionRate / 100);
  const isLoading = statsLoading || revenueLoading;

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

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Finance & Revenue</h1>
          <p className="text-muted-foreground">Platform financial overview</p>
        </div>

        {/* Key Financial Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <CurrencyDisplay amount={totalRevenue} currency={platformCurrency} size="lg" />
              </div>
              <div className="flex items-center text-xs text-green-500 mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12.5% from last month
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Platform Earnings
              </CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <CurrencyDisplay amount={platformEarnings} currency={platformCurrency} size="lg" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {commissionRate}% commission
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Payouts
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">
                <CurrencyDisplay amount={stats?.pending_payouts || 0} currency={platformCurrency} size="lg" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Awaiting processing
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Net Profit
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                <CurrencyDisplay amount={platformEarnings - (stats?.pending_payouts || 0)} currency={platformCurrency} size="lg" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                After pending payouts
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Chart */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
              <CardDescription>Monthly revenue from votes and tickets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorVotes" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(value) => formatCurrency(value / 1000, platformCurrency).replace(/,/g, '') + 'k'} />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value, platformCurrency)}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="votes" 
                      stroke="hsl(var(--chart-1))" 
                      fillOpacity={1} 
                      fill="url(#colorVotes)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="tickets" 
                      stroke="hsl(var(--chart-2))" 
                      fillOpacity={1} 
                      fill="url(#colorTickets)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Breakdown</CardTitle>
              <CardDescription>Distribution by source</CardDescription>
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

        {/* Additional Stats */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Sources</CardTitle>
              <CardDescription>Detailed breakdown of platform revenue</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {revenueBreakdown.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span>{item.name} Revenue</span>
                  </div>
                  <span className="font-medium">
                    <CurrencyDisplay amount={totalRevenue * (item.value / 100)} currency={platformCurrency} />
                    <span className="text-muted-foreground text-sm ml-1">({item.value}%)</span>
                  </span>
                </div>
              ))}
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
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Commission Rate</span>
                <span className="font-medium">{commissionRate}%</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminFinance;