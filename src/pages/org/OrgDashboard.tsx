import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import OrganizationLayout from '@/components/layout/OrganizationLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOrganizationStats, useOrganizationContests, useOrganizationEvents, usePayouts, useOrganizationSettings } from '@/hooks/useOrganization';
import { useOrgRealtimeStats } from '@/hooks/useOrgRealtimeStats';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdvancedRevenueChart from '@/components/org/AdvancedRevenueChart';
import TopPerformersWidget from '@/components/org/TopPerformersWidget';
import EventCountdownWidget from '@/components/org/EventCountdownWidget';
import GoalTrackingWidget from '@/components/org/GoalTrackingWidget';
import PayoutStatusAlert from '@/components/org/PayoutStatusAlert';
import RevenueForecastWidget from '@/components/org/RevenueForecastWidget';
import ExportRevenueButton from '@/components/org/ExportRevenueButton';
import { formatCurrency, currencies } from '@/components/ui/currency-selector';
import { 
  Wallet, 
  Trophy, 
  Calendar, 
  Ticket, 
  Vote, 
  ArrowRight,
  TrendingUp,
  CreditCard,
  DollarSign,
  Users,
  BarChart3,
  PlusCircle,
  TrendingDown,
  Info,
  Zap
} from 'lucide-react';
import { format } from 'date-fns';

const OrgDashboard = () => {
  const { data: stats, isLoading: statsLoading } = useOrganizationStats();
  const { data: contests, isLoading: contestsLoading } = useOrganizationContests();
  const { data: events, isLoading: eventsLoading } = useOrganizationEvents();
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

  // Fetch platform commission settings
  const { data: commissionSettings } = useQuery({
    queryKey: ['platform-commission-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('setting_key, setting_value')
        .eq('category', 'commission');
      
      if (error) throw error;
      
      // Parse into a convenient object
      const settings: Record<string, number> = {};
      data?.forEach((s: any) => {
        settings[s.setting_key] = Number(s.setting_value) || 0;
      });
      return settings;
    },
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
  const platformVoteCommission = commissionSettings?.vote_commission_percentage || commissionSettings?.platform_commission_percentage || 10;
  const platformTicketCommission = commissionSettings?.ticket_commission_percentage || commissionSettings?.platform_commission_percentage || 10;
  
  // Use org-specific rates if available, otherwise fall back to platform defaults
  const voteCommission = orgApproval?.vote_commission_rate ?? orgApproval?.special_commission_rate ?? platformVoteCommission;
  const ticketCommission = orgApproval?.ticket_commission_rate ?? orgApproval?.special_commission_rate ?? platformTicketCommission;
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-8 w-28" />
                    </div>
                    <Skeleton className="h-12 w-12 rounded-xl" />
                  </div>
                  <Skeleton className="h-4 w-32 mt-3" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Secondary Stats Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                    <Skeleton className="h-8 w-8" />
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
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="flex flex-col gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Organization Dashboard</h1>
              <Badge variant="outline" className="gap-1 text-xs">
                <Zap className="h-3 w-3 text-green-500" />
                Live
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm sm:text-base">Manage your contests, events, and finances.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Currency Selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground hidden lg:inline">Display in:</span>
              <Select value={displayCurrency} onValueChange={setDisplayCurrency}>
                <SelectTrigger className="w-[100px] sm:w-[120px]">
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
                      Showing only contests/events with {displayCurrency} as their native currency
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <ExportRevenueButton currency={displayCurrency} />
            <Link to="/org/contests/create">
              <Button size="sm" className="sm:size-default">
                <PlusCircle className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">New Contest</span>
              </Button>
            </Link>
            <Link to="/org/events/create">
              <Button variant="outline" size="sm" className="sm:size-default">
                <PlusCircle className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">New Event</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Payout Status Alerts */}
        {payouts && payouts.length > 0 && (
          <PayoutStatusAlert 
            payouts={payouts} 
            currency={orgSettings?.default_currency || 'USD'} 
          />
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Revenue */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-foreground">
                      {formatCurrency(displayTotalRevenue, displayCurrency)}
                    </p>
                  )}
                </div>
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Net Revenue */}
          <Card className="border-green-200 dark:border-green-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1">
                    <p className="text-sm text-muted-foreground">Net Revenue</p>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-xs">
                            After platform commission:<br/>
                            • Votes: {voteCommission}% commission<br/>
                            • Tickets: {ticketCommission}% commission<br/>
                            Total deducted: {formatCurrency(displayTotalCommission, displayCurrency)}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(displayNetRevenue, displayCurrency)}
                    </p>
                  )}
                </div>
                <div className="h-12 w-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Votes */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Votes</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-foreground">
                      {stats?.totalVotes?.toLocaleString() || 0}
                    </p>
                  )}
                </div>
                <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Vote className="h-6 w-6 text-accent" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {formatCurrency(displayVoteRevenue, displayCurrency)} in revenue
              </p>
            </CardContent>
          </Card>

          {/* Tickets Sold */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tickets Sold</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-foreground">
                      {stats?.ticketsSold?.toLocaleString() || 0}
                    </p>
                  )}
                </div>
                <div className="h-12 w-12 rounded-xl bg-chart-3/10 flex items-center justify-center">
                  <Ticket className="h-6 w-6 text-chart-3" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {formatCurrency(displayTicketRevenue, displayCurrency)} in revenue
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Contests</p>
                  <p className="text-2xl font-bold text-foreground">
                    {stats?.activeContests || 0}
                  </p>
                </div>
                <Trophy className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Events</p>
                  <p className="text-2xl font-bold text-foreground">
                    {stats?.activeEvents || 0}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Payouts</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(displayPendingPayouts, displayCurrency)}
                  </p>
                </div>
                <CreditCard className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Goal Tracking Widget */}
        <GoalTrackingWidget
          totalRevenue={displayTotalRevenue}
          totalVotes={stats?.totalVotes || 0}
          ticketsSold={stats?.ticketsSold || 0}
          currency={displayCurrency}
        />

        {/* Advanced Revenue Chart */}
        <AdvancedRevenueChart currency={displayCurrency} onCurrencyChange={setDisplayCurrency} />

        {/* Revenue Forecast Widget */}
        <RevenueForecastWidget currency={displayCurrency} />

        {/* Event Countdown Widget */}
        {events && events.length > 0 && (
          <EventCountdownWidget events={events} />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Contests */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Your Contests
                </CardTitle>
                <Link to="/org/contests">
                  <Button variant="ghost" size="sm">View All</Button>
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
                      <div className="flex gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors border border-border">
                        <div className="h-12 w-12 rounded-lg bg-secondary overflow-hidden flex-shrink-0">
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
                        <Badge variant={contest.is_active ? "default" : "secondary"}>
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
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Your Events
                </CardTitle>
                <Link to="/org/events">
                  <Button variant="ghost" size="sm">View All</Button>
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
                      <div className="flex gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors border border-border">
                        <div className="h-12 w-12 rounded-lg bg-secondary overflow-hidden flex-shrink-0">
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
                        <Badge variant={event.is_active ? "default" : "secondary"}>
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
        </div>

        {/* Top Performers Widget */}
        <TopPerformersWidget />

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
                  <div key={payout.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                    <div>
                      <p className="font-medium">{formatCurrency(payout.amount, orgSettings?.default_currency || 'USD')}</p>
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
