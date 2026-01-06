import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { useMyTickets } from '@/hooks/useEvents';
import { CalendarDays, Download, MapPin, Ticket, ExternalLink } from 'lucide-react';
import { format, isSameDay, isAfter, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export const EventCalendar = () => {
  const { data: tickets, isLoading } = useMyTickets();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  // Get upcoming events from tickets
  const upcomingEvents = tickets
    ?.filter((t: any) => isAfter(new Date(t.event?.event_date), new Date()))
    ?.map((t: any) => ({
      ...t.event,
      ticketId: t.id,
      ticketQuantity: t.quantity,
      ticketType: t.ticket_type?.name,
    })) || [];

  // Get dates with events for calendar highlighting
  const eventDates = upcomingEvents.map((e: any) => parseISO(e.event_date));

  // Get events for selected date
  const selectedDateEvents = selectedDate
    ? upcomingEvents.filter((e: any) => isSameDay(parseISO(e.event_date), selectedDate))
    : [];

  // Generate Google Calendar URL
  const generateGoogleCalendarUrl = (event: any) => {
    const startDate = new Date(event.event_date);
    const endDate = new Date(startDate.getTime() + 3 * 60 * 60 * 1000); // 3 hours duration
    
    const formatGoogleDate = (date: Date) => 
      date.toISOString().replace(/-|:|\.\d{3}/g, '');
    
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title,
      dates: `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`,
      details: event.description || `Event at ${event.venue}`,
      location: event.address || event.venue,
    });
    
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  // Generate ICS file content
  const generateICSContent = (event: any) => {
    const startDate = new Date(event.event_date);
    const endDate = new Date(startDate.getTime() + 3 * 60 * 60 * 1000);
    
    const formatICSDate = (date: Date) => 
      date.toISOString().replace(/-|:|\.\d{3}/g, '').slice(0, 15) + 'Z';
    
    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Useqiv//Event Calendar//EN
BEGIN:VEVENT
UID:${event.id}@useqiv.com
DTSTART:${formatICSDate(startDate)}
DTEND:${formatICSDate(endDate)}
SUMMARY:${event.title}
DESCRIPTION:${event.description || ''}
LOCATION:${event.address || event.venue}
END:VEVENT
END:VCALENDAR`;
  };

  const downloadICS = (event: any) => {
    const icsContent = generateICSContent(event);
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.title.replace(/\s+/g, '-')}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Event Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          Event Calendar
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calendar */}
          <div>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className={cn("rounded-md border pointer-events-auto")}
              modifiers={{
                hasEvent: eventDates,
              }}
              modifiersStyles={{
                hasEvent: {
                  backgroundColor: 'hsl(var(--primary) / 0.2)',
                  borderRadius: '50%',
                  fontWeight: 'bold',
                },
              }}
            />
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Highlighted dates have events with your tickets
            </p>
          </div>

          {/* Selected Date Events or All Upcoming */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">
              {selectedDate 
                ? `Events on ${format(selectedDate, 'MMMM d, yyyy')}`
                : 'Upcoming Events'
              }
            </h4>
            
            {(selectedDate ? selectedDateEvents : upcomingEvents.slice(0, 5)).length > 0 ? (
              <div className="space-y-3 max-h-[280px] overflow-y-auto">
                {(selectedDate ? selectedDateEvents : upcomingEvents.slice(0, 5)).map((event: any) => (
                  <div 
                    key={event.ticketId} 
                    className="p-3 rounded-lg border border-border bg-secondary/30"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{event.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(event.event_date), 'MMM d, yyyy • h:mm a')}
                        </p>
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        <Ticket className="h-3 w-3 mr-1" />
                        {event.ticketQuantity}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                      <MapPin className="h-3 w-3" />
                      {event.venue}
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(generateGoogleCalendarUrl(event), '_blank')}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Google
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => downloadICS(event)}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        ICS
                      </Button>
                      <Link to={`/events/${event.id}`}>
                        <Button variant="ghost" size="sm">
                          View Event
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-8">
                {selectedDate 
                  ? 'No events on this date'
                  : 'No upcoming events with tickets'
                }
              </p>
            )}
            
            {!selectedDate && upcomingEvents.length > 5 && (
              <Link to="/my-tickets">
                <Button variant="outline" size="sm" className="w-full">
                  View All Tickets
                </Button>
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
