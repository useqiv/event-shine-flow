import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Calendar, MapPin, ArrowRight } from 'lucide-react';
import { format, differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds, isPast } from 'date-fns';

interface Event {
  id: string;
  title: string;
  event_date: string;
  venue: string;
  image_url?: string;
}

interface EventCountdownWidgetProps {
  events: Event[];
}

const CountdownTimer = ({ targetDate }: { targetDate: Date }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      if (isPast(targetDate)) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }
      
      const days = differenceInDays(targetDate, now);
      const hours = differenceInHours(targetDate, now) % 24;
      const minutes = differenceInMinutes(targetDate, now) % 60;
      const seconds = differenceInSeconds(targetDate, now) % 60;
      
      return { days, hours, minutes, seconds };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="flex gap-2 text-center">
      <div className="bg-primary/10 rounded-lg px-2 py-1 min-w-[40px]">
        <div className="text-lg font-bold text-primary">{timeLeft.days}</div>
        <div className="text-[10px] text-muted-foreground uppercase">Days</div>
      </div>
      <div className="bg-primary/10 rounded-lg px-2 py-1 min-w-[40px]">
        <div className="text-lg font-bold text-primary">{timeLeft.hours}</div>
        <div className="text-[10px] text-muted-foreground uppercase">Hrs</div>
      </div>
      <div className="bg-primary/10 rounded-lg px-2 py-1 min-w-[40px]">
        <div className="text-lg font-bold text-primary">{timeLeft.minutes}</div>
        <div className="text-[10px] text-muted-foreground uppercase">Min</div>
      </div>
      <div className="bg-primary/10 rounded-lg px-2 py-1 min-w-[40px]">
        <div className="text-lg font-bold text-primary">{timeLeft.seconds}</div>
        <div className="text-[10px] text-muted-foreground uppercase">Sec</div>
      </div>
    </div>
  );
};

const EventCountdownWidget = ({ events }: EventCountdownWidgetProps) => {
  // Filter upcoming events and sort by date
  const upcomingEvents = events
    .filter((event) => !isPast(new Date(event.event_date)))
    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
    .slice(0, 3);

  if (upcomingEvents.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Upcoming Events Countdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {upcomingEvents.map((event) => {
            const eventDate = new Date(event.event_date);
            const daysUntil = differenceInDays(eventDate, new Date());
            
            return (
              <div 
                key={event.id} 
                className="p-4 rounded-lg border border-border bg-card hover:bg-secondary/30 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-foreground truncate">{event.title}</h4>
                      {daysUntil <= 7 && (
                        <Badge variant="destructive" className="text-xs">
                          {daysUntil === 0 ? 'Today!' : daysUntil === 1 ? 'Tomorrow' : 'This Week'}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(eventDate, 'MMM d, yyyy • h:mm a')}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {event.venue}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <CountdownTimer targetDate={eventDate} />
                    <Link to={`/org/events/${event.id}`}>
                      <Button variant="ghost" size="icon">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default EventCountdownWidget;
