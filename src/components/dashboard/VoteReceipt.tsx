import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Receipt, Download, Printer } from 'lucide-react';
import { format } from 'date-fns';

interface VoteReceiptProps {
  vote: any;
  children?: React.ReactNode;
}

export const VoteReceipt: React.FC<VoteReceiptProps> = ({ vote, children }) => {
  const printReceipt = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const voteDate = format(new Date(vote.created_at), 'MMMM d, yyyy');
    const voteTime = format(new Date(vote.created_at), 'h:mm a');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Vote Receipt - ${vote.contest?.title}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 40px;
            background: #fff;
          }
          .receipt {
            max-width: 400px;
            margin: 0 auto;
            border: 2px solid #7c3aed;
            border-radius: 12px;
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
            color: white;
            padding: 24px;
            text-align: center;
          }
          .header h1 { font-size: 20px; margin-bottom: 4px; }
          .header p { opacity: 0.9; font-size: 12px; }
          .content { padding: 24px; }
          .row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .row:last-child { border-bottom: none; }
          .label { color: #6b7280; font-size: 14px; }
          .value { font-weight: 600; color: #111827; font-size: 14px; }
          .total {
            background: #f3f4f6;
            padding: 16px;
            margin-top: 16px;
            border-radius: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .total-label { font-size: 16px; font-weight: 600; }
          .total-value { font-size: 20px; font-weight: 700; color: #7c3aed; }
          .footer {
            background: #f9fafb;
            padding: 16px 24px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
          }
          .transaction-id { font-family: monospace; font-size: 10px; }
          @media print {
            body { padding: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <h1>Vote Receipt</h1>
            <p>Thank you for voting!</p>
          </div>
          <div class="content">
            <div class="row">
              <span class="label">Contest</span>
              <span class="value">${vote.contest?.title || 'N/A'}</span>
            </div>
            <div class="row">
              <span class="label">Contestant</span>
              <span class="value">${vote.contestant?.name || 'N/A'}</span>
            </div>
            <div class="row">
              <span class="label">Vote Quantity</span>
              <span class="value">${vote.quantity}</span>
            </div>
            <div class="row">
              <span class="label">Price per Vote</span>
              <span class="value">₦${(Number(vote.amount_paid) / vote.quantity).toLocaleString()}</span>
            </div>
            <div class="row">
              <span class="label">Payment Method</span>
              <span class="value">${vote.payment_method || 'Wallet'}</span>
            </div>
            <div class="row">
              <span class="label">Date</span>
              <span class="value">${voteDate}</span>
            </div>
            <div class="row">
              <span class="label">Time</span>
              <span class="value">${voteTime}</span>
            </div>
            <div class="total">
              <span class="total-label">Total Amount</span>
              <span class="total-value">₦${Number(vote.amount_paid).toLocaleString()}</span>
            </div>
          </div>
          <div class="footer">
            <p class="transaction-id">Transaction ID: ${vote.id.slice(0, 16).toUpperCase()}</p>
            <p style="margin-top: 8px;">Useqiv - Powered by your votes</p>
          </div>
        </div>
        <script>
          setTimeout(function() { window.print(); window.close(); }, 500);
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const downloadReceipt = () => {
    const voteDate = format(new Date(vote.created_at), 'yyyy-MM-dd');
    const content = `
VOTE RECEIPT
============

Contest: ${vote.contest?.title || 'N/A'}
Contestant: ${vote.contestant?.name || 'N/A'}
Vote Quantity: ${vote.quantity}
Price per Vote: ₦${(Number(vote.amount_paid) / vote.quantity).toLocaleString()}
Total Amount: ₦${Number(vote.amount_paid).toLocaleString()}
Payment Method: ${vote.payment_method || 'Wallet'}
Date: ${format(new Date(vote.created_at), 'MMMM d, yyyy')}
Time: ${format(new Date(vote.created_at), 'h:mm a')}

Transaction ID: ${vote.id}

Thank you for voting!
Useqiv
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vote-receipt-${voteDate}-${vote.id.slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="sm">
            <Receipt className="h-4 w-4 mr-1" />
            Receipt
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Vote Receipt
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="bg-gradient-to-r from-primary to-accent p-4 rounded-lg text-primary-foreground text-center">
            <p className="text-sm opacity-80">Total Amount</p>
            <p className="text-2xl font-bold">₦{Number(vote.amount_paid).toLocaleString()}</p>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Contest</span>
              <span className="font-medium">{vote.contest?.title || 'N/A'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Contestant</span>
              <span className="font-medium">{vote.contestant?.name || 'N/A'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Votes</span>
              <span className="font-medium">{vote.quantity}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Date</span>
              <span className="font-medium">{format(new Date(vote.created_at), 'MMM d, yyyy')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Transaction ID</span>
              <span className="font-mono text-xs">{vote.id.slice(0, 12)}...</span>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" className="flex-1" onClick={downloadReceipt}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button variant="default" className="flex-1" onClick={printReceipt}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
