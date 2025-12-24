import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Maximize2, Download, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface TicketQRCodeProps {
  qrCode: string;
  ticketId: string;
  eventTitle: string;
  ticketType: string;
  quantity: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const TicketQRCode = ({ 
  qrCode, 
  ticketId,
  eventTitle, 
  ticketType, 
  quantity,
  size = 'md',
  className 
}: TicketQRCodeProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const sizeConfig = {
    sm: { qr: 80, container: 'h-20 w-20' },
    md: { qr: 120, container: 'h-32 w-32' },
    lg: { qr: 200, container: 'h-52 w-52' },
  };

  const handleDownload = () => {
    const svg = document.getElementById(`qr-${ticketId}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = 400;
      canvas.height = 500;
      
      if (ctx) {
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw QR code centered
        ctx.drawImage(img, 50, 50, 300, 300);
        
        // Add event title
        ctx.fillStyle = 'black';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(eventTitle.substring(0, 30), 200, 390);
        
        // Add ticket type
        ctx.font = '14px sans-serif';
        ctx.fillText(`${ticketType} × ${quantity}`, 200, 415);
        
        // Add QR code text
        ctx.font = '10px monospace';
        ctx.fillStyle = '#666';
        ctx.fillText(qrCode, 200, 450);
        
        // Download
        const link = document.createElement('a');
        link.download = `ticket-${qrCode}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    toast.success('Ticket downloaded!');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Ticket for ${eventTitle}`,
          text: `My ticket for ${eventTitle} - ${ticketType}`,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      await navigator.clipboard.writeText(qrCode);
      toast.success('QR code copied to clipboard!');
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <div 
            className={cn(
              'rounded-lg bg-white p-2 flex items-center justify-center cursor-pointer hover:shadow-lg transition-shadow relative group',
              sizeConfig[size].container,
              className
            )}
          >
            <QRCodeSVG 
              id={`qr-preview-${ticketId}`}
              value={qrCode} 
              size={sizeConfig[size].qr}
              level="M"
              includeMargin={false}
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
              <Maximize2 className="h-6 w-6 text-white" />
            </div>
          </div>
        </DialogTrigger>
        
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Your Ticket QR Code</DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col items-center gap-4 py-4">
            <Card className="p-6 bg-white">
              <CardContent className="p-0 flex flex-col items-center gap-4">
                <QRCodeSVG 
                  id={`qr-${ticketId}`}
                  value={qrCode} 
                  size={250}
                  level="H"
                  includeMargin
                />
                <div className="text-center">
                  <h3 className="font-semibold text-lg text-black">{eventTitle}</h3>
                  <p className="text-sm text-gray-600">{ticketType} × {quantity}</p>
                  <p className="text-xs font-mono text-gray-400 mt-2">{qrCode}</p>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex gap-2 w-full">
              <Button variant="outline" className="flex-1" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" className="flex-1" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground text-center">
              Present this QR code at the venue entrance for scanning
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TicketQRCode;
