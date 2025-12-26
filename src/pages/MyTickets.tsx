import React, { useState, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMyTickets } from '@/hooks/useEvents';
import RefundRequestDialog from '@/components/RefundRequestDialog';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { 
  Ticket, 
  Calendar, 
  MapPin, 
  Clock, 
  Hash, 
  CreditCard, 
  RotateCcw, 
  Maximize2, 
  Download,
  Share2,
  Copy,
  Mail,
  Printer,
  Check,
  Loader2,
  Send,
  ArrowRightLeft
} from 'lucide-react';
import { format } from 'date-fns';

const TicketCard = ({ ticket, onTransferComplete }: { ticket: any; onTransferComplete: () => void }) => {
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [transferEmail, setTransferEmail] = useState('');
  const [transferName, setTransferName] = useState('');
  const printRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const ticketUrl = `${window.location.origin}/events/${ticket.event_id}`;

  const generateTransferCode = () => {
    return `TXF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  };

  const transferTicket = async () => {
    if (!transferEmail) {
      toast({ title: "Please enter recipient email", variant: "destructive" });
      return;
    }

    if (!user) {
      toast({ title: "Please log in to transfer tickets", variant: "destructive" });
      return;
    }

    setTransferring(true);
    try {
      const transferCode = generateTransferCode();
      const acceptUrl = `${window.location.origin}/accept-transfer?code=${transferCode}`;

      // Get sender's profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      // Check if recipient exists
      const { data: recipientProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', transferEmail)
        .maybeSingle();

      // Create transfer record
      const { error: transferError } = await supabase
        .from('ticket_transfers')
        .insert({
          ticket_id: ticket.id,
          from_user_id: user.id,
          to_user_id: recipientProfile?.id || user.id,
          to_user_email: transferEmail,
          transfer_code: transferCode,
          status: 'pending',
        });

      if (transferError) throw transferError;

      // Send email notification
      const { error: emailError } = await supabase.functions.invoke('transfer-ticket-email', {
        body: {
          recipientEmail: transferEmail,
          recipientName: transferName,
          senderName: profile?.full_name || 'Someone',
          eventTitle: ticket.event?.title,
          eventDate: format(new Date(ticket.event?.event_date), 'EEEE, MMMM d, yyyy'),
          eventTime: format(new Date(ticket.event?.event_date), 'h:mm a'),
          venue: ticket.event?.venue,
          ticketType: ticket.ticket_type?.name,
          quantity: ticket.quantity,
          transferCode,
          acceptUrl,
        },
      });

      if (emailError) {
        console.error('Email error:', emailError);
      }

      toast({ 
        title: "Transfer initiated!", 
        description: `An email has been sent to ${transferEmail} with instructions to accept the ticket.` 
      });
      
      setTransferEmail('');
      setTransferName('');
      setShowTransferDialog(false);
    } catch (error: any) {
      console.error('Transfer error:', error);
      toast({ 
        title: "Transfer failed", 
        description: error.message,
        variant: "destructive" 
      });
    } finally {
      setTransferring(false);
    }
  };


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

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(ticketUrl);
      setCopied(true);
      toast({ title: "Link copied!", description: "Ticket link copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  const shareViaEmail = async () => {
    if (!recipientEmail) {
      toast({ title: "Please enter an email address", variant: "destructive" });
      return;
    }

    setEmailSending(true);
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .single();

      const { error } = await supabase.functions.invoke('share-ticket-email', {
        body: {
          recipientEmail,
          recipientName,
          senderName: profile?.full_name || 'Someone',
          eventTitle: ticket.event?.title,
          eventDate: format(new Date(ticket.event?.event_date), 'EEEE, MMMM d, yyyy'),
          eventTime: format(new Date(ticket.event?.event_date), 'h:mm a'),
          venue: ticket.event?.venue,
          ticketType: ticket.ticket_type?.name,
          quantity: ticket.quantity,
          ticketCode: ticket.qr_code,
          ticketUrl,
        },
      });

      if (error) throw error;

      toast({ title: "Ticket shared!", description: `Email sent to ${recipientEmail}` });
      setRecipientEmail('');
      setRecipientName('');
      setShowShareDialog(false);
    } catch (error: any) {
      toast({ 
        title: "Failed to send email", 
        description: error.message,
        variant: "destructive" 
      });
    } finally {
      setEmailSending(false);
    }
  };

  const printTicket = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({ title: "Please allow popups to print", variant: "destructive" });
      return;
    }

    const eventDate = format(new Date(ticket.event?.event_date), 'EEEE, MMMM d, yyyy');
    const eventTime = format(new Date(ticket.event?.event_date), 'h:mm a');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ticket - ${ticket.event?.title}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 40px;
            background: #fff;
          }
          .ticket {
            max-width: 600px;
            margin: 0 auto;
            border: 3px solid #7c3aed;
            border-radius: 16px;
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
            color: white;
            padding: 24px;
            text-align: center;
          }
          .header h1 { font-size: 24px; margin-bottom: 4px; }
          .header p { opacity: 0.9; font-size: 14px; }
          .content {
            display: flex;
            padding: 24px;
          }
          .qr-section {
            flex-shrink: 0;
            padding-right: 24px;
            border-right: 2px dashed #e5e7eb;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          .qr-code {
            width: 150px;
            height: 150px;
            background: #f3f4f6;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .qr-code svg { width: 100%; height: 100%; }
          .qr-label { font-size: 10px; color: #6b7280; margin-top: 8px; text-align: center; }
          .details {
            flex: 1;
            padding-left: 24px;
          }
          .detail-row {
            margin-bottom: 16px;
          }
          .detail-label {
            font-size: 12px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .detail-value {
            font-size: 16px;
            font-weight: 600;
            color: #111827;
            margin-top: 2px;
          }
          .footer {
            background: #f9fafb;
            padding: 16px 24px;
            border-top: 1px solid #e5e7eb;
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            color: #6b7280;
          }
          .ticket-id { font-family: monospace; }
          @media print {
            body { padding: 20px; }
            .ticket { border-width: 2px; }
          }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="header">
            <h1>${ticket.event?.title}</h1>
            <p>${ticket.ticket_type?.name} × ${ticket.quantity}</p>
          </div>
          <div class="content">
            <div class="qr-section">
              <div class="qr-code" id="qr-container"></div>
              <p class="qr-label">Scan for entry</p>
            </div>
            <div class="details">
              <div class="detail-row">
                <div class="detail-label">Date</div>
                <div class="detail-value">${eventDate}</div>
              </div>
              <div class="detail-row">
                <div class="detail-label">Time</div>
                <div class="detail-value">${eventTime}</div>
              </div>
              <div class="detail-row">
                <div class="detail-label">Venue</div>
                <div class="detail-value">${ticket.event?.venue}</div>
              </div>
              <div class="detail-row">
                <div class="detail-label">Ticket Code</div>
                <div class="detail-value" style="font-family: monospace; font-size: 12px;">${ticket.qr_code}</div>
              </div>
            </div>
          </div>
          <div class="footer">
            <span class="ticket-id">ID: ${ticket.id.slice(0, 8).toUpperCase()}</span>
            <span>Amount Paid: ₦${Number(ticket.amount_paid).toLocaleString()}</span>
          </div>
        </div>
        <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
        <script>
          QRCode.toCanvas(document.createElement('canvas'), '${ticket.qr_code}', { width: 150 }, function(error, canvas) {
            if (!error) {
              document.getElementById('qr-container').appendChild(canvas);
              setTimeout(function() { window.print(); window.close(); }, 500);
            }
          });
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
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
            <div className="flex flex-col gap-3">
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

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Share2 className="h-4 w-4 mr-1" />
                      Share
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Share Ticket</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      {/* Copy Link */}
                      <div className="space-y-2">
                        <Label>Copy Link</Label>
                        <div className="flex gap-2">
                          <Input value={ticketUrl} readOnly className="flex-1" />
                          <Button onClick={copyLink} variant="outline" size="icon">
                            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      <Separator />

                      {/* Email Share */}
                      <div className="space-y-3">
                        <Label>Share via Email</Label>
                        <div className="space-y-2">
                          <Input 
                            placeholder="Recipient name (optional)"
                            value={recipientName}
                            onChange={(e) => setRecipientName(e.target.value)}
                          />
                          <Input 
                            type="email"
                            placeholder="Recipient email"
                            value={recipientEmail}
                            onChange={(e) => setRecipientEmail(e.target.value)}
                          />
                        </div>
                        <Button onClick={shareViaEmail} disabled={emailSending} className="w-full">
                          {emailSending ? (
                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending...</>
                          ) : (
                            <><Mail className="h-4 w-4 mr-2" /> Send Email</>
                          )}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button variant="outline" size="sm" onClick={printTicket}>
                  <Printer className="h-4 w-4 mr-1" />
                  Print
                </Button>

                {ticket.status === 'active' && (
                  <>
                    <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <ArrowRightLeft className="h-4 w-4 mr-1" />
                          Transfer
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Transfer Ticket</DialogTitle>
                          <DialogDescription>
                            Transfer this ticket to another person. They will receive an email with instructions to accept it.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="bg-secondary/50 rounded-lg p-4">
                            <h4 className="font-semibold">{ticket.event?.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {ticket.ticket_type?.name} × {ticket.quantity}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(ticket.event?.event_date), 'MMM d, yyyy')} at {format(new Date(ticket.event?.event_date), 'h:mm a')}
                            </p>
                          </div>

                          <div className="space-y-3">
                            <div className="space-y-2">
                              <Label htmlFor="transfer-name">Recipient Name (optional)</Label>
                              <Input 
                                id="transfer-name"
                                placeholder="Enter recipient's name"
                                value={transferName}
                                onChange={(e) => setTransferName(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="transfer-email">Recipient Email *</Label>
                              <Input 
                                id="transfer-email"
                                type="email"
                                placeholder="Enter recipient's email"
                                value={transferEmail}
                                onChange={(e) => setTransferEmail(e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                            <p className="text-sm text-amber-600 dark:text-amber-400">
                              <strong>Note:</strong> Once the recipient accepts, this ticket will be removed from your account. The transfer expires in 48 hours if not accepted.
                            </p>
                          </div>

                          <Button 
                            onClick={transferTicket} 
                            disabled={transferring || !transferEmail} 
                            className="w-full"
                          >
                            {transferring ? (
                              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Transferring...</>
                            ) : (
                              <><Send className="h-4 w-4 mr-2" /> Send Transfer</>
                            )}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <RefundRequestDialog
                      transactionType="ticket"
                      transactionId={ticket.id}
                      amount={Number(ticket.amount_paid)}
                      itemName={`${ticket.event?.title} - ${ticket.ticket_type?.name}`}
                    >
                      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Refund
                      </Button>
                    </RefundRequestDialog>
                  </>
                )}
              </div>
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
              <TicketCard key={ticket.id} ticket={ticket} onTransferComplete={() => {}} />
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
