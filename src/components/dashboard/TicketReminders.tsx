import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMyTickets } from '@/hooks/useEvents';
import { Bell, Calendar, MapPin, Ticket, Clock } from 'lucide-react';
import { format, differenceInDays, differenceInHours, isAfter } from 'date-fns';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

export const TicketReminders = () => {
  const { data: tickets, isLoading } = useMyTickets();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Upcoming Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2].map(i => <Skeleton key={i} className="h-20" />)}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filter for upcoming events only and sort by date
  const upcomingTickets = tickets
    ?.filter((t: any) => isAfter(new Date(t.event?.event_date), new Date()))
    ?.sort((a: any, b: any) => 
      new Date(a.event?.event_date).getTime() - new Date(b.event?.event_date).getTime()
    )
    ?.slice(0, 5);

  if (!upcomingTickets || upcomingTickets.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Upcoming Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">No upcoming events with tickets.</p>
        </CardContent>
      </Card>
    );
  }

  const getTimeUntil = (eventDate: string) => {
    const days = differenceInDays(new Date(eventDate), new Date());
    const hours = differenceInHours(new Date(eventDate), new Date()) % 24;
    
    if (days === 0) {
      return { text: hours <= 0 ? 'Starting now!' : `${hours}h`, urgent: true };
    } else if (days === 1) {
      return { text: 'Tomorrow', urgent: true };
    } else if (days <= 3) {
      return { text: `${days} days`, urgent: true };
    } else if (days <= 7) {
      return { text: `${days} days`, urgent: false };
    }
    return { text: `${days} days`, urgent: false };
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Upcoming Events
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {upcomingTickets.map((ticket: any) => {
            const timeUntil = getTimeUntil(ticket.event?.event_date);
            
            return (
              <div 
                key={ticket.id} 
                className={`p-3 rounded-lg border ${
                  timeUntil.urgent 
                    ? 'border-accent/50 bg-accent/5' 
                    : 'border-border bg-secondary/30'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium truncate">{ticket.event?.title}</p>
                      {timeUntil.urgent && (
                        <Badge variant="destructive" className="text-xs shrink-0">
                          {timeUntil.text}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(ticket.event?.event_date), 'MMM d, yyyy')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(ticket.event?.event_date), 'h:mm a')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3" />
                      {ticket.event?.venue}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1 text-sm">
                      <Ticket className="h-4 w-4 text-primary" />
                      <span className="font-medium">{ticket.quantity}</span>
                    </div>
                    {!timeUntil.urgent && (
                      <p className="text-xs text-muted-foreground">{timeUntil.text}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          
          <Link to="/my-tickets">
            <Button variant="outline" size="sm" className="w-full">
              View All Tickets
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
