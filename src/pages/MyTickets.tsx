import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useMyTickets } from '@/hooks/useEvents';
import RefundRequestDialog from '@/components/RefundRequestDialog';
import { Ticket, Calendar, MapPin, QrCode, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';

const MyTickets = () => {
  const { data: tickets, isLoading } = useMyTickets();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">My Tickets</h1>

        {isLoading ? (
          <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-32 w-full" />)}</div>
        ) : tickets && tickets.length > 0 ? (
          <div className="space-y-4">
            {tickets.map((ticket: any) => (
              <Card key={ticket.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="h-20 w-20 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                      <QrCode className="h-10 w-10 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{ticket.event?.title}</h3>
                          <p className="text-sm text-muted-foreground">{ticket.ticket_type?.name} × {ticket.quantity}</p>
                        </div>
                        <Badge variant={ticket.status === 'active' ? 'default' : 'secondary'}>{ticket.status}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{format(new Date(ticket.event?.event_date), 'MMM d, yyyy')}</span>
                        <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{ticket.event?.venue}</span>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <p className="text-xs text-muted-foreground font-mono">QR: {ticket.qr_code}</p>
                        {ticket.status === 'active' && (
                          <RefundRequestDialog
                            transactionType="ticket"
                            transactionId={ticket.id}
                            amount={Number(ticket.amount_paid)}
                            itemName={`${ticket.event?.title} - ${ticket.ticket_type?.name}`}
                          >
                            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                              <RotateCcw className="h-4 w-4 mr-1" />
                              Request Refund
                            </Button>
                          </RefundRequestDialog>
                        )}
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
            <p className="text-muted-foreground">Purchase tickets to events to see them here.</p>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MyTickets;
