import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useMyTickets } from '@/hooks/useEvents';
import RefundRequestDialog from '@/components/RefundRequestDialog';
import { QRCodeSVG } from 'qrcode.react';
import { Ticket, Calendar, MapPin, Clock, Hash, CreditCard, RotateCcw, Maximize2, Download } from 'lucide-react';
import { format } from 'date-fns';

const TicketCard = ({ ticket }: { ticket: any }) => {
  const [showQRDialog, setShowQRDialog] = useState(false);

  const downloadQRCode = () => {
    const svg = document.getElementById(`qr-full-${ticket.id}`);
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `ticket-${ticket.qr_code}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      };
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col lg:flex-row">
          {/* QR Code Section */}
          <div className="bg-secondary/50 p-6 flex flex-col items-center justify-center lg:w-48 border-b lg:border-b-0 lg:border-r border-dashed border-border">
            <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
              <DialogTrigger asChild>
                <button className="relative group cursor-pointer">
                  <QRCodeSVG
                    value={ticket.qr_code}
                    size={120}
                    level="H"
                    includeMargin={true}
                    className="rounded-lg"
                  />
                  <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                    <Maximize2 className="h-6 w-6 text-foreground" />
                  </div>
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>Ticket QR Code</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="bg-white p-4 rounded-xl">
                    <QRCodeSVG
                      id={`qr-full-${ticket.id}`}
                      value={ticket.qr_code}
                      size={250}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground font-mono text-center break-all">
                    {ticket.qr_code}
                  </p>
                  <Button onClick={downloadQRCode} variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Download QR Code
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <p className="text-xs text-muted-foreground mt-2">Tap to enlarge</p>
          </div>

          {/* Ticket Details Section */}
          <div className="flex-1 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-bold text-xl text-foreground">{ticket.event?.title}</h3>
                <p className="text-primary font-medium">{ticket.ticket_type?.name}</p>
              </div>
              <Badge 
                variant={ticket.status === 'active' ? 'default' : ticket.status === 'used' ? 'secondary' : 'destructive'}
                className="flex-shrink-0"
              >
                {ticket.status === 'active' ? 'Valid' : ticket.status === 'used' ? 'Used' : ticket.status}
              </Badge>
            </div>

            <Separator className="my-4" />

            {/* Event Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Date</p>
                  <p className="font-medium">{format(new Date(ticket.event?.event_date), 'EEEE, MMM d, yyyy')}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Time</p>
                  <p className="font-medium">{format(new Date(ticket.event?.event_date), 'h:mm a')}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Venue</p>
                  <p className="font-medium">{ticket.event?.venue}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Ticket className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Quantity</p>
                  <p className="font-medium">{ticket.quantity} {ticket.quantity > 1 ? 'tickets' : 'ticket'}</p>
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Footer Info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  <span className="font-mono">{ticket.id.slice(0, 8).toUpperCase()}</span>
                </span>
                <span className="flex items-center gap-1">
                  <CreditCard className="h-3 w-3" />
                  ₦{Number(ticket.amount_paid).toLocaleString()}
                </span>
                <span>
                  Purchased {format(new Date(ticket.created_at), 'MMM d, yyyy')}
                </span>
              </div>

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
  );
};

const MyTickets = () => {
  const { data: tickets, isLoading } = useMyTickets();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">My Tickets</h1>
          <p className="text-muted-foreground">View and manage your event tickets</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col lg:flex-row">
                    <div className="bg-secondary/50 p-6 flex items-center justify-center lg:w-48 border-b lg:border-b-0 lg:border-r border-dashed border-border">
                      <Skeleton className="h-32 w-32 rounded-lg" />
                    </div>
                    <div className="flex-1 p-6 space-y-4">
                      <div className="flex justify-between">
                        <div className="space-y-2">
                          <Skeleton className="h-6 w-48" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                        <Skeleton className="h-6 w-16 rounded-full" />
                      </div>
                      <Skeleton className="h-px w-full" />
                      <div className="grid grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map(j => (
                          <div key={j} className="flex items-center gap-3">
                            <Skeleton className="h-10 w-10 rounded-lg" />
                            <div className="space-y-1">
                              <Skeleton className="h-3 w-12" />
                              <Skeleton className="h-4 w-24" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : tickets && tickets.length > 0 ? (
          <div className="space-y-4">
            {tickets.map((ticket: any) => (
              <TicketCard key={ticket.id} ticket={ticket} />
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
