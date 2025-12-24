import React from 'react';
import { Link } from 'react-router-dom';
import OrganizationLayout from '@/components/layout/OrganizationLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useOrganizationStats, useOrganizationContests, useOrganizationEvents, usePayouts } from '@/hooks/useOrganization';
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
  PlusCircle
} from 'lucide-react';
import { format } from 'date-fns';

const OrgDashboard = () => {
  const { data: stats, isLoading: statsLoading } = useOrganizationStats();
  const { data: contests, isLoading: contestsLoading } = useOrganizationContests();
  const { data: events, isLoading: eventsLoading } = useOrganizationEvents();
  const { data: payouts, isLoading: payoutsLoading } = usePayouts();

  const pendingPayouts = payouts?.filter(p => p.status === 'pending') || [];

  return (
    <OrganizationLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Organization Dashboard</h1>
            <p className="text-muted-foreground">Manage your contests, events, and finances.</p>
          </div>
          <div className="flex gap-2">
            <Link to="/org/contests/create">
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Contest
              </Button>
            </Link>
            <Link to="/org/events/create">
              <Button variant="outline">
                <PlusCircle className="mr-2 h-4 w-4" />
                New Event
              </Button>
            </Link>
          </div>
        </div>

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
                      ₦{stats?.totalRevenue?.toLocaleString() || '0.00'}
                    </p>
                  )}
                </div>
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Available Balance */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Available Balance</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-foreground">
                      ₦{stats?.availableBalance?.toLocaleString() || '0.00'}
                    </p>
                  )}
                </div>
                <div className="h-12 w-12 rounded-xl bg-chart-2/10 flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-chart-2" />
                </div>
              </div>
              <Link to="/org/payouts">
                <Button variant="link" className="px-0 mt-2">
                  Request Payout <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
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
                ₦{stats?.voteRevenue?.toLocaleString() || '0'} in revenue
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
                ₦{stats?.ticketRevenue?.toLocaleString() || '0'} in revenue
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
                    ₦{stats?.pendingPayouts?.toLocaleString() || '0'}
                  </p>
                </div>
                <CreditCard className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

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

        {/* Pending Payouts */}
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
                      <p className="font-medium">₦{payout.amount.toLocaleString()}</p>
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
