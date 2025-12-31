import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, Home, TicketIcon, Vote, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import confetti from 'canvas-confetti';

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'cancelled'>('loading');
  
  const paymentStatus = searchParams.get('payment_status') || searchParams.get('status');
  const txRef = searchParams.get('tx_ref');

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
  }, [paymentStatus]);

  const isVote = txRef?.startsWith('vote_');
  const isTicket = txRef?.startsWith('ticket_');
  const isGuest = !user;

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

          {/* Guest user ticket success message */}
          {status === 'success' && isTicket && isGuest && (
            <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg text-center">
              <Mail className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-sm font-medium">Check your email!</p>
              <p className="text-xs text-muted-foreground mt-1">
                Your ticket details and QR code have been sent to your email address.
              </p>
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
