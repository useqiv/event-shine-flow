import React from 'react';
import { Link } from 'react-router-dom';
import OrganizationLayout from '@/components/layout/OrganizationLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useOrganizationEvents } from '@/hooks/useOrganization';
import { useOrgPermissions, useAllowedScanEventIds } from '@/hooks/useOrgPermissions';
import { QrCode, Calendar, MapPin, ArrowRight, ShieldAlert } from 'lucide-react';
import { format, isPast } from 'date-fns';

const EventScannerList = () => {
  const { data: events, isLoading } = useOrganizationEvents();
  const { data: permissions, isLoading: permissionsLoading } = useOrgPermissions();
  const allowedEventIds = useAllowedScanEventIds();

  // Filter events based on scan permissions
  const filterByPermissions = (eventList: typeof events) => {
    if (!eventList) return [];
    if (!permissions?.can_scan_tickets) return [];
    
    // null means all events allowed
    if (allowedEventIds === null) return eventList;
    
    // Filter to only allowed events
    return eventList.filter(e => allowedEventIds.includes(e.id));
  };

  const allUpcoming = events?.filter(e => !isPast(new Date(e.event_date))) || [];
  const allPast = events?.filter(e => isPast(new Date(e.event_date))) || [];
  
  const upcomingEvents = filterByPermissions(allUpcoming);
  const pastEvents = filterByPermissions(allPast);

  if (isLoading || permissionsLoading) {
    return (
      <OrganizationLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-48" />)}
          </div>
        </div>
      </OrganizationLayout>
    );
  }

  // Check if user has no scan permissions at all
  if (permissions && !permissions.can_scan_tickets) {
    return (
      <OrganizationLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">QR Scanner</h1>
            <p className="text-muted-foreground">Select an event to scan tickets</p>
          </div>
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertDescription>
              You don't have permission to scan tickets. Please contact your organization administrator.
            </AlertDescription>
          </Alert>
        </div>
      </OrganizationLayout>
    );
  }

  return (
    <OrganizationLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">QR Scanner</h1>
          <p className="text-muted-foreground">
            {permissions?.isOwner 
              ? 'Select an event to scan tickets'
              : `You can scan tickets for ${allowedEventIds === null ? 'all events' : `${allowedEventIds?.length || 0} event(s)`}`
            }
          </p>
        </div>

        {upcomingEvents.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Upcoming Events</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {upcomingEvents.map((event) => (
                <Card key={event.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg line-clamp-1">{event.title}</CardTitle>
                      <Badge variant="default">Active</Badge>
                    </div>
                    <CardDescription className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(event.event_date), 'MMM d, yyyy')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{event.venue}</span>
                    </div>
                    <div className="flex gap-2">
                      <Link to={`/org/events/${event.id}/scanner`} className="flex-1">
                        <Button className="w-full">
                          <QrCode className="mr-2 h-4 w-4" />
                          Scan Tickets
                        </Button>
                      </Link>
                      <Link to={`/org/events/${event.id}/checkin`}>
                        <Button variant="outline">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {pastEvents.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Past Events</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pastEvents.slice(0, 6).map((event) => (
                <Card key={event.id} className="opacity-75">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg line-clamp-1">{event.title}</CardTitle>
                      <Badge variant="secondary">Ended</Badge>
                    </div>
                    <CardDescription className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(event.event_date), 'MMM d, yyyy')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link to={`/org/events/${event.id}/checkin`}>
                      <Button variant="outline" className="w-full">
                        View Check-in Report
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {events?.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <QrCode className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No events yet</p>
              <Link to="/org/events/create">
                <Button>Create Your First Event</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </OrganizationLayout>
  );
};

export default EventScannerList;
