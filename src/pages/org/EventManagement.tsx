import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import OrganizationLayout from '@/components/layout/OrganizationLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useEvent } from '@/hooks/useEvents';
import { useUpdateEvent, useCreateTicketType, useEventTicketTypes, useEventTickets, useQRScanLogs } from '@/hooks/useOrganization';
import { Calendar, Ticket, Users, PlusCircle, QrCode, Download, ArrowLeft, Copy, MapPin, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const EventManagement = () => {
  const { id } = useParams<{ id: string }>();
  const { data: event, isLoading } = useEvent(id || '');
  const { data: ticketTypes, isLoading: ticketTypesLoading } = useEventTicketTypes(id || '');
  const { data: tickets, isLoading: ticketsLoading } = useEventTickets(id || '');
  const { data: scanLogs } = useQRScanLogs(id);
  const updateEvent = useUpdateEvent();
  const createTicketType = useCreateTicketType();

  const [isAddTicketTypeOpen, setIsAddTicketTypeOpen] = useState(false);
  const [newTicketType, setNewTicketType] = useState({
    name: '',
    price: '',
    quantity_available: '',
    description: '',
  });

  const handleAddTicketType = async () => {
    if (!id || !newTicketType.name || !newTicketType.price || !newTicketType.quantity_available) return;
    
    try {
      await createTicketType.mutateAsync({
        event_id: id,
        name: newTicketType.name,
        price: Number(newTicketType.price),
        quantity_available: Number(newTicketType.quantity_available),
        description: newTicketType.description,
      });
      setIsAddTicketTypeOpen(false);
      setNewTicketType({ name: '', price: '', quantity_available: '', description: '' });
    } catch (error) {
      console.error('Failed to add ticket type:', error);
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/events/${id}`;
    navigator.clipboard.writeText(url);
    toast.success('Event link copied to clipboard!');
  };

  const handleToggleActive = async () => {
    if (!event) return;
    await updateEvent.mutateAsync({
      id: event.id,
      is_active: !event.is_active,
    });
  };

  const totalTicketsSold = ticketTypes?.reduce((sum: number, t: any) => sum + (t.quantity_sold || 0), 0) || 0;
  const totalRevenue = tickets?.reduce((sum: number, t: any) => sum + Number(t.amount_paid), 0) || 0;

  if (isLoading) {
    return (
      <OrganizationLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64" />
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/org/events">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{event.title}</h1>
              <p className="text-muted-foreground">
                {format(new Date(event.event_date), 'MMM d, yyyy • h:mm a')} • {event.venue}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCopyLink}>
              <Copy className="mr-2 h-4 w-4" />
              Copy Link
            </Button>
            <Button
              variant={event.is_active ? "destructive" : "default"}
              onClick={handleToggleActive}
            >
              {event.is_active ? 'Deactivate' : 'Activate'}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tickets Sold</p>
                  <p className="text-2xl font-bold">{totalTicketsSold.toLocaleString()}</p>
                </div>
                <Ticket className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">₦{totalRevenue.toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ticket Types</p>
                  <p className="text-2xl font-bold">{ticketTypes?.length || 0}</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Check-ins</p>
                  <p className="text-2xl font-bold">{scanLogs?.length || 0}</p>
                </div>
                <QrCode className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="tickets" className="space-y-4">
          <TabsList>
            <TabsTrigger value="tickets">Ticket Types</TabsTrigger>
            <TabsTrigger value="attendees">Attendees</TabsTrigger>
            <TabsTrigger value="scans">QR Scan Logs</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="tickets" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Ticket Types ({ticketTypes?.length || 0})</h2>
              <Dialog open={isAddTicketTypeOpen} onOpenChange={setIsAddTicketTypeOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Ticket Type
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Ticket Type</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Name *</Label>
                      <Input
                        placeholder="e.g., VIP, Regular, Early Bird"
                        value={newTicketType.name}
                        onChange={(e) => setNewTicketType(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Price (₦) *</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={newTicketType.price}
                          onChange={(e) => setNewTicketType(prev => ({ ...prev, price: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Quantity *</Label>
                        <Input
                          type="number"
                          placeholder="100"
                          value={newTicketType.quantity_available}
                          onChange={(e) => setNewTicketType(prev => ({ ...prev, quantity_available: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input
                        placeholder="What's included..."
                        value={newTicketType.description}
                        onChange={(e) => setNewTicketType(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>
                    <Button onClick={handleAddTicketType} className="w-full" disabled={createTicketType.isPending}>
                      {createTicketType.isPending ? 'Adding...' : 'Add Ticket Type'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {ticketTypesLoading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            ) : ticketTypes && ticketTypes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ticketTypes.map((ticketType: any) => (
                  <Card key={ticketType.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold">{ticketType.name}</h3>
                        <Badge variant="outline">
                          {ticketType.quantity_sold}/{ticketType.quantity_available}
                        </Badge>
                      </div>
                      <p className="text-2xl font-bold text-primary">₦{Number(ticketType.price).toLocaleString()}</p>
                      {ticketType.description && (
                        <p className="text-sm text-muted-foreground mt-2">{ticketType.description}</p>
                      )}
                      <div className="mt-3 bg-secondary/50 rounded-full h-2">
                        <div 
                          className="bg-primary rounded-full h-2 transition-all"
                          style={{ width: `${(ticketType.quantity_sold / ticketType.quantity_available) * 100}%` }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No ticket types yet. Add your first ticket type to start selling.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="attendees">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Attendees ({tickets?.length || 0})</CardTitle>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {ticketsLoading ? (
                  <Skeleton className="h-48" />
                ) : tickets && tickets.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Ticket Type</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tickets.map((ticket: any) => (
                          <TableRow key={ticket.id}>
                            <TableCell>{ticket.profiles?.full_name || 'N/A'}</TableCell>
                            <TableCell>{ticket.profiles?.email || 'N/A'}</TableCell>
                            <TableCell>{ticket.ticket_types?.name}</TableCell>
                            <TableCell>₦{Number(ticket.amount_paid).toLocaleString()}</TableCell>
                            <TableCell>{format(new Date(ticket.created_at), 'MMM d, yyyy')}</TableCell>
                            <TableCell>
                              <Badge variant={ticket.status === 'active' ? 'default' : 'secondary'}>
                                {ticket.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No attendees yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scans">
            <Card>
              <CardHeader>
                <CardTitle>QR Scan Logs</CardTitle>
                <CardDescription>Track check-ins at your event</CardDescription>
              </CardHeader>
              <CardContent>
                {scanLogs && scanLogs.length > 0 ? (
                  <div className="space-y-2">
                    {scanLogs.map((log: any) => (
                      <div key={log.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                        <div>
                          <p className="font-medium">{log.tickets?.ticket_types?.name || 'Ticket'}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(log.scanned_at), 'MMM d, yyyy • h:mm a')}
                          </p>
                        </div>
                        <Badge variant={log.scan_result === 'success' ? 'default' : 'destructive'}>
                          {log.scan_result}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No scans recorded yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Event Settings</CardTitle>
                <CardDescription>Update your event details</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Settings editing coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </OrganizationLayout>
  );
};

export default EventManagement;
