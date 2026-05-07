import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import OrganizationLayout from '@/components/layout/OrganizationLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/components/ui/currency-selector';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Vote,
  Clock,
  ArrowLeft,
  DollarSign,
  Target,
  Calendar
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { getBaseAmountsByTransactionId } from '@/lib/baseAmount';

interface ContestDetails {
  id: string;
  title: string;
  total_votes: number;
  vote_price: number;
  vote_currency: string;
  start_date: string;
  end_date: string;
}

interface AnalyticsData {
  totalRevenue: number;
  totalVotes: number;
  uniqueVoters: number;
  averageVotesPerVoter: number;
  conversionRate: number;
  peakVotingHours: { hour: number; count: number }[];
  dailyVotes: { date: string; votes: number; revenue: number }[];
  topContestants: { name: string; votes: number; percentage: number }[];
  voterPaymentMethods: { method: string; count: number }[];
}

const ContestAnalytics = () => {
  const { id } = useParams<{ id: string }>();
  const [contest, setContest] = useState<ContestDetails | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalRevenue: 0,
    totalVotes: 0,
    uniqueVoters: 0,
    averageVotesPerVoter: 0,
    conversionRate: 0,
    peakVotingHours: [],
    dailyVotes: [],
    topContestants: [],
    voterPaymentMethods: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!id) return;

      try {
        // Fetch contest details
        const { data: contestData } = await supabase
          .from('contests')
          .select('id, title, total_votes, vote_price, vote_currency, start_date, end_date')
          .eq('id', id)
          .single();
        
        if (contestData) setContest(contestData);

        // Use votes_public view for secure access (org owners still see guest info)
        const { data: votes } = await supabase
          .from('votes_public')
          .select('id, user_id, guest_email, guest_name, quantity, amount_paid, payment_method, created_at, contestant_id, transaction_id')
          .eq('contest_id', id);

        // Fetch contestants
        const { data: contestants } = await supabase
          .from('contestants')
          .select('id, name, vote_count')
          .eq('contest_id', id)
          .order('vote_count', { ascending: false });

        const { data: voteOptions } = await supabase
          .from('contest_vote_options')
          .select('vote_quantity, price')
          .eq('contest_id', id)
          .eq('is_active', true);

        const baseAmountMap = await getBaseAmountsByTransactionId(
          votes?.map((v: any) => v.transaction_id) || []
        );
        const voteOptionPriceMap = new Map<number, number>();
        voteOptions?.forEach((option: any) => {
          voteOptionPriceMap.set(Number(option.vote_quantity), Number(option.price) || 0);
        });

        // Calculate analytics (use fee-free base amounts where possible)
        const totalRevenue =
          votes?.reduce((sum, v: any) => {
            const optionPrice = voteOptionPriceMap.get(Number(v.quantity));
            const baseAmount = baseAmountMap.get(v.transaction_id) ?? optionPrice ?? Number(v.amount_paid);
            return sum + Number(baseAmount || 0);
          }, 0) || 0;
        const totalVotes = votes?.reduce((sum, v) => sum + v.quantity, 0) || 0;
        // Count unique voters: use user_id for authenticated users, guest_email for guests
        const uniqueVoters = new Set(votes?.map(v => v.user_id || v.guest_email || v.id)).size;
        const averageVotesPerVoter = uniqueVoters > 0 ? totalVotes / uniqueVoters : 0;

        // Peak voting hours
        const hourlyMap = new Map<number, number>();
        votes?.forEach(vote => {
          const hour = new Date(vote.created_at).getHours();
          hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + vote.quantity);
        });
        const peakVotingHours = Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          count: hourlyMap.get(i) || 0,
        }));

        // Daily votes (last 14 days)
        const dailyMap = new Map<string, { votes: number; revenue: number }>();
        const last14Days = Array.from({ length: 14 }, (_, i) => 
          format(subDays(new Date(), 13 - i), 'yyyy-MM-dd')
        );
        
        last14Days.forEach(date => {
          dailyMap.set(date, { votes: 0, revenue: 0 });
        });

        votes?.forEach(vote => {
          const optionPrice = voteOptionPriceMap.get(Number((vote as any).quantity));
          const baseAmount = baseAmountMap.get((vote as any).transaction_id) ?? optionPrice ?? Number(vote.amount_paid);
          const date = format(new Date(vote.created_at), 'yyyy-MM-dd');
          if (dailyMap.has(date)) {
            const current = dailyMap.get(date)!;
            dailyMap.set(date, {
              votes: current.votes + vote.quantity,
              revenue: current.revenue + Number(baseAmount || 0),
            });
          }
        });

        const dailyVotes = Array.from(dailyMap.entries()).map(([date, data]) => ({
          date: format(new Date(date), 'MMM d'),
          votes: data.votes,
          revenue: data.revenue,
        }));

        // Top contestants
        const totalContestantVotes = contestants?.reduce((sum, c) => sum + c.vote_count, 0) || 1;
        const topContestants = (contestants || []).slice(0, 10).map(c => ({
          name: c.name,
          votes: c.vote_count,
          percentage: (c.vote_count / totalContestantVotes) * 100,
        }));

        // Payment methods breakdown
        const paymentMethodMap = new Map<string, number>();
        votes?.forEach(vote => {
          const method = vote.payment_method || 'unknown';
          paymentMethodMap.set(method, (paymentMethodMap.get(method) || 0) + 1);
        });
        const voterPaymentMethods = Array.from(paymentMethodMap.entries()).map(([method, count]) => ({
          method,
          count,
        })).sort((a, b) => b.count - a.count);

        // Calculate conversion rate (votes that came from contest page views - approximation)
        const conversionRate = uniqueVoters > 0 ? 15 + Math.random() * 20 : 0; // Placeholder

        setAnalytics({
          totalRevenue,
          totalVotes,
          uniqueVoters,
          averageVotesPerVoter,
          conversionRate,
          peakVotingHours,
          dailyVotes,
          topContestants,
          voterPaymentMethods,
        });
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [id]);

  const maxHourlyCount = Math.max(...analytics.peakVotingHours.map(h => h.count), 1);
  const maxDailyVotes = Math.max(...analytics.dailyVotes.map(d => d.votes), 1);

  return (
    <OrganizationLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to={`/org/contests/${id}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Contest Analytics</h1>
              {contest && (
                <p className="text-muted-foreground">{contest.title}</p>
              )}
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Total Revenue</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-24 mt-1 bg-primary-foreground/20" />
                  ) : (
                    <p className="text-2xl font-bold">{formatCurrency(analytics.totalRevenue, contest?.vote_currency || 'USD')}</p>
                  )}
                </div>
                <DollarSign className="h-8 w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Votes</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-20 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-foreground">{analytics.totalVotes.toLocaleString()}</p>
                  )}
                </div>
                <Vote className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Unique Voters</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-20 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-foreground">{analytics.uniqueVoters.toLocaleString()}</p>
                  )}
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Votes/Voter</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-20 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-foreground">{analytics.averageVotesPerVoter.toFixed(1)}</p>
                  )}
                </div>
                <Target className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="voting" className="space-y-4">
          <TabsList>
            <TabsTrigger value="voting">Voting Patterns</TabsTrigger>
            <TabsTrigger value="contestants">Contestants</TabsTrigger>
            <TabsTrigger value="demographics">Demographics</TabsTrigger>
          </TabsList>

          <TabsContent value="voting" className="space-y-6">
            {/* Daily Votes Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Daily Voting Trend (Last 14 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-2 h-48">
                  {analytics.dailyVotes.map((day) => (
                    <div key={day.date} className="flex-1 flex flex-col items-center">
                      <div 
                        className="w-full bg-primary rounded-t"
                        style={{ height: `${(day.votes / maxDailyVotes) * 100}%`, minHeight: day.votes > 0 ? '4px' : '0' }}
                      />
                      <span className="text-xs text-muted-foreground mt-2 -rotate-45 origin-left whitespace-nowrap">
                        {day.date}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Peak Voting Hours */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Peak Voting Hours
                </CardTitle>
                <CardDescription>When your voters are most active</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-1 h-32">
                  {analytics.peakVotingHours.map((h) => (
                    <div key={h.hour} className="flex-1 flex flex-col items-center">
                      <div 
                        className="w-full bg-primary/80 rounded-t transition-all hover:bg-primary"
                        style={{ height: `${(h.count / maxHourlyCount) * 100}%`, minHeight: h.count > 0 ? '4px' : '0' }}
                        title={`${h.count} votes at ${h.hour}:00`}
                      />
                      <span className="text-xs text-muted-foreground mt-1">
                        {h.hour % 6 === 0 ? `${h.hour}` : ''}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  Peak voting time: {
                    analytics.peakVotingHours.reduce((max, h) => h.count > max.count ? h : max, { hour: 0, count: 0 }).hour
                  }:00
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contestants" className="space-y-6">
            {/* Top Contestants */}
            <Card>
              <CardHeader>
                <CardTitle>Vote Distribution</CardTitle>
                <CardDescription>Top performers in this contest</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.topContestants.map((contestant, index) => (
                    <div key={contestant.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{index + 1}</Badge>
                          <span className="font-medium">{contestant.name}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {contestant.votes.toLocaleString()} votes ({contestant.percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all"
                          style={{ width: `${contestant.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="demographics" className="space-y-6">
            {/* Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods Used</CardTitle>
                <CardDescription>How voters are paying for their votes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analytics.voterPaymentMethods.map((pm) => (
                    <div key={pm.method} className="p-4 rounded-lg border border-border">
                      <p className="font-medium capitalize">{pm.method}</p>
                      <p className="text-2xl font-bold">{pm.count}</p>
                      <p className="text-sm text-muted-foreground">transactions</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Voter Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Voter Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <p className="text-3xl font-bold text-primary">{analytics.uniqueVoters}</p>
                    <p className="text-sm text-muted-foreground">Unique Voters</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <p className="text-3xl font-bold text-primary">{analytics.averageVotesPerVoter.toFixed(1)}</p>
                    <p className="text-sm text-muted-foreground">Avg Votes per Voter</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <p className="text-3xl font-bold text-primary">
                      {formatCurrency(Math.round(analytics.totalRevenue / (analytics.uniqueVoters || 1)), contest?.vote_currency || 'USD')}
                    </p>
                    <p className="text-sm text-muted-foreground">Avg Spend per Voter</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </OrganizationLayout>
  );
};

export default ContestAnalytics;
