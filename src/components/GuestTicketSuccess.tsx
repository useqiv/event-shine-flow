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
  const hiddenQrRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [sendToEmail, setSendToEmail] = useState(ticket.guestEmail);
  const [showEmailForm, setShowEmailForm] = useState(false);

  const downloadFullTicket = () => {
    const svg = hiddenQrRef.current?.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const qrImg = new Image();

    qrImg.onload = () => {
      // Create a high-resolution ticket canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Ticket dimensions (vertical layout)
      const width = 600;
      const height = 900;
      canvas.width = width;
      canvas.height = height;

      // Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Orange accent border at top
      ctx.fillStyle = '#f05a28';
      ctx.fillRect(0, 0, width, 8);

      // Header section
      ctx.fillStyle = '#f05a28';
      ctx.fillRect(0, 8, width, 80);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🎟️ EVENT TICKET', width / 2, 58);

      // Event title
      ctx.fillStyle = '#1a1a1a';
      ctx.font = 'bold 24px system-ui, sans-serif';
      ctx.textAlign = 'center';
      const titleY = 130;
      ctx.fillText(event.title.substring(0, 35), width / 2, titleY);

      // Ticket type badge
      ctx.fillStyle = '#f05a28';
      ctx.font = '16px system-ui, sans-serif';
      ctx.fillText(event.ticketTypeName, width / 2, titleY + 30);

      // QR Code section with orange background
      const qrSize = 380;
      const qrX = (width - qrSize) / 2;
      const qrY = 180;
      
      // Orange border around QR
      ctx.fillStyle = '#f05a28';
      ctx.fillRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(qrX, qrY, qrSize, qrSize);
      
      // Draw QR code
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

      // Ticket code below QR
      ctx.fillStyle = '#666666';
      ctx.font = '14px monospace';
      ctx.fillText(ticket.qrCode, width / 2, qrY + qrSize + 30);

      // Separator line
      const sepY = qrY + qrSize + 50;
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(40, sepY);
      ctx.lineTo(width - 40, sepY);
      ctx.stroke();

      // Event details
      ctx.fillStyle = '#1a1a1a';
      ctx.font = '18px system-ui, sans-serif';
      ctx.textAlign = 'left';
      const detailsX = 50;
      let detailsY = sepY + 40;

      ctx.fillText(`📅 ${event.date}`, detailsX, detailsY);
      detailsY += 35;
      ctx.fillText(`📍 ${event.venue.substring(0, 40)}`, detailsX, detailsY);
      detailsY += 35;
      ctx.fillText(`🎫 Quantity: ${ticket.quantity}`, detailsX, detailsY);

      // Ticket holder section
      detailsY += 50;
      ctx.fillStyle = '#f5f5f5';
      ctx.fillRect(40, detailsY - 25, width - 80, 70);
      ctx.fillStyle = '#666666';
      ctx.font = '14px system-ui, sans-serif';
      ctx.fillText('TICKET HOLDER', detailsX, detailsY);
      ctx.fillStyle = '#1a1a1a';
      ctx.font = '16px system-ui, sans-serif';
      const holderName = ticket.guestName ? `${ticket.guestName} (${ticket.guestEmail})` : ticket.guestEmail;
      ctx.fillText(holderName.substring(0, 45), detailsX, detailsY + 25);

      // Footer
      ctx.fillStyle = '#999999';
      ctx.font = '12px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Present this ticket at the venue for entry', width / 2, height - 30);

      // Download the image
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `ticket-${ticket.qrCode}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();

      toast({ title: "Ticket saved!", description: "Your ticket has been downloaded" });
    };

    qrImg.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
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

          {/* Hidden high-res QR for download */}
          <div className="hidden" ref={hiddenQrRef}>
            <QRCodeSVG value={ticket.qrCode} size={380} level="H" />
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {/* Primary Actions */}
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={downloadFullTicket} className="gap-2">
                <Download className="h-4 w-4" />
                Save Ticket
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
