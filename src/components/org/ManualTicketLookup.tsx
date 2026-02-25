import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Search, User, Ticket, CheckCircle, XCircle, AlertCircle, Loader2, QrCode } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ManualTicketLookupProps {
  eventId: string;
  onCheckIn?: () => void;
}

interface TicketResult {
  id: string;
  qr_code: string;
  status: string;
  quantity: number;
  amount_paid: number;
  created_at: string;
  user: {
    full_name: string | null;
    email: string | null;
  } | null;
  ticket_type: {
    name: string;
    price: number;
  } | null;
}

const ManualTicketLookup: React.FC<ManualTicketLookupProps> = ({ eventId, onCheckIn }) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<TicketResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketResult | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search term');
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      // Search by ticket ID, QR code, or attendee name/email
      const { data: tickets, error } = await supabase
        .from('tickets')
        .select(`
          id,
          qr_code,
          status,
          quantity,
          amount_paid,
          created_at,
          user_id,
          ticket_type_id
        `)
        .eq('event_id', eventId);

      if (error) throw error;

      // Get user profiles and ticket types for the results
      const ticketResults: TicketResult[] = [];

      for (const ticket of tickets || []) {
        // Fetch user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', ticket.user_id)
          .maybeSingle();

        // Fetch ticket type
        const { data: ticketType } = await supabase
          .from('ticket_types')
          .select('name, price')
          .eq('id', ticket.ticket_type_id)
          .maybeSingle();

        const query = searchQuery.toLowerCase();
        const matchesId = ticket.id.toLowerCase().includes(query);
        const matchesQR = ticket.qr_code.toLowerCase().includes(query);
        const matchesName = profile?.full_name?.toLowerCase().includes(query);
        const matchesEmail = profile?.email?.toLowerCase().includes(query);

        if (matchesId || matchesQR || matchesName || matchesEmail) {
          ticketResults.push({
            id: ticket.id,
            qr_code: ticket.qr_code,
            status: ticket.status,
            quantity: ticket.quantity,
            amount_paid: ticket.amount_paid,
            created_at: ticket.created_at,
            user: profile,
            ticket_type: ticketType,
          });
        }
      }

      setResults(ticketResults);
    } catch (error: any) {
      toast.error('Search failed: ' + error.message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCheckIn = async () => {
    if (!selectedTicket) return;

    setIsCheckingIn(true);

    try {
      // Use atomic check-in to prevent double-scanning
      const { data: checkinResult, error: checkinError } = await supabase
        .rpc('atomic_ticket_checkin', {
          p_ticket_id: selectedTicket.id,
          p_event_id: eventId,
          p_scanned_by: user?.id,
        });

      if (checkinError) throw checkinError;

      const result = checkinResult as { success: boolean; reason: string; message: string };

      if (!result.success) {
        toast.error(result.message);
        // Update local state to reflect current status
        if (result.reason === 'already_used') {
          setResults(prev => prev.map(t => 
            t.id === selectedTicket.id ? { ...t, status: 'used' } : t
          ));
        }
        setSelectedTicket(null);
        setIsCheckingIn(false);
        return;
      }

      toast.success('Check-in successful!');
      
      // Update local state
      setResults(prev => prev.map(t => 
        t.id === selectedTicket.id ? { ...t, status: 'used' } : t
      ));
      setSelectedTicket(null);
      onCheckIn?.();
    } catch (error: any) {
      toast.error('Check-in failed: ' + error.message);
    } finally {
      setIsCheckingIn(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Active</Badge>;
      case 'used':
        return <Badge variant="secondary">Used</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Manual Ticket Lookup
          </CardTitle>
          <CardDescription>
            Search by ticket ID, QR code, or attendee name/email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter ticket ID, name, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {hasSearched && (
            <div className="space-y-2">
              {results.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <XCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No tickets found matching "{searchQuery}"</p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Found {results.length} ticket(s)
                  </p>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {results.map((ticket) => (
                      <div
                        key={ticket.id}
                        className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium truncate">
                                {ticket.user?.full_name || 'Unknown'}
                              </span>
                              {getStatusBadge(ticket.status)}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {ticket.user?.email || 'No email'}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Ticket className="h-3 w-3" />
                                {ticket.ticket_type?.name || 'Standard'}
                              </span>
                              <span className="flex items-center gap-1">
                                <QrCode className="h-3 w-3" />
                                {ticket.qr_code.substring(0, 12)}...
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Purchased: {format(new Date(ticket.created_at), 'MMM d, yyyy h:mm a')}
                            </p>
                          </div>
                          <div className="flex-shrink-0">
                            {ticket.status === 'active' ? (
                              <Button 
                                size="sm" 
                                onClick={() => setSelectedTicket(ticket)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Check In
                              </Button>
                            ) : ticket.status === 'used' ? (
                              <Button size="sm" variant="outline" disabled>
                                <AlertCircle className="h-4 w-4 mr-1" />
                                Already Used
                              </Button>
                            ) : (
                              <Button size="sm" variant="outline" disabled>
                                Unavailable
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Check-in Confirmation Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Check-in</DialogTitle>
            <DialogDescription>
              Are you sure you want to check in this attendee?
            </DialogDescription>
          </DialogHeader>
          
          {selectedTicket && (
            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{selectedTicket.user?.full_name || 'Unknown'}</span>
              </div>
              <p className="text-sm text-muted-foreground">{selectedTicket.user?.email || 'No email'}</p>
              <div className="flex items-center gap-2 text-sm">
                <Ticket className="h-4 w-4 text-muted-foreground" />
                <span>{selectedTicket.ticket_type?.name || 'Standard Ticket'}</span>
                <span className="text-muted-foreground">× {selectedTicket.quantity}</span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedTicket(null)}>
              Cancel
            </Button>
            <Button onClick={handleCheckIn} disabled={isCheckingIn}>
              {isCheckingIn ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Checking in...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm Check-in
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ManualTicketLookup;
