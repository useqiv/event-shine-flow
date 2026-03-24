import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, MapPin, Ticket, ExternalLink, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const EmbedEvent = () => {
  const { eventId } = useParams<{ eventId: string }>();

  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ['embed-event', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .eq('is_active', true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });

  const { data: ticketTypes } = useQuery({
    queryKey: ['embed-event-tickets', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_types')
        .select('*')
        .eq('event_id', eventId!);
      if (error) throw error;
      return (data || []).filter((t: any) => t.is_active).sort((a: any, b: any) => a.price - b.price);
    },
    enabled: !!eventId,
  });

  if (eventLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex items-center justify-center h-full p-8 text-center bg-background">
        <div>
          <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">Event not found or inactive</p>
        </div>
      </div>
    );
  }

  const eventUrl = `${window.location.origin}/e/${event.custom_slug || event.id}`;
  const eventDate = new Date(event.event_date);
  const isPast = eventDate < new Date();
  const lowestPrice = ticketTypes && ticketTypes.length > 0
    ? Math.min(...ticketTypes.map(t => t.price))
    : null;

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Event Image */}
      {event.image_url && (
        <div className="relative h-44 rounded-xl overflow-hidden mb-4">
          <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          <div className="absolute bottom-3 left-3">
            <Badge variant={isPast ? 'secondary' : 'default'} className="text-xs">
              {isPast ? 'Past Event' : 'Upcoming'}
            </Badge>
          </div>
        </div>
      )}

      {/* Event Info */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {event.logo_url && (
              <img src={event.logo_url} alt="" className="h-6 w-6 rounded object-contain" />
            )}
            <h1 className="font-bold text-lg leading-tight">{event.title}</h1>
          </div>
          {event.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{event.description}</p>
          )}
        </div>

        {/* Details */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
            <span>{format(eventDate, 'EEEE, MMMM d, yyyy')}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-primary flex-shrink-0" />
            <span>{format(eventDate, 'h:mm a')}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
            <span>{event.venue}{event.address ? `, ${event.address}` : ''}</span>
          </div>
        </div>

        {/* Ticket Types */}
        {ticketTypes && ticketTypes.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-1.5">
              <Ticket className="h-4 w-4" /> Tickets
            </h3>
            <div className="space-y-1.5">
              {ticketTypes.slice(0, 4).map((tt) => (
                <div key={tt.id} className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2 text-sm">
                  <span className="font-medium">{tt.name}</span>
                  <span className="font-semibold text-primary">
                    {tt.price === 0 ? 'Free' : `${event.currency} ${tt.price.toLocaleString()}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        {!isPast && (
          <Button asChild className="w-full" size="lg">
            <a href={eventUrl} target="_blank" rel="noopener noreferrer">
              <Ticket className="h-4 w-4 mr-2" />
              {lowestPrice !== null
                ? lowestPrice === 0
                  ? 'Get Free Tickets'
                  : `Get Tickets from ${event.currency} ${lowestPrice.toLocaleString()}`
                : 'View Event'}
            </a>
          </Button>
        )}

        {/* Footer */}
        <div className="pt-2 border-t text-center">
          <a
            href={eventUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-primary flex items-center justify-center gap-1"
          >
            <ExternalLink className="h-3 w-3" />
            View on Useqiv
          </a>
        </div>
      </div>
    </div>
  );
};

export default EmbedEvent;
