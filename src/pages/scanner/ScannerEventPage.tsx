import React from 'react';
import { useParams, Link } from 'react-router-dom';
import ScannerLayout from '@/components/layout/ScannerLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useEvent } from '@/hooks/useEvents';
import { useEventTicketTypes, useQRScanLogs } from '@/hooks/useOrganization';
import { useCanScanEvent } from '@/hooks/useOrgPermissions';
import QRCodeScanner from '@/components/org/QRCodeScanner';
import ManualTicketLookup from '@/components/org/ManualTicketLookup';
import { 
  Calendar, MapPin, Ticket, QrCode, Search, CheckCircle, Clock, 
  TrendingUp, ShieldAlert, ArrowLeft 
} from 'lucide-react';
import { format } from 'date-fns';

const ScannerEventPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data: event, isLoading } = useEvent(id || '');
  const canScanThisEvent = useCanScanEvent(id || '');
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
      <ScannerLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-96" />
        </div>
      </ScannerLayout>
    );
  }

  if (!event) {
    return (
      <ScannerLayout>
        <div className="text-center py-16">
          <p className="text-muted-foreground mb-4">Event not found</p>
          <Link to="/scanner">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Events
            </Button>
          </Link>
        </div>
      </ScannerLayout>
    );
  }

  if (!canScanThisEvent) {
    return (
      <ScannerLayout>
        <div className="space-y-4">
          <Link to="/scanner">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
          </Link>
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertDescription>
              You don't have permission to scan tickets for this event.
            </AlertDescription>
          </Alert>
        </div>
      </ScannerLayout>
    );
  }

  return (
    <ScannerLayout>
      <div className="space-y-4">
        {/* Back + Event Info */}
        <div className="flex items-center gap-3">
          <Link to="/scanner">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-foreground truncate">{event.title}</h1>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
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
          <Badge variant={event.is_active ? "default" : "secondary"} className="flex-shrink-0">
            {event.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-2">
          <Card>
            <CardContent className="p-2 text-center">
              <p className="text-lg font-bold">{totalTicketsSold}</p>
              <p className="text-[10px] text-muted-foreground">Tickets</p>
            </CardContent>
          </Card>
          <Card className="border-green-200 dark:border-green-800">
            <CardContent className="p-2 text-center">
              <p className="text-lg font-bold text-green-600 dark:text-green-400">{successfulScans}</p>
              <p className="text-[10px] text-muted-foreground">Checked In</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-2 text-center">
              <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{pendingCheckins}</p>
              <p className="text-[10px] text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-2 text-center">
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{checkInRate}%</p>
              <p className="text-[10px] text-muted-foreground">Rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar */}
        {totalTicketsSold > 0 && (
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="bg-primary rounded-full h-2 transition-all"
              style={{ width: `${Math.min((successfulScans / totalTicketsSold) * 100, 100)}%` }}
            />
          </div>
        )}

        {/* Scanner / Lookup Tabs */}
        <Tabs defaultValue="scanner" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-12">
            <TabsTrigger value="scanner" className="flex items-center gap-2 py-3">
              <QrCode className="h-5 w-5" />
              QR Scanner
            </TabsTrigger>
            <TabsTrigger value="lookup" className="flex items-center gap-2 py-3">
              <Search className="h-5 w-5" />
              Manual Lookup
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scanner" className="mt-3">
            <Card>
              <CardHeader className="pb-2 px-3 pt-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <QrCode className="h-5 w-5" />
                  Scan Tickets
                </CardTitle>
                <CardDescription className="text-xs">
                  Point camera at QR code to check in
                </CardDescription>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <QRCodeScanner eventId={id || ''} onScanComplete={handleScanComplete} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lookup" className="mt-3">
            <ManualTicketLookup eventId={id || ''} onCheckIn={handleScanComplete} />
          </TabsContent>
        </Tabs>
      </div>
    </ScannerLayout>
  );
};

export default ScannerEventPage;
