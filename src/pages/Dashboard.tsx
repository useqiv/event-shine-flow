import React from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  StatsGridSkeleton, 
  CardSkeleton, 
  ListSkeleton 
} from '@/components/ui/loading-skeletons';
import { useWallet } from '@/hooks/useWallet';
import { useFeaturedContests } from '@/hooks/useContests';
import { useFeaturedEvents } from '@/hooks/useEvents';
import { useMyTickets } from '@/hooks/useEvents';
import { useMyVotes } from '@/hooks/useContests';
import { useNotifications } from '@/hooks/useNotifications';
import { VotingAnalytics } from '@/components/dashboard/VotingAnalytics';
import { TicketReminders } from '@/components/dashboard/TicketReminders';
import { ContestCountdowns } from '@/components/dashboard/ContestCountdowns';
import { EventCalendar } from '@/components/dashboard/EventCalendar';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { DashboardSearch } from '@/components/dashboard/DashboardSearch';
import { RecentActivityFeed } from '@/components/dashboard/RecentActivityFeed';
import { PersonalizedRecommendations } from '@/components/dashboard/PersonalizedRecommendations';
import { FavoriteContestantsQuickView } from '@/components/dashboard/FavoriteContestantsQuickView';
import { 
  Wallet, 
  Trophy, 
  Calendar, 
  Ticket, 
  Vote, 
  Bell, 
  ArrowRight,
  TrendingUp,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';

// Stat card skeleton with icon placeholder
const StatCardSkeleton = () => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-20" />
        </div>
        <Skeleton className="h-12 w-12 rounded-xl" />
      </div>
      <Skeleton className="h-4 w-28 mt-4" />
    </CardContent>
  </Card>
);

// List card skeleton for notifications/contests/events
const ListCardSkeleton = ({ title, icon: Icon }: { title: string; icon: React.ElementType }) => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-lg flex items-center gap-2">
        <Icon className="h-5 w-5" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3 p-2 rounded-lg">
            <Skeleton className="h-12 w-12 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
        <Skeleton className="h-9 w-full rounded-md" />
      </div>
    </CardContent>
  </Card>
);

// Recent votes skeleton
const RecentVotesSkeleton = () => (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg flex items-center gap-2">
        <Vote className="h-5 w-5" />
        My Recent Votes
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-secondary/30">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
            <div className="text-right space-y-2">
              <Skeleton className="h-4 w-16 ml-auto" />
              <Skeleton className="h-3 w-20 ml-auto" />
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const { data: wallet, isLoading: walletLoading } = useWallet();
  const { data: featuredContests, isLoading: contestsLoading } = useFeaturedContests();
  const { data: featuredEvents, isLoading: eventsLoading } = useFeaturedEvents();
  const { data: myTickets, isLoading: ticketsLoading } = useMyTickets();
  const { data: myVotes, isLoading: votesLoading } = useMyVotes();
  const { data: notifications, isLoading: notificationsLoading } = useNotifications();

  const unreadNotifications = notifications?.filter(n => !n.is_read) || [];
  const recentNotifications = unreadNotifications.slice(0, 3);

  // Show full page skeleton when primary data is loading
  const isInitialLoading = walletLoading && contestsLoading && eventsLoading;

  if (isInitialLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          {/* Welcome Section */}
          <div className="space-y-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-5 w-64" />
          </div>

          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>

          {/* Three Column Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ListCardSkeleton title="Notifications" icon={Bell} />
            <ListCardSkeleton title="Trending Contests" icon={TrendingUp} />
            <ListCardSkeleton title="Upcoming Events" icon={Clock} />
          </div>

          {/* Recent Votes Skeleton */}
          <RecentVotesSkeleton />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 w-full max-w-full overflow-hidden">
        {/* Welcome Section with Search */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here's what's happening.</p>
          </div>
          <div className="w-full md:w-80">
            <DashboardSearch />
          </div>
        </div>

        {/* Quick Actions */}
        <QuickActions />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Wallet Balance */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Wallet Balance</p>
                  {walletLoading ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-foreground">
                      ₦{wallet?.balance?.toLocaleString() || '0.00'}
                    </p>
                  )}
                </div>
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-primary" />
                </div>
              </div>
              <Link to="/wallet">
                <Button variant="link" className="px-0 mt-2">
                  Fund Wallet <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Active Contests */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Contests</p>
                  {contestsLoading ? (
                    <Skeleton className="h-8 w-16 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-foreground">
                      {featuredContests?.length || 0}
                    </p>
                  )}
                </div>
                <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-accent" />
                </div>
              </div>
              <Link to="/contests">
                <Button variant="link" className="px-0 mt-2">
                  View All <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Upcoming Events</p>
                  {eventsLoading ? (
                    <Skeleton className="h-8 w-16 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-foreground">
                      {featuredEvents?.length || 0}
                    </p>
                  )}
                </div>
                <div className="h-12 w-12 rounded-xl bg-chart-3/10 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-chart-3" />
                </div>
              </div>
              <Link to="/events">
                <Button variant="link" className="px-0 mt-2">
                  Browse Events <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* My Tickets */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">My Tickets</p>
                  {ticketsLoading ? (
                    <Skeleton className="h-8 w-16 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-foreground">
                      {myTickets?.length || 0}
                    </p>
                  )}
                </div>
                <div className="h-12 w-12 rounded-xl bg-chart-4/10 flex items-center justify-center">
                  <Ticket className="h-6 w-6 text-chart-4" />
                </div>
              </div>
              <Link to="/my-tickets">
                <Button variant="link" className="px-0 mt-2">
                  View Tickets <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Notifications */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notifications
                </CardTitle>
                {unreadNotifications.length > 0 && (
                  <Badge>{unreadNotifications.length} new</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {recentNotifications.length > 0 ? (
                <div className="space-y-3">
                  {recentNotifications.map((notification) => (
                    <div key={notification.id} className="flex gap-3 p-2 rounded-lg bg-secondary/50">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Bell className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{notification.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{notification.message}</p>
                      </div>
                    </div>
                  ))}
                  <Link to="/notifications">
                    <Button variant="outline" size="sm" className="w-full">
                      View All Notifications
                    </Button>
                  </Link>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No new notifications
                </p>
              )}
            </CardContent>
          </Card>

          {/* Trending Contests */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Trending Contests
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {contestsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : featuredContests && featuredContests.length > 0 ? (
                <div className="space-y-3">
                  {featuredContests.slice(0, 3).map((contest) => (
                    <Link key={contest.id} to={`/contests/${contest.id}`}>
                      <div className="flex gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors">
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
                        </div>
                        <Badge variant="secondary">{contest.category}</Badge>
                      </div>
                    </Link>
                  ))}
                  <Link to="/contests">
                    <Button variant="outline" size="sm" className="w-full">
                      View All Contests
                    </Button>
                  </Link>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No active contests
                </p>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Upcoming Events
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {eventsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : featuredEvents && featuredEvents.length > 0 ? (
                <div className="space-y-3">
                  {featuredEvents.slice(0, 3).map((event) => (
                    <Link key={event.id} to={`/events/${event.id}`}>
                      <div className="flex gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors">
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
                      </div>
                    </Link>
                  ))}
                  <Link to="/events">
                    <Button variant="outline" size="sm" className="w-full">
                      View All Events
                    </Button>
                  </Link>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No upcoming events
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Personalized Recommendations & Favorites */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PersonalizedRecommendations />
          <FavoriteContestantsQuickView />
        </div>

        {/* New Feature Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TicketReminders />
          <ContestCountdowns />
        </div>

        {/* Event Calendar */}
        <EventCalendar />

        {/* Voting Analytics */}
        <VotingAnalytics />

        {/* Recent Activity Feed */}
        <RecentActivityFeed />
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
