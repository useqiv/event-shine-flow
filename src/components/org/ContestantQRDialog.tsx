import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { getContestantUrlById } from '@/lib/urlHelpers';

interface ContestantQRDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contestantName: string;
  contestantId: string;
  contestId: string;
  contestTitle: string;
}

export const ContestantQRDialog: React.FC<ContestantQRDialogProps> = ({
  open,
  onOpenChange,
  contestantName,
  contestantId,
  contestId,
  contestTitle,
}) => {
  const qrRef = useRef<HTMLDivElement>(null);
  const votingUrl = getContestantUrlById(contestId, contestantId, null, false);

  const handleDownload = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    // Create a canvas to convert SVG to PNG
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = 400;
      canvas.height = 500;
      
      if (ctx) {
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw QR code centered
        ctx.drawImage(img, 50, 30, 300, 300);
        
        // Add text
        ctx.fillStyle = 'black';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Vote for ${contestantName}`, canvas.width / 2, 370);
        
        ctx.font = '14px sans-serif';
        ctx.fillStyle = '#666';
        ctx.fillText(contestTitle, canvas.width / 2, 395);
        
        ctx.font = '12px sans-serif';
        ctx.fillText('Scan to vote', canvas.width / 2, 420);
      }
      
      // Download
      const link = document.createElement('a');
      link.download = `qr-vote-${contestantName.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      URL.revokeObjectURL(url);
      toast.success('QR code downloaded!');
    };

    img.src = url;
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to print');
      return;
    }

    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Vote for ${contestantName}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              font-family: system-ui, sans-serif;
            }
            .container {
              text-align: center;
              padding: 40px;
              border: 2px dashed #ccc;
              border-radius: 16px;
            }
            h1 {
              margin: 20px 0 8px;
              font-size: 24px;
            }
            p {
              margin: 0;
              color: #666;
            }
            .qr {
              margin: 0 auto;
            }
            .url {
              font-size: 10px;
              margin-top: 16px;
              word-break: break-all;
              max-width: 300px;
            }
            @media print {
              .container {
                border: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="qr">${svgData}</div>
            <h1>Vote for ${contestantName}</h1>
            <p>${contestTitle}</p>
            <p class="url">${votingUrl}</p>
          </div>
          <script>
            window.onload = () => {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>QR Code for {contestantName}</DialogTitle>
          <DialogDescription>
            Scan this QR code to vote for {contestantName} in {contestTitle}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center gap-4 py-4">
          <div ref={qrRef} className="bg-white p-4 rounded-lg">
            <QRCodeSVG 
              value={votingUrl} 
              size={200}
              level="H"
              includeMargin={true}
            />
          </div>
          
          <p className="text-sm text-muted-foreground text-center break-all px-4">
            {votingUrl}
          </p>
          
          <div className="flex gap-2 w-full">
            <Button onClick={handleDownload} className="flex-1">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            <Button onClick={handlePrint} variant="outline" className="flex-1">
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
