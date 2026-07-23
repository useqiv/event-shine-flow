import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import OrganizationLayout from '@/components/layout/OrganizationLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOrganizationStats, useOrganizationContests, useOrganizationEvents, usePayouts, useOrganizationSettings } from '@/hooks/useOrganization';
import { useOrgMonthlyGoalMetrics } from '@/hooks/useOrgMonthlyGoalMetrics';
import { useOrganizationCampaigns } from '@/hooks/useCampaigns';
import { useOrgPermissions } from '@/hooks/useOrgPermissions';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/contexts/AuthContext';
import { useOrgRealtimeStats } from '@/hooks/useOrgRealtimeStats';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  fetchPlatformCommissionSettings,
  resolveOrgCommissionRates,
} from '@/lib/platformCommission';
import AdvancedRevenueChart from '@/components/org/AdvancedRevenueChart';
import TopPerformersWidget from '@/components/org/TopPerformersWidget';
import EventCountdownWidget from '@/components/org/EventCountdownWidget';
import GoalTrackingWidget from '@/components/org/GoalTrackingWidget';
import PayoutStatusAlert from '@/components/org/PayoutStatusAlert';
import RevenueForecastWidget from '@/components/org/RevenueForecastWidget';
import ExportRevenueButton from '@/components/org/ExportRevenueButton';
import OrgOnboardingChecklist from '@/components/org/OrgOnboardingChecklist';
import MarketingPulseWidget from '@/components/org/MarketingPulseWidget';
import { formatCurrency, currencies } from '@/components/ui/currency-selector';
import { 
  Trophy, 
  Calendar, 
  Ticket, 
  Vote, 
  TrendingUp,
  CreditCard,
  Heart,
  Zap
} from 'lucide-react';
import { format } from 'date-fns';

const OrgDashboard = () => {
  const { user } = useAuth();
  const { data: role } = useUserRole();
  const { data: permissions } = useOrgPermissions();
  const orgId = permissions?.organizationId ?? (role === 'organization' ? user?.id : undefined);

  const { data: stats, isLoading: statsLoading } = useOrganizationStats();
  const { data: contests, isLoading: contestsLoading } = useOrganizationContests();
  const { data: events, isLoading: eventsLoading } = useOrganizationEvents();
  const { data: campaigns, isLoading: campaignsLoading } = useOrganizationCampaigns(orgId);
  const { data: payouts, isLoading: payoutsLoading } = usePayouts();
  const { data: orgSettings, isLoading: orgSettingsLoading } = useOrganizationSettings();

  // Enable real-time updates
  useOrgRealtimeStats();

  // Currency state - defaults to org's default currency, then allows switching
  const [displayCurrency, setDisplayCurrency] = useState<string>('USD');
  
  // Update display currency when org settings load
  useEffect(() => {
    if (orgSettings?.default_currency) {
      setDisplayCurrency(orgSettings.default_currency);
    }
  }, [orgSettings?.default_currency]);

  const { data: goalMetrics, isLoading: goalsLoading } = useOrgMonthlyGoalMetrics(
    displayCurrency,
    orgSettings,
  );

  const campaignsInCurrency = useMemo(
    () => campaigns?.filter((c) => c.currency === displayCurrency) || [],
    [campaigns, displayCurrency],
  );

  const activeCampaignsInCurrency = useMemo(
    () =>
      campaignsInCurrency.filter(
        (c) => c.status === 'active' && (!c.end_date || new Date(c.end_date) > new Date()),
      ).length,
    [campaignsInCurrency],
  );

  // Fetch platform commission settings (rates live in category=public)
  const { data: commissionSettings } = useQuery({
    queryKey: ['platform-commission-settings'],
    queryFn: fetchPlatformCommissionSettings,
  });

  // Fetch organization-specific commission rates
  const { data: orgApproval } = useQuery({
    queryKey: ['org-approval-commission'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('organization_approvals')
        .select('vote_commission_rate, ticket_commission_rate, special_commission_rate')
        .eq('organization_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
  });

  const pendingPayouts = payouts?.filter(p => p.status === 'pending') || [];

  // Calculate commission rates - org-specific rates take priority over platform defaults
  const { voteCommissionRate: voteCommission, ticketCommissionRate: ticketCommission } =
    resolveOrgCommissionRates(commissionSettings || {}, orgApproval);
  const hasCustomRate = orgApproval?.vote_commission_rate != null || orgApproval?.ticket_commission_rate != null || orgApproval?.special_commission_rate != null;
  
  // Filter revenue by selected currency - only show revenue from contests/events natively set in that currency
  const getRevenueForCurrency = (revenueByCurrency: Record<string, number> | undefined) => {
    if (!revenueByCurrency) return 0;
    return revenueByCurrency[displayCurrency] || 0;
  };

  // Get revenue only for the selected currency (no conversion, pure filtering)
  const displayVoteRevenue = getRevenueForCurrency(stats?.voteRevenueByCurrency);
  const displayTicketRevenue = getRevenueForCurrency(stats?.ticketRevenueByCurrency);
  const displayCampaignRevenue = getRevenueForCurrency(stats?.campaignRevenueByCurrency);
  const displayTotalRevenue = displayVoteRevenue + displayTicketRevenue + displayCampaignRevenue;
  
  // Use centralized net revenue calculation from hook
  const displayNetRevenue = stats?.netRevenueByCurrency?.[displayCurrency] || 0;
  const displayTotalCommission = displayTotalRevenue - displayNetRevenue;
  
  // Use centralized available balance calculation from hook
  const displayAvailableBalance = stats?.availableBalanceByCurrency?.[displayCurrency] || 0;
  
  // Pending payouts for selected currency
  const displayPendingPayouts = stats?.pendingPayoutsByCurrency?.[displayCurrency] || 0;
  // Show full page skeleton during initial load
  const isInitialLoading = statsLoading && contestsLoading && eventsLoading;

  if (isInitialLoading) {
    return (
      <OrganizationLayout>
        <div className="space-y-6">
          {/* Header Skeleton */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-8 w-56" />
              <Skeleton className="h-5 w-72" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>

          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-3 sm:pt-6 sm:px-6">
                  <div className="flex items-center justify-between gap-2">
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-3 sm:h-4 w-16 sm:w-24" />
                      <Skeleton className="h-6 sm:h-8 w-12 sm:w-28" />
                    </div>
                    <Skeleton className="h-8 w-8 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl flex-shrink-0" />
                  </div>
                  <Skeleton className="h-3 sm:h-4 w-20 sm:w-32 mt-2 sm:mt-3" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Secondary Stats Skeleton */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-3 sm:pt-6 sm:px-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="space-y-2">
                      <Skeleton className="h-3 sm:h-4 w-14 sm:w-28" />
                      <Skeleton className="h-5 sm:h-8 w-8 sm:w-16" />
                    </div>
                    <Skeleton className="h-5 w-5 sm:h-8 sm:w-8 hidden sm:block" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Chart Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-56 mt-1" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>

          {/* Contests & Events Lists Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[1, 2, 3].map((j) => (
                      <div key={j} className="flex gap-3 p-3 rounded-lg border border-border">
                        <Skeleton className="h-12 w-12 rounded-lg flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </OrganizationLayout>
    );
  }

  return (
    <OrganizationLayout>
      <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-hidden">
        {/* Welcome Section */}
        <div className="flex flex-col gap-3 sm:gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">Organization Dashboard</h1>
              <Badge variant="outline" className="gap-1 text-xs">
                <Zap className="h-3 w-3 text-green-500" />
                Live
              </Badge>
            </div>
            <p className="text-muted-foreground text-xs sm:text-sm md:text-base">
              Manage your contests, events, campaigns, and finances.
            </p>
          </div>
          
          {/* Currency + export toolbar */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs sm:text-sm text-muted-foreground shrink-0">Display:</span>
            <Select value={displayCurrency} onValueChange={setDisplayCurrency}>
              <SelectTrigger className="w-[90px] sm:w-[120px] h-8 sm:h-10 text-xs sm:text-sm">
                <SelectValue placeholder="Currency" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {currencies.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.symbol} {currency.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="outline" className="text-xs hidden sm:flex">
                    Filtered
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    Showing revenue from contests, events, and campaigns with {displayCurrency} as their native currency
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            </div>
            <div className="ml-auto shrink-0">
              <ExportRevenueButton currency={displayCurrency} />
            </div>
          </div>

        </div>

        {/* Getting started checklist for new organizations */}
        <OrgOnboardingChecklist />

        {/* Payout Status Alerts */}
        {payouts && payouts.length > 0 && (
          <PayoutStatusAlert 
            payouts={payouts} 
            currency={orgSettings?.default_currency || 'USD'} 
          />
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 min-[400px]:grid-cols-3 gap-2 sm:gap-4 w-full min-w-0">

          {/* Total Votes */}
          <Card>
            <CardContent className="p-3 sm:pt-6 sm:px-6">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">Total Votes</p>
                  {statsLoading ? (
                    <Skeleton className="h-6 sm:h-8 w-12 sm:w-16 mt-1" />
                  ) : (
                    <p className="text-base sm:text-xl lg:text-2xl font-bold text-foreground">
                      {stats?.totalVotes?.toLocaleString() || 0}
                    </p>
                  )}
                </div>
                <div className="h-8 w-8 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <Vote className="h-4 w-4 sm:h-6 sm:w-6 text-accent" />
                </div>
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 sm:mt-2 truncate">
                {formatCurrency(displayVoteRevenue, displayCurrency)} revenue
              </p>
            </CardContent>
          </Card>

          {/* Tickets Sold */}
          <Card>
            <CardContent className="p-3 sm:pt-6 sm:px-6">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">Tickets Sold</p>
                  {statsLoading ? (
                    <Skeleton className="h-6 sm:h-8 w-12 sm:w-16 mt-1" />
                  ) : (
                    <p className="text-base sm:text-xl lg:text-2xl font-bold text-foreground">
                      {stats?.ticketsSold?.toLocaleString() || 0}
                    </p>
                  )}
                </div>
                <div className="h-8 w-8 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl bg-chart-3/10 flex items-center justify-center flex-shrink-0">
                  <Ticket className="h-4 w-4 sm:h-6 sm:w-6 text-chart-3" />
                </div>
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 sm:mt-2 truncate">
                {formatCurrency(displayTicketRevenue, displayCurrency)} revenue
              </p>
            </CardContent>
          </Card>

          {/* Campaign fundraising */}
          <Card>
            <CardContent className="p-3 sm:pt-6 sm:px-6">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">Campaign Raised</p>
                  {statsLoading ? (
                    <Skeleton className="h-6 sm:h-8 w-12 sm:w-16 mt-1" />
                  ) : (
                    <p className="text-base sm:text-xl lg:text-2xl font-bold text-foreground truncate">
                      {formatCurrency(displayCampaignRevenue, displayCurrency)}
                    </p>
                  )}
                </div>
                <div className="h-8 w-8 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl bg-chart-4/10 flex items-center justify-center flex-shrink-0">
                  <Heart className="h-4 w-4 sm:h-6 sm:w-6 text-chart-4" />
                </div>
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 sm:mt-2 truncate">
                {stats?.totalDonations?.toLocaleString() || 0} total donations
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-2 min-[500px]:grid-cols-4 gap-2 sm:gap-4 w-full min-w-0">
          <Card>
            <CardContent className="p-3 sm:pt-6 sm:px-6">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground">Active Contests</p>
                  <p className="text-lg sm:text-2xl font-bold text-foreground">
                    {stats?.activeContests || 0}
                  </p>
                </div>
                <Trophy className="h-5 w-5 sm:h-8 sm:w-8 text-muted-foreground shrink-0" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:pt-6 sm:px-6">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground">Active Events</p>
                  <p className="text-lg sm:text-2xl font-bold text-foreground">
                    {stats?.activeEvents || 0}
                  </p>
                </div>
                <Calendar className="h-5 w-5 sm:h-8 sm:w-8 text-muted-foreground shrink-0" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:pt-6 sm:px-6">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground">Active Campaigns</p>
                  <p className="text-lg sm:text-2xl font-bold text-foreground">
                    {activeCampaignsInCurrency || stats?.activeCampaigns || 0}
                  </p>
                </div>
                <Heart className="h-5 w-5 sm:h-8 sm:w-8 text-muted-foreground shrink-0" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:pt-6 sm:px-6">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground">Pending Payouts</p>
                  <p className="text-sm sm:text-2xl font-bold text-foreground truncate">
                    {formatCurrency(displayPendingPayouts, displayCurrency)}
                  </p>
                </div>
                <CreditCard className="h-5 w-5 sm:h-8 sm:w-8 text-muted-foreground shrink-0" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Goal Tracking Widget */}
        <GoalTrackingWidget
          currency={displayCurrency}
          currentMonth={
            goalMetrics?.currentMonth ?? {
              revenue: 0,
              votes: 0,
              tickets: 0,
              donations: 0,
            }
          }
          targets={
            goalMetrics?.targets ?? {
              revenue: 0,
              votes: 0,
              tickets: 0,
              donations: 0,
              source: 'starter',
            }
          }
          isLoading={goalsLoading}
        />

        {/* Advanced Revenue Chart */}
        <AdvancedRevenueChart currency={displayCurrency} onCurrencyChange={setDisplayCurrency} />

        {/* Revenue Forecast Widget */}
        <RevenueForecastWidget currency={displayCurrency} />

        {/* Event Countdown Widget */}
        {events && events.length > 0 && (
          <EventCountdownWidget events={events} />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 w-full min-w-0">
          {/* Recent Contests */}
          <Card>
            <CardHeader className="pb-3 px-3 sm:px-6">
              <div className="flex items-center justify-between gap-2 min-w-0">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2 min-w-0">
                  <Trophy className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                  <span className="truncate">Your Contests</span>
                </CardTitle>
                <Link to="/org/contests" className="shrink-0">
                  <Button variant="ghost" size="sm" className="h-8 px-2 sm:px-3 text-xs sm:text-sm">View All</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {contestsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : contests && contests.length > 0 ? (
                <div className="space-y-3">
                  {contests.slice(0, 4).map((contest: any) => (
                    <Link key={contest.id} to={`/org/contests/${contest.id}`}>
                      <div className="flex gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg hover:bg-secondary/50 transition-colors border border-border items-center min-w-0">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-secondary overflow-hidden flex-shrink-0">
                          {contest.image_url ? (
                            <img src={contest.image_url} alt={contest.title} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <Trophy className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{contest.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {contest.total_votes.toLocaleString()} votes
                          </p>
                        </div>
                        <Badge variant={contest.is_active ? "default" : "secondary"} className="shrink-0 text-[10px] sm:text-xs">
                          {contest.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No contests yet</p>
                  <Link to="/org/contests/create">
                    <Button variant="outline" size="sm" className="mt-3">
                      Create Your First Contest
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Events */}
          <Card>
            <CardHeader className="pb-3 px-3 sm:px-6">
              <div className="flex items-center justify-between gap-2 min-w-0">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2 min-w-0">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                  <span className="truncate">Your Events</span>
                </CardTitle>
                <Link to="/org/events" className="shrink-0">
                  <Button variant="ghost" size="sm" className="h-8 px-2 sm:px-3 text-xs sm:text-sm">View All</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {eventsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : events && events.length > 0 ? (
                <div className="space-y-3">
                  {events.slice(0, 4).map((event: any) => (
                    <Link key={event.id} to={`/org/events/${event.id}`}>
                      <div className="flex gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg hover:bg-secondary/50 transition-colors border border-border items-center min-w-0">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-secondary overflow-hidden flex-shrink-0">
                          {event.image_url ? (
                            <img src={event.image_url} alt={event.title} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <Calendar className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{event.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(event.event_date), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <Badge variant={event.is_active ? "default" : "secondary"} className="shrink-0 text-[10px] sm:text-xs">
                          {event.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No events yet</p>
                  <Link to="/org/events/create">
                    <Button variant="outline" size="sm" className="mt-3">
                      Create Your First Event
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Campaigns */}
          <Card>
            <CardHeader className="pb-3 px-3 sm:px-6">
              <div className="flex items-center justify-between gap-2 min-w-0">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2 min-w-0">
                  <Heart className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                  <span className="truncate">Your Campaigns</span>
                </CardTitle>
                <Link to="/org/campaigns" className="shrink-0">
                  <Button variant="ghost" size="sm" className="h-8 px-2 sm:px-3 text-xs sm:text-sm">View All</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {campaignsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : campaigns && campaigns.length > 0 ? (
                <div className="space-y-3">
                  {campaigns.slice(0, 4).map((campaign) => {
                    const progress =
                      campaign.goal_amount > 0
                        ? Math.min((campaign.current_amount / campaign.goal_amount) * 100, 100)
                        : 0;

                    return (
                      <Link key={campaign.id} to={`/org/campaigns/${campaign.id}/analytics`}>
                        <div className="flex gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg hover:bg-secondary/50 transition-colors border border-border items-center min-w-0">
                          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-secondary overflow-hidden flex-shrink-0">
                            {campaign.image_url ? (
                              <img
                                src={campaign.image_url}
                                alt={campaign.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center">
                                <Heart className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{campaign.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatCurrency(campaign.current_amount, campaign.currency)} raised
                              {campaign.goal_amount > 0 &&
                                ` · ${progress.toFixed(0)}% of goal`}
                            </p>
                            {campaign.goal_amount > 0 && (
                              <Progress value={progress} className="h-1.5 mt-2" />
                            )}
                          </div>
                          <Badge
                            variant={campaign.status === 'active' ? 'default' : 'secondary'}
                            className="shrink-0 text-[10px] sm:text-xs capitalize"
                          >
                            {campaign.status}
                          </Badge>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No campaigns yet</p>
                  <Link to="/campaigns/create">
                    <Button variant="outline" size="sm" className="mt-3">
                      Create Your First Campaign
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Performers Widget */}
        <TopPerformersWidget />

        {/* Marketing pulse + full analytics link */}
        <MarketingPulseWidget />

        {/* Pending Payouts - Legacy view for detailed list */}
        {pendingPayouts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Pending Payouts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingPayouts.slice(0, 3).map((payout) => (
                  <div key={payout.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-secondary/30 min-w-0">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{formatCurrency(payout.amount, orgSettings?.default_currency || 'USD')}</p>
                      <p className="text-xs text-muted-foreground">
                        Requested {format(new Date(payout.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <Badge variant="outline">Pending</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </OrganizationLayout>
  );
};

export default OrgDashboard;
