import React from 'react';
import { Link } from 'react-router-dom';
import ScannerLayout from '@/components/layout/ScannerLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useOrganizationEvents } from '@/hooks/useOrganization';
import { useOrgPermissions, useAllowedScanEventIds } from '@/hooks/useOrgPermissions';
import { QrCode, Calendar, MapPin, ShieldAlert } from 'lucide-react';
import { format, isPast } from 'date-fns';

const ScannerDashboard = () => {
  const { data: events, isLoading } = useOrganizationEvents();
  const { data: permissions, isLoading: permissionsLoading } = useOrgPermissions();
  const allowedEventIds = useAllowedScanEventIds();

  const filterByPermissions = (eventList: typeof events) => {
    if (!eventList) return [];
    if (!permissions?.can_scan_tickets) return [];
    if (allowedEventIds === null) return eventList;
    return eventList.filter(e => allowedEventIds.includes(e.id));
  };

  const allUpcoming = events?.filter(e => !isPast(new Date(e.event_date))) || [];
  const allPast = events?.filter(e => isPast(new Date(e.event_date))) || [];
  const upcomingEvents = filterByPermissions(allUpcoming);
  const pastEvents = filterByPermissions(allPast);

  if (isLoading || permissionsLoading) {
    return (
      <ScannerLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-28" />)}
          </div>
        </div>
      </ScannerLayout>
    );
  }

  if (permissions && !permissions.can_scan_tickets) {
    return (
      <ScannerLayout>
        <div className="space-y-4">
          <h1 className="text-xl font-bold text-foreground">Ticket Scanner</h1>
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertDescription>
              You don't have permission to scan tickets. Contact your organization administrator.
            </AlertDescription>
          </Alert>
        </div>
      </ScannerLayout>
    );
  }

  return (
    <ScannerLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold text-foreground">Select Event</h1>
          <p className="text-sm text-muted-foreground">
            Choose an event to start scanning tickets
          </p>
        </div>

        {upcomingEvents.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Upcoming</h2>
            <div className="space-y-2">
              {upcomingEvents.map((event) => (
                <Link key={event.id} to={`/scanner/${event.id}`}>
                  <Card className="hover:shadow-md transition-all hover:border-primary/30 cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <QrCode className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate">{event.title}</h3>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(event.event_date), 'MMM d, yyyy')}
                            </span>
                            <span className="flex items-center gap-1 truncate">
                              <MapPin className="h-3 w-3" />
                              {event.venue}
                            </span>
                          </div>
                        </div>
                        <Badge variant="default" className="flex-shrink-0">Active</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {pastEvents.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Past</h2>
            <div className="space-y-2">
              {pastEvents.slice(0, 5).map((event) => (
                <Link key={event.id} to={`/scanner/${event.id}`}>
                  <Card className="opacity-60 hover:opacity-80 transition-all cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          <QrCode className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate">{event.title}</h3>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(event.event_date), 'MMM d, yyyy')}
                            </span>
                          </div>
                        </div>
                        <Badge variant="secondary" className="flex-shrink-0">Ended</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {events?.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <QrCode className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No events available for scanning</p>
            </CardContent>
          </Card>
        )}
      </div>
    </ScannerLayout>
  );
};

export default ScannerDashboard;
