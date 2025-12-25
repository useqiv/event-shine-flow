import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useRevenueTrends } from '@/hooks/useRevenueTrends';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';

const RevenueChart = () => {
  const { data: trends, isLoading } = useRevenueTrends(30);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Revenue Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const totalRevenue = trends?.reduce((sum, day) => sum + day.total, 0) || 0;
  const hasData = totalRevenue > 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5" />
            Revenue Trends (Last 30 Days)
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Total: <span className="font-semibold text-foreground">₦{totalRevenue.toLocaleString()}</span>
          </p>
        </div>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="ticketGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="voteGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  className="text-muted-foreground"
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  className="text-muted-foreground"
                  tickFormatter={(value) => `₦${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--popover-foreground))',
                  }}
                  formatter={(value: number, name: string) => [
                    `₦${value.toLocaleString()}`,
                    name === 'tickets' ? 'Ticket Sales' : 'Vote Revenue'
                  ]}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Legend 
                  formatter={(value) => value === 'tickets' ? 'Ticket Sales' : 'Vote Revenue'}
                />
                <Area
                  type="monotone"
                  dataKey="tickets"
                  stroke="hsl(var(--primary))"
                  fill="url(#ticketGradient)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="votes"
                  stroke="hsl(var(--chart-2))"
                  fill="url(#voteGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No revenue data in the last 30 days</p>
              <p className="text-sm">Start selling tickets and votes to see trends</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RevenueChart;
