import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEvent, useTicketTypes, usePurchaseTicket } from '@/hooks/useEvents';
import { useWallet, useWalletCurrencyBalances } from '@/hooks/useWallet';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import SocialShareButtons from '@/components/SocialShareButtons';
import PaymentModal from '@/components/PaymentModal';
import GuestTicketSuccess from '@/components/GuestTicketSuccess';
import CurrencyDisplay from '@/components/ui/currency-display';
import { formatCurrency } from '@/components/ui/currency-selector';
import { 
  Calendar, 
  MapPin, 
  Clock,
  ArrowLeft, 
  Ticket,
  Wallet,
  Minus,
  Plus
} from 'lucide-react';
import { format } from 'date-fns';

const EventDetail = () => {
  const { id, slug } = useParams<{ id?: string; slug?: string }>();
  const idOrSlug = id || slug || '';
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: event, isLoading: eventLoading } = useEvent(idOrSlug);
  const { data: ticketTypes, isLoading: ticketsLoading } = useTicketTypes(event?.id || '');
  const { data: wallet } = useWallet();
  const { data: currencyBalances } = useWalletCurrencyBalances();
  const purchaseTicket = usePurchaseTicket();

  const [selectedTicketType, setSelectedTicketType] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [guestEmail, setGuestEmail] = useState('');
  const [guestName, setGuestName] = useState('');
  const [showGuestTicketSuccess, setShowGuestTicketSuccess] = useState(false);
  const [claimedTicketData, setClaimedTicketData] = useState<{
    qrCode: string;
    quantity: number;
    guestEmail: string;
    guestName?: string;
    eventTitle: string;
    eventDate: string;
    eventVenue: string;
    ticketTypeName: string;
  } | null>(null);

  const isPast = event && new Date(event.event_date) < new Date();
  const totalAmount = selectedTicketType ? quantity * Number(selectedTicketType.price) : 0;
  const isFreeTicket = selectedTicketType ? Number(selectedTicketType.price) === 0 : false;
  const isGuest = !user;

  const availableTickets = selectedTicketType 
    ? selectedTicketType.quantity_available - selectedTicketType.quantity_sold 
    : 0;

  const handleBuyClick = (ticketType: any) => {
    setSelectedTicketType(ticketType);
    setQuantity(1);
    setIsPurchaseModalOpen(true);
  };

  const handleWalletPurchase = async () => {
    if (!selectedTicketType || !event) return;

    try {
      await purchaseTicket.mutateAsync({
        eventId: event.id,
        ticketTypeId: selectedTicketType.id,
        quantity,
        amountPaid: totalAmount,
        paymentMethod: 'wallet',
      });

      toast({
        title: 'Purchase Successful!',
        description: `You have purchased ${quantity} ticket(s). Check your email for the QR code.`,
      });

      setIsPurchaseModalOpen(false);
      setQuantity(1);
    } catch (error: any) {
      toast({
        title: 'Purchase Failed',
        description: error.message || 'An error occurred while purchasing.',
        variant: 'destructive',
      });
    }
  };

  const handleFreeTicket = async () => {
    if (!selectedTicketType || !event) return;

    // For guests, validate email
    if (isGuest && !guestEmail) {
      toast({
        title: 'Email Required',
        description: 'Please enter your email to receive the ticket.',
        variant: 'destructive',
      });
      return;
    }

    // Basic email validation for guests
    if (isGuest && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const ticketResult = await purchaseTicket.mutateAsync({
        eventId: event.id,
        ticketTypeId: selectedTicketType.id,
        quantity,
        amountPaid: 0,
        paymentMethod: 'wallet',
        guestEmail: isGuest ? guestEmail : undefined,
        guestName: isGuest ? guestName : undefined,
        eventDetails: {
          eventTitle: event.title,
          eventDate: format(new Date(event.event_date), 'EEEE, MMMM d, yyyy h:mm a'),
          eventVenue: event.venue,
          ticketTypeName: selectedTicketType.name,
          currency: selectedTicketType.currency || 'NGN'
        }
      });

      setIsPurchaseModalOpen(false);

      // For guests, show the ticket success dialog with QR code
      if (isGuest) {
        setClaimedTicketData({
          qrCode: ticketResult.qr_code,
          quantity,
          guestEmail,
          guestName: guestName || undefined,
          eventTitle: event.title,
          eventDate: format(new Date(event.event_date), 'EEEE, MMMM d, yyyy h:mm a'),
          eventVenue: event.venue,
          ticketTypeName: selectedTicketType.name
        });
        setShowGuestTicketSuccess(true);
      } else {
        toast({
          title: 'Ticket Claimed!',
          description: `You have successfully claimed ${quantity} free ticket(s). Check your email for the QR code.`,
        });
      }

      setQuantity(1);
      setGuestEmail('');
      setGuestName('');
    } catch (error: any) {
      toast({
        title: 'Failed to Claim Ticket',
        description: error.message || 'An error occurred.',
        variant: 'destructive',
      });
    }
  };

  const handleProceedToPayment = () => {
    setIsPurchaseModalOpen(false);
    setIsPaymentModalOpen(true);
  };

  if (eventLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="space-y-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-16 text-center">
          <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold">Event not found</h2>
          <Link to="/events">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Events
            </Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 pt-24 pb-8">
        <div className="space-y-6">
          {/* Back Button */}
          <Link to="/events">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Events
            </Button>
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Event Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="overflow-hidden">
              <div className="relative h-64 md:h-96 bg-secondary">
                {event.image_url ? (
                  <img 
                    src={event.image_url} 
                    alt={event.title} 
                    className="h-full w-full object-cover" 
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <Calendar className="h-24 w-24 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute top-4 left-4">
                  <Badge>{event.category}</Badge>
                </div>
                {isPast && (
                  <div className="absolute top-4 right-4">
                    <Badge variant="secondary">Past Event</Badge>
                  </div>
                )}
              </div>
              <CardContent className="p-6">
                <h1 className="text-2xl md:text-3xl font-bold">{event.title}</h1>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Date</p>
                      <p className="font-medium">{format(new Date(event.event_date), 'EEEE, MMMM d, yyyy')}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Time</p>
                      <p className="font-medium">{format(new Date(event.event_date), 'h:mm a')}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Venue</p>
                      <p className="font-medium">{event.venue}</p>
                      {event.address && <p className="text-sm text-muted-foreground">{event.address}</p>}
                    </div>
                  </div>
                </div>

                {event.description && (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-2">About this event</h3>
                    <p className="text-muted-foreground">{event.description}</p>
                  </div>
                )}

                {/* Social Share */}
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-semibold mb-3">Share this event</h3>
                  <SocialShareButtons
                    url={`${window.location.origin}/events/${id}`}
                    title={event.title}
                    description={`Join me at ${event.title} on ${format(new Date(event.event_date), 'MMMM d, yyyy')} at ${event.venue}`}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ticket Types */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Tickets</h2>
            {ticketsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : ticketTypes && ticketTypes.length > 0 ? (
              <div className="space-y-3">
                {ticketTypes.map((ticketType) => {
                  const available = ticketType.quantity_available - ticketType.quantity_sold;
                  const isSoldOut = available <= 0;

                  return (
                    <Card key={ticketType.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{ticketType.name}</h3>
                            {ticketType.description && (
                              <p className="text-sm text-muted-foreground mt-1">{ticketType.description}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">
                              {Number(ticketType.price) === 0 ? (
                                <Badge variant="secondary" className="text-sm">Free</Badge>
                              ) : (
                                <CurrencyDisplay amount={Number(ticketType.price)} currency={ticketType.currency || 'NGN'} size="md" showBadge showToggle />
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex justify-between items-center mt-4">
                          <span className="text-sm text-muted-foreground">
                            {isSoldOut ? 'Sold Out' : `${available} available`}
                          </span>
                          <Button 
                            size="sm" 
                            onClick={() => handleBuyClick(ticketType)}
                            disabled={isPast || isSoldOut}
                          >
                            {isSoldOut ? 'Sold Out' : isPast ? 'Event Passed' : Number(ticketType.price) === 0 ? 'Get Free Ticket' : 'Buy'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="p-6 text-center">
                <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No tickets available</p>
              </Card>
            )}
          </div>
          </div>
        </div>

        {/* Purchase Selection Dialog */}
        {isPurchaseModalOpen && selectedTicketType && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>{isFreeTicket ? 'Get Free Ticket' : 'Purchase'} {selectedTicketType.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Quantity */}
                <div>
                  <p className="text-sm font-medium mb-2">Quantity</p>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="text-xl font-bold w-8 text-center">{quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(Math.min(availableTickets, quantity + 1))}
                      disabled={quantity >= availableTickets}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Total - only show for paid tickets */}
                {!isFreeTicket && (
                  <div className="p-4 rounded-lg bg-secondary">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Amount</span>
                      <div className="text-right">
                        <span className="text-xl font-bold">
                          <CurrencyDisplay amount={totalAmount} currency={selectedTicketType?.currency || 'NGN'} size="lg" showBadge showToggle />
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Free ticket notice */}
                {isFreeTicket && (
                  <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                    <div className="flex items-center gap-2 text-success">
                      <Ticket className="h-5 w-5" />
                      <span className="font-medium">This is a free ticket!</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Claim your ticket and receive a QR code via email.
                    </p>
                  </div>
                )}

                {/* Guest email/name fields for free tickets */}
                {isFreeTicket && isGuest && (
                  <div className="space-y-4 p-4 rounded-lg border bg-muted/50">
                    <p className="text-sm font-medium">Enter your details to receive the ticket:</p>
                    <div className="space-y-2">
                      <Label htmlFor="guest-email">Email *</Label>
                      <Input
                        id="guest-email"
                        type="email"
                        placeholder="your@email.com"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="guest-name">Name (optional)</Label>
                      <Input
                        id="guest-name"
                        type="text"
                        placeholder="Your name"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Wallet Balance - Only show for logged in users with paid tickets */}
                {user && !isFreeTicket && (() => {
                  const ticketCurrency = selectedTicketType?.currency || 'NGN';
                  const currencyBalance = currencyBalances?.find(b => b.currency === ticketCurrency)?.balance || 0;
                  return (
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4" />
                        <span className="text-sm">Wallet Balance ({ticketCurrency})</span>
                      </div>
                      <span className="font-medium">{formatCurrency(currencyBalance, ticketCurrency)}</span>
                    </div>
                  );
                })()}

                {/* Actions */}
                <div className="space-y-3">
                  {isFreeTicket ? (
                    /* Free ticket - just show Get Ticket and Cancel buttons */
                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => setIsPurchaseModalOpen(false)} className="flex-1">
                        Cancel
                      </Button>
                      <Button onClick={handleFreeTicket} disabled={purchaseTicket.isPending} className="flex-1">
                        {purchaseTicket.isPending ? 'Processing...' : 'Get Free Ticket'}
                      </Button>
                    </div>
                  ) : (
                    /* Paid ticket - show wallet and other payment options */
                    <>
                      <div className="flex gap-3">
                        <Button variant="outline" onClick={() => setIsPurchaseModalOpen(false)} className="flex-1">
                          Cancel
                        </Button>
                        {user && wallet && (() => {
                          const ticketCurrency = selectedTicketType?.currency || 'NGN';
                          const currencyBalance = currencyBalances?.find(b => b.currency === ticketCurrency)?.balance || 0;
                          return currencyBalance >= totalAmount;
                        })() && (
                          <Button onClick={handleWalletPurchase} disabled={purchaseTicket.isPending} className="flex-1">
                            {purchaseTicket.isPending ? 'Processing...' : 'Pay with Wallet'}
                          </Button>
                        )}
                      </div>
                      <Button 
                        variant={user && wallet && (() => {
                          const ticketCurrency = selectedTicketType?.currency || 'NGN';
                          const currencyBalance = currencyBalances?.find(b => b.currency === ticketCurrency)?.balance || 0;
                          return currencyBalance >= totalAmount;
                        })() ? 'outline' : 'default'} 
                        onClick={handleProceedToPayment}
                        className="w-full"
                      >
                        Pay with Card/Bank/Crypto
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Payment Modal for external payments */}
        {selectedTicketType && event && (
          <PaymentModal
            open={isPaymentModalOpen}
            onOpenChange={setIsPaymentModalOpen}
            type="ticket"
            amount={totalAmount}
            currency={selectedTicketType.currency || 'NGN'}
            itemDetails={{
              event_id: event.id,
              ticket_type_id: selectedTicketType.id,
              ticket_quantity: quantity,
              name: selectedTicketType.name,
            }}
          />
        )}

        {/* Guest Ticket Success Dialog */}
        {claimedTicketData && (
          <GuestTicketSuccess
            open={showGuestTicketSuccess}
            onOpenChange={setShowGuestTicketSuccess}
            ticket={{
              qrCode: claimedTicketData.qrCode,
              quantity: claimedTicketData.quantity,
              guestEmail: claimedTicketData.guestEmail,
              guestName: claimedTicketData.guestName
            }}
            event={{
              title: claimedTicketData.eventTitle,
              date: claimedTicketData.eventDate,
              venue: claimedTicketData.eventVenue,
              ticketTypeName: claimedTicketData.ticketTypeName
            }}
          />
        )}
      </main>
      <Footer />
    </div>
  );
};

export default EventDetail;
