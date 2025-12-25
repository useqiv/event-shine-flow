import React, { useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAdminEvents } from '@/hooks/useAdminData';
import { Search, MoreHorizontal, Eye, Pause, Play, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

const AdminEvents: React.FC = () => {
  const { data: events, isLoading } = useAdminEvents();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEvents = events?.filter(event => 
    (event.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (event.venue?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (event.category?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  ) || [];

  const toggleEventStatus = async (eventId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('events')
      .update({ is_active: !currentStatus })
      .eq('id', eventId);

    if (error) {
      toast.error('Failed to update event');
    } else {
      toast.success(currentStatus ? 'Event paused' : 'Event activated');
      queryClient.invalidateQueries({ queryKey: ['admin-all-events'] });
    }
  };

  const getStatusBadge = (event: any) => {
    const now = new Date();
    const eventDate = event.event_date ? new Date(event.event_date) : null;

    if (!event.is_active) {
      return <Badge variant="secondary">Paused</Badge>;
    }
    if (eventDate && now > eventDate) {
      return <Badge variant="secondary">Past</Badge>;
    }
    return <Badge className="bg-green-500">Active</Badge>;
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Event Management</h1>
            <p className="text-muted-foreground">View and manage all events</p>
          </div>
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-10 w-full mb-4" />
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Event Management</h1>
          <p className="text-muted-foreground">View and manage all events</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{events?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Total Events</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-500">
                {events?.filter(e => e.is_active && new Date(e.event_date) > new Date()).length || 0}
              </div>
              <p className="text-xs text-muted-foreground">Active</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {events?.reduce((sum, e) => sum + (e.tickets?.[0]?.count || 0), 0)?.toLocaleString() || 0}
              </div>
              <p className="text-xs text-muted-foreground">Tickets Sold</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {events?.reduce((sum, e) => sum + (e.ticket_types?.[0]?.count || 0), 0) || 0}
              </div>
              <p className="text-xs text-muted-foreground">Ticket Types</p>
            </CardContent>
          </Card>
        </div>

        {/* Events Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Events</CardTitle>
            <CardDescription>View event details and ticket sales</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="flex items-center gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Venue</TableHead>
                    <TableHead>Tickets Sold</TableHead>
                    <TableHead>Event Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {event.image_url && (
                            <img 
                              src={event.image_url} 
                              alt={event.title}
                              className="h-10 w-10 rounded object-cover"
                            />
                          )}
                          <span className="font-medium">{event.title}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{event.category}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(event)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3" />
                          {event.venue}
                        </div>
                      </TableCell>
                      <TableCell>{event.tickets?.[0]?.count || 0}</TableCell>
                      <TableCell>{event.event_date ? format(new Date(event.event_date), 'MMM d, yyyy') : 'TBD'}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/admin/events/${event.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleEventStatus(event.id, event.is_active)}>
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
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminEvents;