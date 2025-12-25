import React from 'react';
import { Link } from 'react-router-dom';
import OrganizationLayout from '@/components/layout/OrganizationLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrganizationEvents } from '@/hooks/useOrganization';
import { Calendar, PlusCircle, MapPin, Ticket, Eye, Settings } from 'lucide-react';
import { format } from 'date-fns';

const ManageEvents = () => {
  const { data: events, isLoading } = useOrganizationEvents();

  return (
    <OrganizationLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Manage Events</h1>
            <p className="text-muted-foreground">View and manage all your events.</p>
          </div>
          <Link to="/org/events/create">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Event
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        ) : events && events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((event: any) => (
              <Card key={event.id} className="overflow-hidden">
                <div className="h-32 bg-secondary">
                  {event.image_url ? (
                    <img
                      src={event.image_url}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Calendar className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold truncate">{event.title}</h3>
                    <Badge variant={event.is_active ? "default" : "secondary"}>
                      {event.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{event.event_date ? format(new Date(event.event_date), 'MMM d, yyyy • h:mm a') : 'Date TBD'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span className="truncate">{event.venue}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link to={`/org/events/${event.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Settings className="mr-2 h-4 w-4" />
                        Manage
                      </Button>
                    </Link>
                    <Link to={`/events/${event.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-16 text-center">
              <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Events Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first event to start selling tickets.
              </p>
              <Link to="/org/events/create">
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Your First Event
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </OrganizationLayout>
  );
};

export default ManageEvents;
