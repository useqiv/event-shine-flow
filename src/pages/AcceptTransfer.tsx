import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { 
  Ticket, 
  Calendar, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  ArrowRight,
  Gift
} from 'lucide-react';

const AcceptTransfer = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [transfer, setTransfer] = useState<any>(null);
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const transferCode = searchParams.get('code');

  useEffect(() => {
    if (transferCode) {
      fetchTransfer();
    } else {
      setError('No transfer code provided');
      setLoading(false);
    }
  }, [transferCode]);

  const fetchTransfer = async () => {
    try {
      // Get transfer details
      const { data: transferData, error: transferError } = await supabase
        .from('ticket_transfers')
        .select('*')
        .eq('transfer_code', transferCode)
        .maybeSingle();

      if (transferError) throw transferError;

      if (!transferData) {
        setError('Transfer not found or has expired');
        setLoading(false);
        return;
      }

      if (transferData.status !== 'pending') {
        setError(transferData.status === 'completed' ? 'This transfer has already been accepted' : 'This transfer is no longer valid');
        setLoading(false);
        return;
      }

      if (new Date(transferData.expires_at) < new Date()) {
        setError('This transfer has expired');
        setLoading(false);
        return;
      }

      setTransfer(transferData);

      // Get ticket details with event info
      const { data: ticketData, error: ticketError } = await supabase
        .from('tickets')
        .select(`
          *,
          event:events(*),
          ticket_type:ticket_types(*)
        `)
        .eq('id', transferData.ticket_id)
        .single();

      if (ticketError) throw ticketError;
      setTicket(ticketData);
    } catch (err: any) {
      console.error('Error fetching transfer:', err);
      setError('Failed to load transfer details');
    } finally {
      setLoading(false);
    }
  };

  const acceptTransfer = async () => {
    if (!user) {
      toast({ 
        title: "Please sign in", 
        description: "You need to be logged in to accept this ticket transfer",
        variant: "destructive" 
      });
      navigate(`/auth?redirect=/accept-transfer?code=${transferCode}`);
      return;
    }

    if (!transfer || !ticket) return;

    setAccepting(true);
    try {
      // Update ticket ownership
      const { error: ticketError } = await supabase
        .from('tickets')
        .update({ user_id: user.id })
        .eq('id', ticket.id);

      if (ticketError) throw ticketError;

      // Mark transfer as completed
      const { error: transferError } = await supabase
        .from('ticket_transfers')
        .update({ 
          status: 'completed',
          to_user_id: user.id,
          completed_at: new Date().toISOString()
        })
        .eq('id', transfer.id);

      if (transferError) throw transferError;

      // Create notification for the new owner
      await supabase.from('notifications').insert({
        user_id: user.id,
        title: 'Ticket Received!',
        message: `You've received a ticket for ${ticket.event?.title}`,
        type: 'ticket',
        reference_id: ticket.id
      });

      // Create notification for the original owner
      await supabase.from('notifications').insert({
        user_id: transfer.from_user_id,
        title: 'Ticket Transfer Completed',
        message: `Your ticket for ${ticket.event?.title} has been successfully transferred`,
        type: 'ticket',
        reference_id: ticket.id
      });

      toast({ 
        title: "Ticket accepted!", 
        description: "The ticket has been added to your account" 
      });

      navigate('/my-tickets');
    } catch (err: any) {
      console.error('Error accepting transfer:', err);
      toast({ 
        title: "Failed to accept transfer", 
        description: err.message,
        variant: "destructive" 
      });
    } finally {
      setAccepting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Skeleton className="h-12 w-12 rounded-full mx-auto mb-4" />
            <Skeleton className="h-6 w-48 mx-auto mb-2" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle>Transfer Not Available</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} variant="outline" className="w-full">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Gift className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>You've Received a Ticket!</CardTitle>
          <CardDescription>
            Someone has transferred a ticket to you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Ticket Details */}
          <div className="bg-secondary/50 rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-bold text-lg">{ticket?.event?.title}</h3>
                <Badge variant="outline" className="mt-1">
                  {ticket?.ticket_type?.name} × {ticket?.quantity}
                </Badge>
              </div>
              <Ticket className="h-6 w-6 text-primary flex-shrink-0" />
            </div>

            <div className="grid gap-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{ticket?.event?.event_date && format(new Date(ticket.event.event_date), 'EEEE, MMMM d, yyyy')}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{ticket?.event?.event_date && format(new Date(ticket.event.event_date), 'h:mm a')}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{ticket?.event?.venue}</span>
              </div>
            </div>
          </div>

          {/* Accept Button */}
          {user ? (
            <Button 
              onClick={acceptTransfer} 
              disabled={accepting} 
              className="w-full" 
              size="lg"
            >
              {accepting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Accepting...</>
              ) : (
                <><CheckCircle2 className="h-4 w-4 mr-2" /> Accept Ticket</>
              )}
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-center text-muted-foreground">
                Sign in to accept this ticket
              </p>
              <Button 
                onClick={() => navigate(`/auth?redirect=/accept-transfer?code=${transferCode}`)}
                className="w-full" 
                size="lg"
              >
                Sign In <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}

          <p className="text-xs text-center text-muted-foreground">
            Transfer code: <span className="font-mono">{transferCode}</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AcceptTransfer;
