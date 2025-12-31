import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Ticket, 
  DollarSign, 
  Building2,
  Eye,
  Pause,
  Play,
  Users,
  QrCode,
  Pencil
} from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import EditEventDialog from '@/components/admin/EditEventDialog';

const AdminEventDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ['admin-event-detail', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  const { data: ticketTypes, isLoading: ticketTypesLoading } = useQuery({
    queryKey: ['admin-event-ticket-types', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_types')
        .select('*')
        .eq('event_id', id)
        .order('price', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  const { data: tickets } = useQuery({
    queryKey: ['admin-event-tickets', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          ticket_types (name, price)
        `)
        .eq('event_id', id)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  const { data: scanLogs } = useQuery({
    queryKey: ['admin-event-scans', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('qr_scan_logs')
        .select('*')
        .eq('event_id', id)
        .order('scanned_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  const { data: organization } = useQuery({
    queryKey: ['admin-event-organization', event?.organization_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', event?.organization_id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!event?.organization_id
  });

  const toggleEventStatus = async () => {
    if (!event) return;
    
    const { error } = await supabase
      .from('events')
      .update({ is_active: !event.is_active })
      .eq('id', event.id);

    if (error) {
      toast.error('Failed to update event');
    } else {
      toast.success(event.is_active ? 'Event paused' : 'Event activated');
      queryClient.invalidateQueries({ queryKey: ['admin-event-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-all-events'] });
    }
  };

  const formatCurrency = (amount: number, currencyCode?: string) => {
    const currency = currencyCode || event?.currency || 'NGN';
    const locale = currency === 'NGN' ? 'en-NG' : currency === 'USD' ? 'en-US' : currency === 'GBP' ? 'en-GB' : currency === 'EUR' ? 'de-DE' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = () => {
    if (!event) return null;
    const now = new Date();
    const eventDate = new Date(event.event_date);

    if (!event.is_active) {
      return <Badge variant="secondary">Paused</Badge>;
    }
    if (now > eventDate) {
      return <Badge variant="secondary">Past</Badge>;
    }
    return <Badge className="bg-green-500">Active</Badge>;
  };

  if (eventLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      </AdminLayout>
    );
  }

  if (!event) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">Event not found</h2>
          <Button asChild className="mt-4">
            <Link to="/admin/events">Back to Events</Link>
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const totalTicketsSold = ticketTypes?.reduce((sum, t) => sum + (t.quantity_sold || 0), 0) || 0;
  const totalRevenue = tickets?.reduce((sum, t) => sum + (t.amount_paid || 0), 0) || 0;
  const totalCapacity = ticketTypes?.reduce((sum, t) => sum + (t.quantity_available || 0), 0) || 0;
  const scannedCount = scanLogs?.filter(s => s.scan_result === 'success').length || 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/admin/events">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{event.title}</h1>
                {getStatusBadge()}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {event.venue}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to={`/events/${event.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                View Public Page
              </Link>
            </Button>
            <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Details
            </Button>
            <Button 
              variant={event.is_active ? "destructive" : "default"}
              onClick={toggleEventStatus}
            >
              {event.is_active ? (
                <>
                  <Pause className="mr-2 h-4 w-4" />
                  Pause Event
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Activate Event
                </>
              )}
            </Button>
          </div>
          
          <EditEventDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            event={event}
          />
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Ticket className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Tickets Sold</span>
              </div>
              <div className="text-2xl font-bold mt-1">
                {totalTicketsSold.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                of {totalCapacity.toLocaleString()} total
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Revenue</span>
              </div>
              <div className="text-2xl font-bold mt-1">
                {formatCurrency(totalRevenue, event?.currency)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Ticket Types</span>
              </div>
              <div className="text-2xl font-bold mt-1">
                {ticketTypes?.length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <QrCode className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Scanned In</span>
              </div>
              <div className="text-2xl font-bold mt-1">
                {scannedCount}
              </div>
              <p className="text-xs text-muted-foreground">
                {totalTicketsSold > 0 ? ((scannedCount / totalTicketsSold) * 100).toFixed(0) : 0}% checked in
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Event Details & Organization */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {event.image_url && (
                <img 
                  src={event.image_url} 
                  alt={event.title}
                  className="w-full h-48 object-cover rounded-lg"
                />
              )}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category</span>
                  <Badge variant="outline">{event.category}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Event Date</span>
                  <span className="font-medium">
                    {format(new Date(event.event_date), 'MMMM d, yyyy h:mm a')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Featured</span>
                  <Badge variant={event.is_featured ? "default" : "secondary"}>
                    {event.is_featured ? "Yes" : "No"}
                  </Badge>
                </div>
                {event.address && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Address</span>
                    <span className="text-right max-w-[200px]">{event.address}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{format(new Date(event.created_at), 'MMM d, yyyy')}</span>
                </div>
              </div>
              {event.description && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Description</h4>
                  <p className="text-sm text-muted-foreground">{event.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Organization
              </CardTitle>
            </CardHeader>
            <CardContent>
              {organization ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name</span>
                    <span className="font-medium">{organization.full_name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email</span>
                    <span>{organization.email || 'N/A'}</span>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No organization data</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Ticket Types */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="h-4 w-4" />
              Ticket Types
            </CardTitle>
            <CardDescription>Available ticket categories for this event</CardDescription>
          </CardHeader>
          <CardContent>
            {ticketTypesLoading ? (
              <Skeleton className="h-32" />
            ) : ticketTypes && ticketTypes.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Sold</TableHead>
                      <TableHead>Available</TableHead>
                      <TableHead>Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ticketTypes.map((type) => (
                      <TableRow key={type.id}>
                        <TableCell className="font-medium">{type.name}</TableCell>
                        <TableCell>{formatCurrency(type.price, type.currency || event?.currency)}</TableCell>
                        <TableCell>{type.quantity_sold}</TableCell>
                        <TableCell>{type.quantity_available}</TableCell>
                        <TableCell>{formatCurrency(type.quantity_sold * type.price, type.currency || event?.currency)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No ticket types configured</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Ticket Purchases */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Ticket Purchases</CardTitle>
            <CardDescription>Last 20 ticket purchases for this event</CardDescription>
          </CardHeader>
          <CardContent>
            {tickets && tickets.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Ticket Type</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets.map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell>
                          {format(new Date(ticket.created_at), 'MMM d, h:mm a')}
                        </TableCell>
                        <TableCell>{ticket.ticket_types?.name || 'Unknown'}</TableCell>
                        <TableCell>{ticket.quantity}</TableCell>
                        <TableCell>{formatCurrency(ticket.amount_paid, event?.currency)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{ticket.payment_method}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={ticket.status === 'active' ? 'default' : 'secondary'}
                            className={ticket.status === 'active' ? 'bg-green-500' : ''}
                          >
                            {ticket.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No tickets purchased yet</p>
            )}
          </CardContent>
        </Card>

        {/* Recent QR Scans */}
        {scanLogs && scanLogs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-4 w-4" />
                Recent Check-ins
              </CardTitle>
              <CardDescription>Last 10 QR code scans</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Result</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scanLogs.map((scan) => (
                      <TableRow key={scan.id}>
                        <TableCell>
                          {format(new Date(scan.scanned_at), 'MMM d, h:mm a')}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={scan.scan_result === 'success' ? 'default' : 'destructive'}
                            className={scan.scan_result === 'success' ? 'bg-green-500' : ''}
                          >
                            {scan.scan_result}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminEventDetail;
