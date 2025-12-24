import React from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useMyTickets } from '@/hooks/useEvents';
import TicketQRCode from '@/components/TicketQRCode';
import { Ticket, Calendar, MapPin } from 'lucide-react';
import { format } from 'date-fns';

const MyTickets = () => {
  const { data: tickets, isLoading } = useMyTickets();

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'used': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">My Tickets</h1>
          <Link to="/events">
            <Button variant="outline">Browse Events</Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        ) : tickets && tickets.length > 0 ? (
          <div className="space-y-4">
            {tickets.map((ticket: any) => (
              <Card key={ticket.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    {/* QR Code Section */}
                    <div className="bg-secondary/30 p-4 flex items-center justify-center md:border-r border-b md:border-b-0">
                      <TicketQRCode
                        qrCode={ticket.qr_code}
                        ticketId={ticket.id}
                        eventTitle={ticket.event?.title || 'Event'}
                        ticketType={ticket.ticket_type?.name || 'Standard'}
                        quantity={ticket.quantity}
                        size="md"
                      />
                    </div>
                    
                    {/* Ticket Details */}
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-lg">{ticket.event?.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {ticket.ticket_type?.name} × {ticket.quantity}
                          </p>
                        </div>
                        <Badge variant={getStatusVariant(ticket.status)}>
                          {ticket.status}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {ticket.event?.event_date 
                            ? format(new Date(ticket.event.event_date), 'MMM d, yyyy • h:mm a')
                            : 'Date TBD'}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {ticket.event?.venue || 'Venue TBD'}
                        </span>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">Amount Paid</p>
                          <p className="font-semibold">₦{Number(ticket.amount_paid).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Purchased</p>
                          <p className="text-sm">{format(new Date(ticket.created_at), 'MMM d, yyyy')}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Ticket className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">No tickets yet</h3>
            <p className="text-muted-foreground mb-4">Purchase tickets to events to see them here.</p>
            <Link to="/events">
              <Button>Browse Events</Button>
            </Link>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MyTickets;
