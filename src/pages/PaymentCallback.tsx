import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, Home, TicketIcon, Vote, Mail, Download } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';

interface TicketData {
  id: string;
  qr_code: string;
  guest_name: string;
  guest_email: string;
  quantity: number;
  event: { title: string; venue: string; event_date: string } | null;
  ticket_type: { name: string } | null;
}

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'cancelled'>('loading');
  const [ticketData, setTicketData] = useState<TicketData | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const paymentStatus = searchParams.get('payment_status') || searchParams.get('status');
  const txRef = searchParams.get('tx_ref');

  const isVote = txRef?.startsWith('vote_');
  const isTicket = txRef?.startsWith('ticket_');
  const isGuest = !user;

  useEffect(() => {
    // Determine status from URL params
    if (paymentStatus === 'successful' || paymentStatus === 'success') {
      setStatus('success');
      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      // Fetch ticket data for all users
      if (isTicket && txRef) {
        fetchTicketByTxRef(txRef);
      }
    } else if (paymentStatus === 'cancelled') {
      setStatus('cancelled');
    } else if (paymentStatus === 'failed') {
      setStatus('failed');
    } else {
      // Default to loading briefly, then check
      const timer = setTimeout(() => {
        if (!paymentStatus) {
          setStatus('failed');
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [paymentStatus, isTicket, txRef]);

  const fetchTicketByTxRef = async (transactionRef: string) => {
    try {
      // First, find the wallet transaction by reference_id (which stores the tx_ref)
      const { data: walletTx, error: walletError } = await supabase
        .from('wallet_transactions')
        .select('id')
        .eq('reference_id', transactionRef)
        .maybeSingle();

      if (walletError) {
        console.error('Error finding wallet transaction:', walletError);
      }

      let ticketQuery = supabase
        .from('tickets')
        .select(`
          id,
          qr_code,
          guest_name,
          guest_email,
          quantity,
          event:events(title, venue, event_date),
          ticket_type:ticket_types(name)
        `);

      // If we found a wallet transaction, use its id; otherwise try the ref directly
      if (walletTx?.id) {
        ticketQuery = ticketQuery.eq('transaction_id', walletTx.id);
      } else {
        // Fallback: maybe it's stored directly (older records)
        ticketQuery = ticketQuery.eq('transaction_id', transactionRef);
      }

      const { data, error } = await ticketQuery.maybeSingle();

      if (!error && data) {
        setTicketData(data as unknown as TicketData);
      } else {
        console.log('No ticket found for tx_ref:', transactionRef, 'wallet tx:', walletTx?.id);
      }
    } catch (error) {
      console.error('Error fetching ticket:', error);
    }
  };

  const downloadTicket = () => {
    if (!ticketData) return;
    
    setIsDownloading(true);
    
    const eventDate = ticketData.event?.event_date 
      ? new Date(ticketData.event.event_date).toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      : 'TBA';
    
    const eventTime = ticketData.event?.event_date 
      ? new Date(ticketData.event.event_date).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      : 'TBA';

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      setIsDownloading(false);
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ticket - ${ticketData.event?.title}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              padding: 20px;
              background: #f5f5f5;
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
            .detail-item { }
            .detail-label {
              font-size: 10px;
              color: #9ca3af;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .detail-value {
              font-size: 13px;
              color: #1f1f1f;
              font-weight: 500;
            }
            .full-width { grid-column: 1 / -1; }
            .footer-row {
              display: flex;
              justify-content: space-between;
              margin-top: 16px;
              padding-top: 12px;
              border-top: 1px solid #eee;
              font-size: 11px;
              color: #666;
            }
            @media print {
              body { padding: 0; background: white; }
              .ticket { box-shadow: none; border: 2px solid #7c3aed; }
            }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="qr-section">
              <div class="qr-code">
                <svg viewBox="0 0 256 256">
                  ${document.getElementById('guest-ticket-qr')?.innerHTML || ''}
                </svg>
              </div>
              <p class="qr-label">Scan for entry</p>
            </div>
            <div class="info-section">
              <div class="event-title">${ticketData.event?.title}</div>
              <div class="ticket-type">${ticketData.ticket_type?.name} × ${ticketData.quantity}</div>
              <div class="details-grid">
                <div class="detail-item full-width">
                  <div class="detail-label">Ticket Holder</div>
                  <div class="detail-value">${ticketData.guest_name || 'Guest'}</div>
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
                  <div class="detail-value">${ticketData.event?.venue}</div>
                </div>
              </div>
              <div class="footer-row">
                <span>Ref: ${txRef}</span>
                <span>VotePass</span>
              </div>
            </div>
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
    setIsDownloading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {status === 'loading' && (
            <>
              <div className="mx-auto mb-4">
                <Loader2 className="h-16 w-16 text-primary animate-spin" />
              </div>
              <CardTitle>Processing Payment...</CardTitle>
              <CardDescription>Please wait while we confirm your payment</CardDescription>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mx-auto mb-4">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <CardTitle className="text-green-600">Payment Successful!</CardTitle>
              <CardDescription>
                {isVote 
                  ? 'Your votes have been recorded successfully'
                  : isTicket 
                  ? 'Your tickets have been purchased successfully'
                  : 'Your payment has been processed successfully'
                }
              </CardDescription>
            </>
          )}

          {status === 'failed' && (
            <>
              <div className="mx-auto mb-4">
                <XCircle className="h-16 w-16 text-destructive" />
              </div>
              <CardTitle className="text-destructive">Payment Failed</CardTitle>
              <CardDescription>
                We couldn't process your payment. Please try again or contact support.
              </CardDescription>
            </>
          )}

          {status === 'cancelled' && (
            <>
              <div className="mx-auto mb-4">
                <XCircle className="h-16 w-16 text-muted-foreground" />
              </div>
              <CardTitle>Payment Cancelled</CardTitle>
              <CardDescription>
                You cancelled the payment. No charges were made.
              </CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {txRef && (
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-xs text-muted-foreground">Transaction Reference</p>
              <p className="font-mono text-sm">{txRef}</p>
            </div>
          )}

          {/* Ticket success with QR code and download option */}
          {status === 'success' && isTicket && ticketData && (
            <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg">
              {isGuest && (
                <div className="text-center mb-4">
                  <Mail className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-sm font-medium">Check your email!</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your ticket details and QR code have been sent to your email address.
                  </p>
                </div>
              )}
              
              <div className={isGuest ? "border-t border-primary/20 pt-4 mt-4" : ""}>
                <div className="flex justify-center mb-3">
                  <div id="guest-ticket-qr" className="bg-background p-3 rounded-lg">
                    <QRCodeSVG value={ticketData.qr_code} size={120} />
                  </div>
                </div>
                <p className="text-xs text-center text-muted-foreground mb-1">
                  {ticketData.event?.title}
                </p>
                <p className="text-sm text-center font-medium mb-3">
                  {ticketData.ticket_type?.name} × {ticketData.quantity}
                </p>
                <Button 
                  onClick={downloadTicket} 
                  variant="outline" 
                  className="w-full"
                  disabled={isDownloading}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {isDownloading ? 'Preparing...' : 'Download Ticket'}
                </Button>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {/* Authenticated user - show View My Votes */}
            {status === 'success' && isVote && !isGuest && (
              <Button onClick={() => navigate('/my-votes')} className="w-full">
                <Vote className="mr-2 h-4 w-4" />
                View My Votes
              </Button>
            )}

            {/* Authenticated user - show View My Tickets */}
            {status === 'success' && isTicket && !isGuest && (
              <Button onClick={() => navigate('/my-tickets')} className="w-full">
                <TicketIcon className="mr-2 h-4 w-4" />
                View My Tickets
              </Button>
            )}

            {/* Guest user - prompt to sign up to manage tickets */}
            {status === 'success' && isTicket && isGuest && (
              <Button onClick={() => navigate('/auth')} variant="outline" className="w-full">
                Sign Up to Manage Tickets
              </Button>
            )}

            {(status === 'failed' || status === 'cancelled') && (
              <Button onClick={() => navigate(-1)} className="w-full">
                Try Again
              </Button>
            )}

            <Button variant="outline" onClick={() => navigate('/')} className="w-full">
              <Home className="mr-2 h-4 w-4" />
              Go to Homepage
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentCallback;
