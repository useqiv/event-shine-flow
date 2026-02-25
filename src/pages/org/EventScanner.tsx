import React from 'react';
import { useParams, Link } from 'react-router-dom';
import OrganizationLayout from '@/components/layout/OrganizationLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useEvent } from '@/hooks/useEvents';
import { useEventTicketTypes, useQRScanLogs } from '@/hooks/useOrganization';
import { useCanScanEvent } from '@/hooks/useOrgPermissions';
import QRCodeScanner from '@/components/org/QRCodeScanner';
import ManualTicketLookup from '@/components/org/ManualTicketLookup';
import { Calendar, MapPin, Ticket, QrCode, Search, LayoutDashboard, CheckCircle, Clock, TrendingUp, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';

const EventScanner = () => {
  const { id } = useParams<{ id: string }>();
  const { data: event, isLoading } = useEvent(id || '');
  const { canScan: canScanThisEvent, isLoading: permLoading } = useCanScanEvent(id || '');
  const { data: ticketTypes } = useEventTicketTypes(id || '');
  const { data: scanLogs, refetch: refetchLogs } = useQRScanLogs(id);

  const totalTicketsSold = ticketTypes?.reduce((sum: number, t: any) => sum + (t.quantity_sold || 0), 0) || 0;
  const successfulScans = scanLogs?.filter((log: any) => log.scan_result === 'success').length || 0;
  const pendingCheckins = totalTicketsSold - successfulScans;
  const checkInRate = totalTicketsSold > 0 ? Math.round((successfulScans / totalTicketsSold) * 100) : 0;

  const handleScanComplete = () => {
    refetchLogs();
  };

  if (isLoading || permLoading) {
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

  // Check if user has permission to scan this event
  if (!canScanThisEvent) {
    return (
      <OrganizationLayout>
        <div className="space-y-6 max-w-2xl mx-auto px-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">Event Check-in</h1>
            <p className="text-sm text-muted-foreground">{event.title}</p>
          </div>
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertDescription>
              You don't have permission to scan tickets for this event. Please contact your organization administrator.
            </AlertDescription>
          </Alert>
          <Link to="/org/event-scanner">
            <Button variant="outline">Back to Event List</Button>
          </Link>
        </div>
      </OrganizationLayout>
    );
  }

  return (
    <OrganizationLayout>
      <div className="space-y-4 sm:space-y-6 max-w-2xl mx-auto px-1 sm:px-0">
        {/* Breadcrumb Navigation - Hidden on very small screens */}
        <Breadcrumb className="hidden sm:block">
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

        {/* Scanner/Lookup Tabs - Primary action at top with larger touch targets */}
        <Tabs defaultValue="scanner" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-12 sm:h-10">
            <TabsTrigger value="scanner" className="flex items-center gap-2 text-sm sm:text-base py-3 sm:py-2">
              <QrCode className="h-5 w-5 sm:h-4 sm:w-4" />
              QR Scanner
            </TabsTrigger>
            <TabsTrigger value="lookup" className="flex items-center gap-2 text-sm sm:text-base py-3 sm:py-2">
              <Search className="h-5 w-5 sm:h-4 sm:w-4" />
              Manual Lookup
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="scanner" className="mt-3 sm:mt-4">
            <Card>
              <CardHeader className="pb-2 sm:pb-4 px-3 sm:px-6 pt-3 sm:pt-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <QrCode className="h-5 w-5" />
                  Scan Tickets
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Point camera at QR code to check in
                </CardDescription>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <QRCodeScanner eventId={id || ''} onScanComplete={handleScanComplete} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="lookup" className="mt-3 sm:mt-4">
            <ManualTicketLookup eventId={id || ''} onCheckIn={handleScanComplete} />
          </TabsContent>
        </Tabs>

        {/* Header - Compact on mobile */}
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">Event Check-in</h1>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">{event.title}</p>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <Link to={`/org/events/${id}/checkin`}>
              <Button variant="outline" size="sm" className="h-9 sm:h-8 px-2 sm:px-3">
                <LayoutDashboard className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>
            </Link>
            <Badge variant={event.is_active ? "default" : "secondary"} className="text-xs">
              {event.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>

        {/* Event Info Card - Compact on mobile */}
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex gap-3 sm:gap-4">
              <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-lg bg-secondary overflow-hidden flex-shrink-0">
                {event.image_url ? (
                  <img src={event.image_url} alt={event.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate text-sm sm:text-base">{event.title}</h3>
                <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground mt-1">
                  <Calendar className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{format(new Date(event.event_date), 'MMM d, yyyy • h:mm a')}</span>
                </div>
                <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{event.venue}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats Summary - 2x2 grid on mobile, 4 cols on larger */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <Card>
            <CardContent className="p-2 sm:p-3 text-center">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-1 sm:mb-2">
                <Ticket className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
              </div>
              <p className="text-lg sm:text-xl font-bold">{totalTicketsSold}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Total Tickets</p>
            </CardContent>
          </Card>
          <Card className="border-green-200 dark:border-green-800">
            <CardContent className="p-2 sm:p-3 text-center">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-1 sm:mb-2">
                <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-400">{successfulScans}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Checked In</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-2 sm:p-3 text-center">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mx-auto mb-1 sm:mb-2">
                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <p className="text-lg sm:text-xl font-bold text-orange-600 dark:text-orange-400">{pendingCheckins}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-2 sm:p-3 text-center">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-1 sm:mb-2">
                <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400">{checkInRate}%</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Check-in Rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Check-in Progress Bar */}
        {totalTicketsSold > 0 && (
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm font-medium">Check-in Progress</span>
                <span className="text-xs sm:text-sm text-muted-foreground">
                  {successfulScans}/{totalTicketsSold} ({Math.round((successfulScans / totalTicketsSold) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2 sm:h-3">
                <div
                  className="bg-primary rounded-full h-2 sm:h-3 transition-all"
                  style={{ width: `${Math.min((successfulScans / totalTicketsSold) * 100, 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </OrganizationLayout>
  );
};

export default EventScanner;
