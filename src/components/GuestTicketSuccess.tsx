import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { QRCodeSVG } from 'qrcode.react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Ticket,
  Calendar,
  MapPin,
  Clock,
  Download,
  Mail,
  Share2,
  Copy,
  Check,
  Loader2,
  Smartphone,
  X
} from 'lucide-react';

interface GuestTicketSuccessProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: {
    qrCode: string;
    quantity: number;
    guestEmail: string;
    guestName?: string;
  };
  event: {
    title: string;
    date: string;
    venue: string;
    ticketTypeName: string;
  };
}

const GuestTicketSuccess = ({ open, onOpenChange, ticket, event }: GuestTicketSuccessProps) => {
  const { toast } = useToast();
  const qrRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [sendToEmail, setSendToEmail] = useState(ticket.guestEmail);
  const [showEmailForm, setShowEmailForm] = useState(false);

  const downloadQRCode = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

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
      downloadLink.download = `ticket-${ticket.qrCode}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(ticket.qrCode);
      setCopied(true);
      toast({ title: "Copied!", description: "Ticket code copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  const sendTicketToEmail = async () => {
    if (!sendToEmail) {
      toast({ title: "Please enter an email", variant: "destructive" });
      return;
    }

    setEmailSending(true);
    try {
      const { error } = await supabase.functions.invoke('send-payment-receipt', {
        body: {
          type: 'ticket',
          user_email: sendToEmail,
          user_name: ticket.guestName || 'Guest',
          amount: 0,
          currency: 'NGN',
          quantity: ticket.quantity,
          payment_method: 'Free Ticket',
          transaction_ref: ticket.qrCode,
          event_title: event.title,
          event_date: event.date,
          event_venue: event.venue,
          ticket_type: event.ticketTypeName,
          qr_code: ticket.qrCode
        }
      });

      if (error) throw error;

      toast({ 
        title: "Ticket sent!", 
        description: `Your ticket has been sent to ${sendToEmail}` 
      });
      setShowEmailForm(false);
    } catch (error: any) {
      toast({ 
        title: "Failed to send", 
        description: error.message || "Could not send ticket email", 
        variant: "destructive" 
      });
    } finally {
      setEmailSending(false);
    }
  };

  const shareTicket = async () => {
    const shareData = {
      title: `Ticket for ${event.title}`,
      text: `My ticket for ${event.title} on ${event.date} at ${event.venue}. Ticket Code: ${ticket.qrCode}`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled or error
      }
    } else {
      copyToClipboard();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-success">
            <Check className="h-6 w-6" />
            <DialogTitle>Ticket Claimed Successfully!</DialogTitle>
          </div>
          <DialogDescription>
            Your free ticket has been claimed. Save or share it below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Ticket Visual */}
          <Card className="overflow-hidden">
            <CardContent className="p-4 space-y-4">
              {/* Event Info */}
              <div className="space-y-2">
                <h3 className="font-bold text-lg">{event.title}</h3>
                <Badge variant="secondary">{event.ticketTypeName}</Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{event.date}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{event.venue}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Ticket className="h-4 w-4" />
                  <span>Quantity: {ticket.quantity}</span>
                </div>
              </div>

              <Separator />

              {/* QR Code */}
              <div className="flex flex-col items-center py-4" ref={qrRef}>
                <QRCodeSVG 
                  value={ticket.qrCode} 
                  size={180}
                  level="H"
                  includeMargin
                  className="rounded-lg"
                />
                <p className="text-xs text-muted-foreground mt-2 font-mono">{ticket.qrCode}</p>
              </div>

              <Separator />

              {/* Guest Info */}
              <div className="text-sm text-muted-foreground">
                <p>Ticket holder: {ticket.guestName || 'Guest'}</p>
                <p>Email: {ticket.guestEmail}</p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-3">
            {/* Primary Actions */}
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={downloadQRCode} className="gap-2">
                <Download className="h-4 w-4" />
                Save QR
              </Button>
              <Button variant="outline" onClick={shareTicket} className="gap-2">
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </div>

            {/* Copy Code */}
            <Button 
              variant="outline" 
              onClick={copyToClipboard} 
              className="w-full gap-2"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy Ticket Code'}
            </Button>

            {/* Send to Phone/Email */}
            {!showEmailForm ? (
              <Button 
                onClick={() => setShowEmailForm(true)} 
                className="w-full gap-2"
              >
                <Smartphone className="h-4 w-4" />
                Send to My Phone
              </Button>
            ) : (
              <Card className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label>Send ticket to email</Label>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={() => setShowEmailForm(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={sendToEmail}
                    onChange={(e) => setSendToEmail(e.target.value)}
                  />
                  <Button 
                    onClick={sendTicketToEmail} 
                    disabled={emailSending}
                    className="w-full gap-2"
                  >
                    {emailSending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4" />
                        Send Ticket
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            )}
          </div>

          {/* Note */}
          <p className="text-xs text-muted-foreground text-center">
            A copy of your ticket has also been sent to {ticket.guestEmail}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GuestTicketSuccess;
