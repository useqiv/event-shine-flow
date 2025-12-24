import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '@/hooks/useNotifications';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, Vote, Ticket, Wallet, CheckCheck } from 'lucide-react';
import { format } from 'date-fns';

const Notifications = () => {
  const { data: notifications, isLoading } = useNotifications();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

  const getIcon = (type: string) => {
    switch (type) {
      case 'vote': return <Vote className="h-4 w-4 text-primary" />;
      case 'ticket': return <Ticket className="h-4 w-4 text-accent" />;
      case 'wallet': return <Wallet className="h-4 w-4 text-green-500" />;
      default: return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={() => markAllAsRead.mutate()}>
              <CheckCheck className="h-4 w-4 mr-2" /> Mark all read
            </Button>
          )}
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : notifications && notifications.length > 0 ? (
              <div className="divide-y divide-border">
                {notifications.map(notification => (
                  <div 
                    key={notification.id} 
                    className={`p-4 flex gap-4 ${!notification.is_read ? 'bg-primary/5' : ''}`}
                    onClick={() => !notification.is_read && markAsRead.mutate(notification.id)}
                  >
                    <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{notification.title}</p>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{format(new Date(notification.created_at), 'MMM d, yyyy HH:mm')}</p>
                    </div>
                    {!notification.is_read && <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-2" />}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No notifications</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Notifications;
