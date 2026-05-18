import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import OrganizationLayout from '@/components/layout/OrganizationLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/components/ui/currency-selector';
import MultiCurrencyRevenueSummary from '@/components/org/MultiCurrencyRevenueSummary';
import { getActiveRevenueCurrencies } from '@/lib/revenueByCurrency';
import { useContestAnalyticsData, useChartMaxValues } from '@/hooks/useContestAnalyticsData';
import { useContestRevenueByCurrency } from '@/hooks/useContestRevenueByCurrency';
import { useAuth } from '@/contexts/AuthContext';
import {
  Vote,
  Clock,
  ArrowLeft,
  DollarSign,
  Target,
  Calendar,
  Users,
  Megaphone,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  Info,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const ContestAnalytics = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { contest, analytics, isLoading, error, refetch } = useContestAnalyticsData(id);
  const {
    grossByCurrency: revenueByCurrencyAligned,
    totalVotes: revenueTotalVotes,
    listingVoteQuantity,
    listingCatalogGross,
  } = useContestRevenueByCurrency(id);
  const { maxHourlyCount, maxDailyVotes } = useChartMaxValues(analytics);
  const currency = contest?.vote_currency || 'NGN';
  const revenueByCurrency =
    Object.keys(revenueByCurrencyAligned).length > 0
      ? revenueByCurrencyAligned
      : analytics.revenueByCurrency;

  const { data: commissionData } = useQuery({
    queryKey: ['contest-analytics-commission', user?.id],
    queryFn: async () => {
      if (!user) return { voteCommission: 10 };

      const [{ data: orgApproval }, { data: platformSettings }] = await Promise.all([
        supabase
          .from('organization_approvals')
          .select('vote_commission_rate, special_commission_rate')
          .eq('organization_id', user.id)
          .maybeSingle(),
        supabase
          .from('platform_settings')
          .select('setting_key, setting_value')
          .eq('category', 'commission'),
      ]);

      const settings: Record<string, number> = {};
      platformSettings?.forEach((s) => {
        settings[s.setting_key] = Number(s.setting_value) || 0;
      });

      const platformVoteCommission =
        settings.vote_commission_percentage || settings.platform_commission_percentage || 10;
      const voteCommission =
        orgApproval?.vote_commission_rate ??
        orgApproval?.special_commission_rate ??
        platformVoteCommission;

      return { voteCommission };
    },
    enabled: !!user,
  });

  const voteCommission = commissionData?.voteCommission ?? 10;
  const primaryCurrency = getActiveRevenueCurrencies(revenueByCurrency, currency)[0];
  const primaryGross = revenueByCurrency[primaryCurrency] || 0;
  const peakHour = analytics.peakVotingHours.reduce(
    (max, h) => (h.count > max.count ? h : max),
    { hour: 0, count: 0 }
  );

  if (error) {
    return (
      <OrganizationLayout>
        <div className="space-y-4 py-12 text-center">
          <Alert variant="destructive" className="text-left max-w-lg mx-auto">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Could not load analytics</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
            <Button asChild variant="outline">
              <Link to={`/org/contests/${id}`}>Back to Contest</Link>
            </Button>
          </div>
        </div>
      </OrganizationLayout>
    );
  }

  return (
    <OrganizationLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Link to={`/org/contests/${id}`}>
              <Button variant="ghost" size="icon" aria-label="Back to contest">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Contest Analytics</h1>
              {contest ? (
                <p className="text-muted-foreground">{contest.title}</p>
              ) : isLoading ? (
                <Skeleton className="h-4 w-48 mt-1" />
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to={`/org/contests/${id}/marketing`}>
              <Button variant="outline" size="sm">
                <Megaphone className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Marketing Hub</span>
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 sm:mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="md:col-span-2">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground mb-2">Revenue (by paid currency)</p>
                  {isLoading ? (
                    <Skeleton className="h-16 w-full" />
                  ) : (
                    <MultiCurrencyRevenueSummary
                      grossByCurrency={revenueByCurrency}
                      commissionRatePercent={voteCommission}
                      listingCurrency={currency}
                      totalVotes={revenueTotalVotes || analytics.totalVotes}
                      listingVoteQuantity={listingVoteQuantity}
                      listingCatalogGross={listingCatalogGross}
                      voteUnitPrice={Number(contest?.vote_price) || 0}
                      totalLabel="Gross Revenue"
                      netLabel={`Net (${voteCommission}% deducted)`}
                    />
                  )}
                </div>
                <DollarSign className="h-8 w-8 text-muted-foreground shrink-0" />
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
                    <p className="text-2xl font-bold text-foreground">
                      {(revenueTotalVotes || analytics.totalVotes).toLocaleString()}
                    </p>
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
                    <p className="text-2xl font-bold text-foreground">
                      {analytics.uniqueVoters.toLocaleString()}
                    </p>
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
                  <div className="flex items-center gap-1">
                    <p className="text-sm text-muted-foreground">Avg Votes/Voter</p>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs max-w-xs">
                            Based on unique voters (logged-in users or guest emails).
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  {isLoading ? (
                    <Skeleton className="h-8 w-20 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-foreground">
                      {analytics.averageVotesPerVoter.toFixed(1)}
                    </p>
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Daily Voting Trend (Last 14 Days)
                </CardTitle>
                <CardDescription>Votes and fee-free revenue by day</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-48 w-full" />
                ) : analytics.dailyVotes.every((d) => d.votes === 0) ? (
                  <p className="text-center text-muted-foreground py-12">
                    No votes recorded in the last 14 days.
                  </p>
                ) : (
                  <div className="flex items-end gap-2 h-48">
                    {analytics.dailyVotes.map((day) => (
                      <div key={day.date} className="flex-1 flex flex-col items-center min-w-0">
                        <div
                          className="w-full bg-primary rounded-t transition-all"
                          style={{
                            height: `${(day.votes / maxDailyVotes) * 100}%`,
                            minHeight: day.votes > 0 ? '4px' : '0',
                          }}
                          title={`${day.votes} votes · ${formatCurrency(day.revenue, currency)}`}
                        />
                        <span className="text-[10px] sm:text-xs text-muted-foreground mt-2 -rotate-45 origin-left whitespace-nowrap">
                          {day.date}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Peak Voting Hours
                </CardTitle>
                <CardDescription>When your voters are most active (by vote quantity)</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-32 w-full" />
                ) : peakHour.count === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No voting activity yet.</p>
                ) : (
                  <>
                    <div className="flex items-end gap-1 h-32">
                      {analytics.peakVotingHours.map((h) => (
                        <div key={h.hour} className="flex-1 flex flex-col items-center">
                          <div
                            className="w-full bg-primary/80 rounded-t transition-all hover:bg-primary"
                            style={{
                              height: `${(h.count / maxHourlyCount) * 100}%`,
                              minHeight: h.count > 0 ? '4px' : '0',
                            }}
                            title={`${h.count} votes at ${h.hour}:00`}
                          />
                          <span className="text-xs text-muted-foreground mt-1">
                            {h.hour % 6 === 0 ? `${h.hour}` : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mt-4">
                      Peak voting time: {peakHour.hour}:00 ({peakHour.count.toLocaleString()} votes)
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contestants" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Vote Distribution</CardTitle>
                <CardDescription>Top performers ranked by current vote count</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : analytics.topContestants.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No contestants yet. Add contestants from contest management to see distribution.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {analytics.topContestants.map((contestant, index) => (
                      <div key={`${contestant.name}-${index}`} className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <Badge variant="outline">{index + 1}</Badge>
                            <span className="font-medium truncate">{contestant.name}</span>
                          </div>
                          <span className="text-sm text-muted-foreground shrink-0">
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
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="demographics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods Used</CardTitle>
                <CardDescription>How voters paid for their votes</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-24" />
                    ))}
                  </div>
                ) : analytics.voterPaymentMethods.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No payment data yet.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {analytics.voterPaymentMethods.map((pm) => (
                      <div key={pm.method} className="p-4 rounded-lg border border-border">
                        <p className="font-medium capitalize">{pm.method.replace(/_/g, ' ')}</p>
                        <p className="text-2xl font-bold">{pm.count}</p>
                        <p className="text-sm text-muted-foreground">transactions</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Voter Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <p className="text-3xl font-bold text-primary">
                      {isLoading ? '—' : analytics.uniqueVoters}
                    </p>
                    <p className="text-sm text-muted-foreground">Unique Voters</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <p className="text-3xl font-bold text-primary">
                      {isLoading ? '—' : analytics.averageVotesPerVoter.toFixed(1)}
                    </p>
                    <p className="text-sm text-muted-foreground">Avg Votes per Voter</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <p className="text-3xl font-bold text-primary">
                      {isLoading
                        ? '—'
                        : formatCurrency(
                            Math.round(primaryGross / (analytics.uniqueVoters || 1)),
                            currency
                          )}
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
