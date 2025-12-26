import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import OrganizationLayout from '@/components/layout/OrganizationLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageUpload } from '@/components/ui/image-upload';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import CurrencySelector, { getCurrencySymbol } from '@/components/ui/currency-selector';
import { useEvent } from '@/hooks/useEvents';
import { useUpdateEvent, useCreateTicketType, useEventTicketTypes, useEventTickets, useQRScanLogs } from '@/hooks/useOrganization';
import { EventAutoPostingCard } from '@/components/org/EventAutoPostingCard';
import EditTicketTypeDialog from '@/components/org/EditTicketTypeDialog';
import AttendanceReportExport from '@/components/org/AttendanceReportExport';
import { Calendar, Ticket, Users, PlusCircle, QrCode, Download, ArrowLeft, Copy, MapPin, DollarSign, Save, Megaphone, Pencil, TrendingUp, Info } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { exportToCsv, formatDateForExport, formatCurrencyForExport } from '@/lib/exportCsv';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
const categories = [
  'Music', 'Party', 'Conference', 'Workshop', 'Sports',
  'Festival', 'Networking', 'Concert', 'Exhibition', 'Other'
];

const EventManagement = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data: event, isLoading } = useEvent(id || '');
  const { data: ticketTypes, isLoading: ticketTypesLoading } = useEventTicketTypes(id || '');
  const { data: tickets, isLoading: ticketsLoading } = useEventTickets(id || '');
  const { data: scanLogs } = useQRScanLogs(id);
  const updateEvent = useUpdateEvent();
  const createTicketType = useCreateTicketType();

  // Fetch commission rates
  const { data: orgApproval } = useQuery({
    queryKey: ['org-approval-commission', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('organization_approvals')
        .select('ticket_commission_rate, special_commission_rate')
        .eq('organization_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: platformSettings } = useQuery({
    queryKey: ['platform-commission-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('setting_key, setting_value')
        .eq('category', 'commission');
      if (error) throw error;
      const settings: Record<string, number> = {};
      data?.forEach((s: any) => {
        settings[s.setting_key] = Number(s.setting_value) || 0;
      });
      return settings;
    },
  });

  const platformTicketCommission = platformSettings?.ticket_commission_percentage || platformSettings?.platform_commission_percentage || 10;
  const ticketCommission = orgApproval?.ticket_commission_rate ?? orgApproval?.special_commission_rate ?? platformTicketCommission;
  const [isAddTicketTypeOpen, setIsAddTicketTypeOpen] = useState(false);
  const [editingTicketType, setEditingTicketType] = useState<any>(null);
  const [newTicketType, setNewTicketType] = useState({
    name: '',
    price: '',
    currency: 'USD',
    quantity_available: '',
    description: '',
  });

  // Edit event form state
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    category: '',
    image_url: '',
    event_date: '',
    venue: '',
    address: '',
  });

  // Initialize edit form when event data loads
  useEffect(() => {
    if (event) {
      setEditForm({
        title: event.title || '',
        description: event.description || '',
        category: event.category || '',
        image_url: event.image_url || '',
        event_date: event.event_date ? new Date(event.event_date).toISOString().slice(0, 16) : '',
        venue: event.venue || '',
        address: event.address || '',
      });
    }
  }, [event]);

  const handleSaveEventDetails = async () => {
    if (!event) return;
    try {
      await updateEvent.mutateAsync({
        id: event.id,
        ...editForm,
      });
      toast.success('Event details updated successfully');
    } catch (error) {
      console.error('Failed to update event:', error);
    }
  };

  const handleAddTicketType = async () => {
    if (!id || !newTicketType.name || !newTicketType.price || !newTicketType.quantity_available) return;
    
    try {
      await createTicketType.mutateAsync({
        event_id: id,
        name: newTicketType.name,
        price: Number(newTicketType.price),
        currency: newTicketType.currency,
        quantity_available: Number(newTicketType.quantity_available),
        description: newTicketType.description,
      });
      setIsAddTicketTypeOpen(false);
      setNewTicketType({ name: '', price: '', currency: 'USD', quantity_available: '', description: '' });
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

  const handleExportAttendees = () => {
    if (!tickets || tickets.length === 0) {
      toast.error('No attendees to export');
      return;
    }

    const headers = [
      { key: 'profiles.full_name', label: 'Name' },
      { key: 'profiles.email', label: 'Email' },
      { key: 'ticket_types.name', label: 'Ticket Type' },
      { key: 'quantity', label: 'Quantity' },
      { key: 'amount_paid', label: 'Amount Paid (₦)' },
      { key: 'payment_method', label: 'Payment Method' },
      { key: 'status', label: 'Status' },
      { key: 'created_at', label: 'Purchase Date' },
      { key: 'qr_code', label: 'QR Code' },
    ];

    const exportData = tickets.map((t: any) => ({
      ...t,
      amount_paid: formatCurrencyForExport(t.amount_paid),
      created_at: formatDateForExport(t.created_at),
    }));

    exportToCsv(exportData, `${event?.title || 'event'}-attendees-${format(new Date(), 'yyyy-MM-dd')}`, headers);
    toast.success('Attendee list exported successfully');
  };

  const handleExportScanLogs = () => {
    if (!scanLogs || scanLogs.length === 0) {
      toast.error('No scan logs to export');
      return;
    }

    const headers = [
      { key: 'tickets.ticket_types.name', label: 'Ticket Type' },
      { key: 'scan_result', label: 'Result' },
      { key: 'scanned_at', label: 'Scanned At' },
    ];

    const exportData = scanLogs.map((log: any) => ({
      ...log,
      scanned_at: formatDateForExport(log.scanned_at),
    }));

    exportToCsv(exportData, `${event?.title || 'event'}-scan-logs-${format(new Date(), 'yyyy-MM-dd')}`, headers);
    toast.success('Scan logs exported successfully');
  };

  const totalTicketsSold = ticketTypes?.reduce((sum: number, t: any) => sum + (t.quantity_sold || 0), 0) || 0;
  const totalRevenue = tickets?.reduce((sum: number, t: any) => sum + Number(t.amount_paid || 0), 0) || 0;
  const netRevenue = totalRevenue * (1 - ticketCommission / 100);
  const commissionDeducted = totalRevenue - netRevenue;

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
          <div className="flex gap-2 flex-wrap">
            <Link to={`/org/events/${id}/checkin`}>
              <Button variant="outline">
                <Users className="mr-2 h-4 w-4" />
                Check-in Dashboard
              </Button>
            </Link>
            <Link to={`/org/events/${id}/scanner`}>
              <Button variant="outline">
                <QrCode className="mr-2 h-4 w-4" />
                Scanner
              </Button>
            </Link>
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
                  <div className="flex items-center gap-1">
                    <p className="text-sm text-muted-foreground">Net Revenue</p>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">
                            {ticketCommission}% commission<br/>
                            Deducted: ₦{commissionDeducted.toLocaleString()}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">₦{netRevenue.toLocaleString()}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" />
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
            <TabsTrigger value="marketing">Marketing</TabsTrigger>
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
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Currency *</Label>
                        <CurrencySelector
                          value={newTicketType.currency}
                          onValueChange={(value) => setNewTicketType(prev => ({ ...prev, currency: value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Price ({getCurrencySymbol(newTicketType.currency)}) *</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          min="0"
                          step="0.01"
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
                  <Card key={ticketType.id} className="relative group">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setEditingTicketType(ticketType)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
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
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        {ticketType.quantity_available - ticketType.quantity_sold} remaining
                      </p>
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
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle>Attendees ({tickets?.length || 0})</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleExportAttendees}>
                      <Download className="mr-2 h-4 w-4" />
                      Quick CSV
                    </Button>
                    <AttendanceReportExport eventId={id!} eventTitle={event.title} />
                  </div>
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
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>QR Scan Logs</CardTitle>
                    <CardDescription>Track check-ins at your event</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleExportScanLogs}>
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                  </Button>
                </div>
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

          <TabsContent value="marketing" className="space-y-6">
            <EventAutoPostingCard eventId={id!} eventTitle={event.title} />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Event Details</CardTitle>
                <CardDescription>Update your event information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Event Title *</Label>
                  <Input
                    id="edit-title"
                    value={editForm.title}
                    onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    rows={4}
                    value={editForm.description}
                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-category">Category *</Label>
                  <Select
                    value={editForm.category}
                    onValueChange={(value) => setEditForm(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <ImageUpload
                  bucket="event-images"
                  value={editForm.image_url}
                  onChange={(url) => setEditForm(prev => ({ ...prev, image_url: url }))}
                  label="Event Banner Image"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Date & Location</CardTitle>
                <CardDescription>Update event schedule and venue</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-event-date">Event Date & Time *</Label>
                  <Input
                    id="edit-event-date"
                    type="datetime-local"
                    value={editForm.event_date}
                    onChange={(e) => setEditForm(prev => ({ ...prev, event_date: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-venue">Venue Name *</Label>
                  <Input
                    id="edit-venue"
                    value={editForm.venue}
                    onChange={(e) => setEditForm(prev => ({ ...prev, venue: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-address">Full Address</Label>
                  <Textarea
                    id="edit-address"
                    rows={2}
                    value={editForm.address}
                    onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSaveEventDetails} disabled={updateEvent.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {updateEvent.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
        {/* Edit Ticket Type Dialog */}
        <EditTicketTypeDialog
          ticketType={editingTicketType}
          open={!!editingTicketType}
          onOpenChange={(open) => !open && setEditingTicketType(null)}
        />
      </div>
    </OrganizationLayout>
  );
};

export default EventManagement;
