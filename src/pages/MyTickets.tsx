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
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  ArrowRightLeft,
  AlertCircle,
  X,
  Clock as ClockIcon,
  History,
  User,
  ArrowRight
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const TicketCard = ({ ticket, pendingTransfer, transferHistory, onTransferComplete }: { 
  ticket: any; 
  pendingTransfer: any | null;
  transferHistory: any[];
  onTransferComplete: () => void;
}) => {
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [transferEmail, setTransferEmail] = useState('');
  const [transferName, setTransferName] = useState('');
  const printRef = useRef<HTMLDivElement>(null);
  const qrRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const ticketUrl = `${window.location.origin}/events/${ticket.event_id}`;
  const hasPendingTransfer = pendingTransfer && pendingTransfer.status === 'pending';
  const hasTransferHistory = transferHistory && transferHistory.length > 0;

  const cancelTransfer = async () => {
    if (!pendingTransfer) return;
    
    setCancelling(true);
    try {
      const { error } = await supabase
        .from('ticket_transfers')
        .update({ status: 'cancelled' })
        .eq('id', pendingTransfer.id);

      if (error) throw error;

      toast({ title: "Transfer cancelled", description: "The pending transfer has been cancelled." });
      setShowCancelDialog(false);
      queryClient.invalidateQueries({ queryKey: ['pending-transfers'] });
      onTransferComplete();
    } catch (error: any) {
      toast({ title: "Failed to cancel transfer", description: error.message, variant: "destructive" });
    } finally {
      setCancelling(false);
    }
  };


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

    // Get the QR code SVG from the hidden ref element
    const svg = qrRef.current?.querySelector('svg');
    const svgData = svg ? new XMLSerializer().serializeToString(svg) : '';

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
            padding: 20px;
            background: #fff;
          }
          .ticket {
            width: 100%;
            max-width: 400px;
            margin: 0 auto;
            border: 2px solid #7c3aed;
            border-radius: 12px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            background: #fff;
          }
          .qr-section {
            background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
            padding: 32px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          .qr-code {
            width: 380px;
            height: 380px;
            background: white;
            border-radius: 12px;
            padding: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .qr-code svg { width: 100%; height: 100%; }
          .qr-label { 
            font-size: 11px; 
            color: white; 
            margin-top: 10px; 
            text-align: center;
            opacity: 0.9;
          }
          .info-section {
            padding: 20px;
          }
          .event-title { 
            font-size: 18px; 
            font-weight: 700;
            color: #1f1f1f;
            margin-bottom: 4px;
            text-align: center;
          }
          .ticket-type { 
            font-size: 13px; 
            color: #7c3aed;
            font-weight: 600;
            text-align: center;
            margin-bottom: 16px;
            padding-bottom: 16px;
            border-bottom: 1px dashed #e5e7eb;
          }
          .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }
          .detail-item {
          }
          .detail-label {
            font-size: 10px;
            color: #888;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 2px;
          }
          .detail-value {
            font-size: 14px;
            font-weight: 600;
            color: #1f1f1f;
          }
          .holder-name {
            color: #7c3aed;
          }
          .full-width {
            grid-column: 1 / -1;
          }
          .footer-row {
            display: flex;
            justify-content: space-between;
            margin-top: 16px;
            padding-top: 12px;
            border-top: 1px solid #eee;
            font-size: 11px;
            color: #666;
          }
          .ticket-id { font-family: monospace; }
          .amount { font-weight: 600; color: #1f1f1f; }
          @media print {
            body { padding: 10px; }
          }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="qr-section">
            <div class="qr-code">${svgData}</div>
            <p class="qr-label">Scan for entry</p>
          </div>
          <div class="info-section">
            <div class="event-title">${ticket.event?.title}</div>
            <div class="ticket-type">${ticket.ticket_type?.name} × ${ticket.quantity}</div>
            <div class="details-grid">
              <div class="detail-item full-width">
                <div class="detail-label">Ticket Holder</div>
                <div class="detail-value holder-name">${ticket.guest_name || 'Guest'}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Date</div>
                <div class="detail-value">${eventDate}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Time</div>
                <div class="detail-value">${eventTime}</div>
              </div>
              <div class="detail-item full-width">
                <div class="detail-label">Venue</div>
                <div class="detail-value">${ticket.event?.venue}</div>
              </div>
            </div>
            <div class="footer-row">
              <span class="ticket-id">CODE: ${ticket.qr_code?.slice(0, 12) || ticket.id.slice(0, 8).toUpperCase()}</span>
              <span class="amount">₦${Number(ticket.amount_paid).toLocaleString()}</span>
            </div>
          </div>
        </div>
        <script>
          window.onload = function() { window.print(); window.close(); };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <>
      {/* Hidden QR code for print extraction */}
      <div ref={qrRef} className="sr-only" aria-hidden="true">
        <QRCodeSVG
          value={ticket.qr_code}
          size={150}
          level="H"
          includeMargin={true}
        />
      </div>
      
      <Card className={`overflow-hidden ${hasPendingTransfer ? 'ring-2 ring-amber-500/50' : ''}`}>
      {/* Pending Transfer Banner */}
      {hasPendingTransfer && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <div className="text-sm">
              <span className="text-amber-600 dark:text-amber-400 font-medium">Transfer pending</span>
              <span className="text-muted-foreground ml-1">
                to {pendingTransfer.to_user_email}
              </span>
              <span className="text-muted-foreground text-xs ml-2">
                · Expires {formatDistanceToNow(new Date(pendingTransfer.expires_at), { addSuffix: true })}
              </span>
            </div>
          </div>
          <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="border-amber-500/30 hover:bg-amber-500/10">
                <X className="h-4 w-4 mr-1" />
                Cancel Transfer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cancel Transfer</DialogTitle>
                <DialogDescription>
                  Are you sure you want to cancel this pending transfer?
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="bg-secondary/50 rounded-lg p-4">
                  <p className="text-sm">
                    <span className="text-muted-foreground">Recipient:</span>{' '}
                    <span className="font-medium">{pendingTransfer.to_user_email}</span>
                  </p>
                  <p className="text-sm mt-1">
                    <span className="text-muted-foreground">Transfer code:</span>{' '}
                    <span className="font-mono text-xs">{pendingTransfer.transfer_code}</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowCancelDialog(false)} className="flex-1">
                    Keep Transfer
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={cancelTransfer} 
                    disabled={cancelling}
                    className="flex-1"
                  >
                    {cancelling ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Cancelling...</>
                    ) : (
                      'Cancel Transfer'
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
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

                {ticket.status === 'active' && !hasPendingTransfer && (
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
                  </>
                )}

                {/* Transfer History Button */}
                {hasTransferHistory && (
                  <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                        <History className="h-4 w-4 mr-1" />
                        History ({transferHistory.length})
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <History className="h-5 w-5" />
                          Transfer History
                        </DialogTitle>
                        <DialogDescription>
                          Previous owners and transfer records for this ticket
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4 max-h-[400px] overflow-y-auto">
                        {/* Current Owner */}
                        <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
                          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">You (Current Owner)</p>
                            <p className="text-xs text-muted-foreground">
                              {transferHistory.length > 0 
                                ? `Received ${formatDistanceToNow(new Date(transferHistory[0].completed_at), { addSuffix: true })}`
                                : 'Original purchaser'
                              }
                            </p>
                          </div>
                          <Badge variant="default" className="text-xs">Current</Badge>
                        </div>

                        {/* Transfer History */}
                        {transferHistory.map((transfer: any, index: number) => (
                          <div key={transfer.id} className="relative">
                            {/* Connector Line */}
                            <div className="absolute left-5 -top-4 w-px h-4 bg-border" />
                            
                            <div className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg">
                              <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium truncate">
                                    From: {transfer.to_user_email === user?.email ? 'Previous owner' : transfer.to_user_email}
                                  </p>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Transferred {format(new Date(transfer.completed_at), 'MMM d, yyyy')} at {format(new Date(transfer.completed_at), 'h:mm a')}
                                </p>
                                <p className="text-xs text-muted-foreground font-mono mt-1">
                                  Code: {transfer.transfer_code}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}

                        {transferHistory.length === 0 && (
                          <div className="text-center py-6 text-muted-foreground">
                            <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No transfer history</p>
                            <p className="text-xs">You are the original purchaser</p>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
    </>
  );
};

const MyTickets = () => {
  const { data: tickets, isLoading, refetch } = useMyTickets();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch pending transfers for all user's tickets
  const { data: pendingTransfers } = useQuery({
    queryKey: ['pending-transfers', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('ticket_transfers')
        .select('*')
        .eq('from_user_id', user.id)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString());
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch transfer history for all tickets
  const { data: allTransferHistory } = useQuery({
    queryKey: ['transfer-history', user?.id],
    queryFn: async () => {
      if (!user || !tickets) return [];
      const ticketIds = tickets.map((t: any) => t.id);
      if (ticketIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('ticket_transfers')
        .select('*')
        .in('ticket_id', ticketIds)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!tickets && tickets.length > 0,
  });

  const getPendingTransfer = (ticketId: string) => {
    return pendingTransfers?.find((t: any) => t.ticket_id === ticketId) || null;
  };

  const getTransferHistory = (ticketId: string) => {
    return allTransferHistory?.filter((t: any) => t.ticket_id === ticketId) || [];
  };

  const handleTransferComplete = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ['pending-transfers'] });
  };

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
              <TicketCard 
                key={ticket.id} 
                ticket={ticket} 
                pendingTransfer={getPendingTransfer(ticket.id)}
                transferHistory={getTransferHistory(ticket.id)}
                onTransferComplete={handleTransferComplete} 
              />
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
