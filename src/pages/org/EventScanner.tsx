import React from 'react';
import { useParams, Link } from 'react-router-dom';
import OrganizationLayout from '@/components/layout/OrganizationLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { useEvent } from '@/hooks/useEvents';
import { useEventTicketTypes, useQRScanLogs } from '@/hooks/useOrganization';
import QRCodeScanner from '@/components/org/QRCodeScanner';
import ManualTicketLookup from '@/components/org/ManualTicketLookup';
import { Calendar, MapPin, Ticket, QrCode, Search, LayoutDashboard, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

const EventScanner = () => {
  const { id } = useParams<{ id: string }>();
  const { data: event, isLoading } = useEvent(id || '');
  const { data: ticketTypes } = useEventTicketTypes(id || '');
  const { data: scanLogs, refetch: refetchLogs } = useQRScanLogs(id);

  const totalTicketsSold = ticketTypes?.reduce((sum: number, t: any) => sum + (t.quantity_sold || 0), 0) || 0;
  const successfulScans = scanLogs?.filter((log: any) => log.scan_result === 'success').length || 0;
  const pendingCheckins = totalTicketsSold - successfulScans;
  const checkInRate = totalTicketsSold > 0 ? Math.round((successfulScans / totalTicketsSold) * 100) : 0;

  const handleScanComplete = () => {
    refetchLogs();
  };

  if (isLoading) {
    return (
      <OrganizationLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-96" />
        </div>
      </OrganizationLayout>
    );
  }

  if (!event) {
    return (
      <OrganizationLayout>
        <div className="text-center py-16">
          <p className="text-muted-foreground">Event not found</p>
          <Link to="/org/events">
            <Button variant="link">Back to Events</Button>
          </Link>
        </div>
      </OrganizationLayout>
    );
  }

  return (
    <OrganizationLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        {/* Breadcrumb Navigation */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/org/dashboard">Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/org/events">Events</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to={`/org/events/${id}`}>{event.title}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Scanner</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Event Check-in</h1>
            <p className="text-sm text-muted-foreground">{event.title}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to={`/org/events/${id}/checkin`}>
              <Button variant="outline" size="sm">
                <LayoutDashboard className="h-4 w-4 mr-1" />
                Dashboard
              </Button>
            </Link>
            <Badge variant={event.is_active ? "default" : "secondary"}>
              {event.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>

        {/* Event Info Card */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="h-16 w-16 rounded-lg bg-secondary overflow-hidden flex-shrink-0">
                {event.image_url ? (
                  <img src={event.image_url} alt={event.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <Calendar className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{event.title}</h3>
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(event.event_date), 'MMM d, yyyy • h:mm a')}
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {event.venue}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <Ticket className="h-4 w-4 text-primary" />
              </div>
              <p className="text-xl font-bold">{totalTicketsSold}</p>
              <p className="text-xs text-muted-foreground">Total Tickets</p>
            </CardContent>
          </Card>
          <Card className="border-green-200 dark:border-green-800">
            <CardContent className="p-3 text-center">
              <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">{successfulScans}</p>
              <p className="text-xs text-muted-foreground">Checked In</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mx-auto mb-2">
                <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <p className="text-xl font-bold text-orange-600 dark:text-orange-400">{pendingCheckins}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{checkInRate}%</p>
              <p className="text-xs text-muted-foreground">Check-in Rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Check-in Progress Bar */}
        {totalTicketsSold > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Check-in Progress</span>
                <span className="text-sm text-muted-foreground">
                  {successfulScans}/{totalTicketsSold} ({Math.round((successfulScans / totalTicketsSold) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-secondary rounded-full h-3">
                <div
                  className="bg-primary rounded-full h-3 transition-all"
                  style={{ width: `${Math.min((successfulScans / totalTicketsSold) * 100, 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Scanner/Lookup Tabs */}
        <Tabs defaultValue="scanner" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="scanner" className="flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              QR Scanner
            </TabsTrigger>
            <TabsTrigger value="lookup" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Manual Lookup
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="scanner" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  Scan Tickets
                </CardTitle>
                <CardDescription>
                  Point the camera at a ticket QR code to check in attendees
                </CardDescription>
              </CardHeader>
              <CardContent>
                <QRCodeScanner eventId={id || ''} onScanComplete={handleScanComplete} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="lookup" className="mt-4">
            <ManualTicketLookup eventId={id || ''} onCheckIn={handleScanComplete} />
          </TabsContent>
        </Tabs>
      </div>
    </OrganizationLayout>
  );
};

export default EventScanner;
