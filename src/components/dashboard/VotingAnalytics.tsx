import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMyVotes } from '@/hooks/useContests';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { TrendingUp, Vote, Calendar, Trophy } from 'lucide-react';
import { format, startOfMonth, subMonths } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, getCurrencySymbol } from '@/components/ui/currency-selector';
export const VotingAnalytics = () => {
  const { data: votes, isLoading } = useMyVotes();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Voting Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20" />)}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!votes || votes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Voting Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">No voting history to analyze yet.</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate analytics
  const totalVotes = votes.reduce((sum: number, v: any) => sum + v.quantity, 0);
  const uniqueContests = new Set(votes.map((v: any) => v.contest_id)).size;
  const uniqueContestants = new Set(votes.map((v: any) => v.contestant_id)).size;

  // Group spending by currency
  const spentByCurrency = votes.reduce((acc: Record<string, number>, v: any) => {
    const currency = v.currency || v.contest?.vote_currency || 'NGN';
    acc[currency] = (acc[currency] || 0) + Number(v.amount_paid);
    return acc;
  }, {});

  // Votes by contest category
  const categoryData = votes.reduce((acc: any, vote: any) => {
    const category = vote.contest?.category || 'Other';
    acc[category] = (acc[category] || 0) + vote.quantity;
    return acc;
  }, {});

  const pieData = Object.entries(categoryData).map(([name, value]) => ({ name, value }));
  const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  // Monthly voting trend (last 6 months)
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(new Date(), i));
    const monthVotes = votes.filter((v: any) => {
      const voteDate = new Date(v.created_at);
      return voteDate.getMonth() === monthStart.getMonth() && 
             voteDate.getFullYear() === monthStart.getFullYear();
    });
    monthlyData.push({
      month: format(monthStart, 'MMM'),
      votes: monthVotes.reduce((sum: number, v: any) => sum + v.quantity, 0),
      spent: monthVotes.reduce((sum: number, v: any) => sum + Number(v.amount_paid), 0)
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Voting Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-secondary/50 rounded-lg p-4 text-center">
            <Vote className="h-5 w-5 mx-auto text-primary mb-2" />
            <p className="text-2xl font-bold">{totalVotes}</p>
            <p className="text-xs text-muted-foreground">Total Votes</p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-4 text-center">
            <Calendar className="h-5 w-5 mx-auto text-accent mb-2" />
            <div className="space-y-1">
              {Object.entries(spentByCurrency).map(([currency, amount]) => (
                <p key={currency} className="text-lg font-bold">
                  {formatCurrency(amount as number, currency)}
                </p>
              ))}
              {Object.keys(spentByCurrency).length === 0 && (
                <p className="text-2xl font-bold">0</p>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Total Spent</p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-4 text-center">
            <Trophy className="h-5 w-5 mx-auto text-chart-3 mb-2" />
            <p className="text-2xl font-bold">{uniqueContests}</p>
            <p className="text-xs text-muted-foreground">Contests</p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-4 text-center">
            <TrendingUp className="h-5 w-5 mx-auto text-chart-4 mb-2" />
            <p className="text-2xl font-bold">{uniqueContestants}</p>
            <p className="text-xs text-muted-foreground">Contestants Supported</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Category Distribution */}
          <div>
            <h4 className="text-sm font-medium mb-3">Votes by Category</h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly Trend */}
          <div>
            <h4 className="text-sm font-medium mb-3">Monthly Voting Trend</h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      value.toLocaleString(),
                      name === 'votes' ? 'Votes' : 'Spent'
                    ]}
                  />
                  <Bar dataKey="votes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
