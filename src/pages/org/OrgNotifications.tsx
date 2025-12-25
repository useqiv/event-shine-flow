import React, { useState } from 'react';
import OrganizationLayout from '@/components/layout/OrganizationLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '@/hooks/useNotifications';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Bell, 
  Ticket, 
  AlertTriangle, 
  CheckCheck, 
  TrendingUp,
  Calendar,
  Trophy,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';

const OrgNotifications = () => {
  const { data: notifications, isLoading } = useNotifications();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

  const getIcon = (type: string) => {
    switch (type) {
      case 'ticket_milestone': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'auto_post_failure': return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'event': return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'contest': return <Trophy className="h-4 w-4 text-primary" />;
      case 'ticket': return <Ticket className="h-4 w-4 text-accent" />;
      default: return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'ticket_milestone':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">Milestone</Badge>;
      case 'auto_post_failure':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">Auto-Post</Badge>;
      case 'event':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">Event</Badge>;
      case 'contest':
        return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Contest</Badge>;
      default:
        return <Badge variant="outline">System</Badge>;
    }
  };

  const filteredNotifications = notifications?.filter(n => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'unread') return !n.is_read;
    if (activeFilter === 'milestones') return n.type === 'ticket_milestone';
    if (activeFilter === 'failures') return n.type === 'auto_post_failure';
    return true;
  });

  const milestoneCount = notifications?.filter(n => n.type === 'ticket_milestone').length || 0;
  const failureCount = notifications?.filter(n => n.type === 'auto_post_failure').length || 0;

  return (
    <OrganizationLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Notification Center</h1>
            <p className="text-muted-foreground">Stay updated on your events and contests</p>
          </div>
          {unreadCount > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => markAllAsRead.mutate()}
              disabled={markAllAsRead.isPending}
            >
              <CheckCheck className="h-4 w-4 mr-2" /> 
              Mark all as read ({unreadCount})
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setActiveFilter('all')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{notifications?.length || 0}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setActiveFilter('unread')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Bell className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{unreadCount}</p>
                  <p className="text-xs text-muted-foreground">Unread</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setActiveFilter('milestones')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{milestoneCount}</p>
                  <p className="text-xs text-muted-foreground">Milestones</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setActiveFilter('failures')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{failureCount}</p>
                  <p className="text-xs text-muted-foreground">Failures</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs */}
        <Tabs value={activeFilter} onValueChange={setActiveFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">
              Unread {unreadCount > 0 && <Badge className="ml-2 h-5 px-1.5">{unreadCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
            <TabsTrigger value="failures">Failures</TabsTrigger>
          </TabsList>

          <TabsContent value={activeFilter} className="mt-4">
            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : filteredNotifications && filteredNotifications.length > 0 ? (
                  <div className="divide-y divide-border">
                    {filteredNotifications.map(notification => (
                      <div 
                        key={notification.id} 
                        className={`p-4 flex gap-4 cursor-pointer hover:bg-muted/50 transition-colors ${!notification.is_read ? 'bg-primary/5' : ''}`}
                        onClick={() => !notification.is_read && markAsRead.mutate(notification.id)}
                      >
                        <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                          {getIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold">{notification.title}</p>
                              {getTypeBadge(notification.type)}
                            </div>
                            {!notification.is_read && (
                              <div className="h-2.5 w-2.5 rounded-full bg-primary flex-shrink-0 mt-2" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {format(new Date(notification.created_at), 'MMM d, yyyy \'at\' h:mm a')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="font-medium">No notifications</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {activeFilter === 'unread' 
                        ? "You're all caught up!" 
                        : activeFilter === 'milestones'
                        ? "No milestone notifications yet"
                        : activeFilter === 'failures'
                        ? "No failed auto-posts"
                        : "No notifications yet"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </OrganizationLayout>
  );
};

export default OrgNotifications;
