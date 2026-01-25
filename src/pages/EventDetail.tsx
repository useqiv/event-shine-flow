import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
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
  Plus,
  Share2,
  Users
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

  // Loading State - Mobile optimized skeleton
  if (eventLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1">
          {/* Hero Skeleton */}
          <Skeleton className="w-full h-48 sm:h-64 md:h-80" />
          <div className="container mx-auto px-4 py-6">
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="grid grid-cols-1 gap-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Not Found State
  if (!event) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center">
              <Calendar className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold">Event not found</h2>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              This event may have been removed or the link is incorrect.
            </p>
            <Link to="/events">
              <Button variant="default" className="mt-2">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Browse Events
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const eventUrl = event?.custom_slug 
    ? `${window.location.origin}/e/${event.custom_slug}` 
    : `${window.location.origin}/events/${id}`;
  const ogDescription = event?.description || `Join us at ${event?.title} on ${event ? format(new Date(event.event_date), 'MMMM d, yyyy') : ''} at ${event?.venue}`;
  const ogImage = event?.image_url || `${window.location.origin}/og-image.png`;

  // Get total tickets sold for social proof
  const totalTicketsSold = ticketTypes?.reduce((acc, t) => acc + (t.quantity_sold || 0), 0) || 0;

  return (
    <>
      <Helmet>
        <title>{event.title} | USEQIV Events</title>
        <meta name="description" content={ogDescription} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={eventUrl} />
        <meta property="og:title" content={event.title} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="USEQIV" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={eventUrl} />
        <meta name="twitter:title" content={event.title} />
        <meta name="twitter:description" content={ogDescription} />
        <meta name="twitter:image" content={ogImage} />
        
        {/* Canonical URL */}
        <link rel="canonical" href={eventUrl} />
      </Helmet>
      
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        
        <main className="flex-1">
          {/* Hero Image Section - Full width on mobile */}
          <div className="relative w-full">
            {/* Back Button - Floating on hero */}
            <div className="absolute top-20 left-4 z-10">
              <Link to="/events">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="shadow-lg backdrop-blur-sm bg-background/80 hover:bg-background"
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  <span className="hidden sm:inline">Back</span>
                </Button>
              </Link>
            </div>

            {/* Hero Image */}
            <div className="relative h-48 sm:h-64 md:h-80 lg:h-96 bg-muted">
              {event.image_url ? (
                <img 
                  src={event.image_url} 
                  alt={event.title} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                  <Calendar className="h-16 w-16 sm:h-20 sm:w-20 text-muted-foreground" />
                </div>
              )}
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
              
              {/* Badges */}
              <div className="absolute top-20 right-4 flex flex-col gap-2">
                <Badge className="shadow-md">{event.category}</Badge>
                {isPast && (
                  <Badge variant="secondary" className="shadow-md">Past Event</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="container mx-auto px-4 -mt-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Main Content - Left Column */}
              <div className="lg:col-span-2 space-y-4">
                {/* Event Title Card */}
                <Card className="shadow-lg border-0 bg-card">
                  <CardContent className="p-4 sm:p-6">
                    {/* Title */}
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight">
                      {event.title}
                    </h1>
                    
                    {/* Quick Info Pills - Horizontal scroll on mobile */}
                    <div className="flex gap-2 mt-4 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
                      <div className="flex items-center gap-1.5 bg-primary/10 text-primary rounded-full px-3 py-1.5 text-sm whitespace-nowrap flex-shrink-0">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{format(new Date(event.event_date), 'MMM d, yyyy')}</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-primary/10 text-primary rounded-full px-3 py-1.5 text-sm whitespace-nowrap flex-shrink-0">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{format(new Date(event.event_date), 'h:mm a')}</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-primary/10 text-primary rounded-full px-3 py-1.5 text-sm whitespace-nowrap flex-shrink-0">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{event.venue}</span>
                      </div>
                      {totalTicketsSold > 0 && (
                        <div className="flex items-center gap-1.5 bg-muted text-muted-foreground rounded-full px-3 py-1.5 text-sm whitespace-nowrap flex-shrink-0">
                          <Users className="h-3.5 w-3.5" />
                          <span>{totalTicketsSold}+ attending</span>
                        </div>
                      )}
                    </div>

                    {/* Detailed Info Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Date</p>
                          <p className="font-medium text-sm truncate">{format(new Date(event.event_date), 'EEEE, MMMM d')}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(event.event_date), 'yyyy')}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Clock className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Time</p>
                          <p className="font-medium text-sm">{format(new Date(event.event_date), 'h:mm a')}</p>
                          <p className="text-xs text-muted-foreground">Local time</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 sm:col-span-2 md:col-span-1">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Venue</p>
                          <p className="font-medium text-sm truncate">{event.venue}</p>
                          {event.address && (
                            <p className="text-xs text-muted-foreground truncate">{event.address}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    {event.description && (
                      <div className="mt-6 pt-6 border-t border-border">
                        <h3 className="font-semibold text-base mb-2">About this event</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
                          {event.description}
                        </p>
                      </div>
                    )}

                    {/* Share Section - Compact on mobile */}
                    <div className="mt-6 pt-6 border-t border-border">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <Share2 className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm">Share event</span>
                        </div>
                        <SocialShareButtons
                          url={eventUrl}
                          title={event.title}
                          description={`Join me at ${event.title} on ${format(new Date(event.event_date), 'MMMM d, yyyy')} at ${event.venue}`}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tickets Section - Right Column on desktop, full width on mobile */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg sm:text-xl font-bold">Select Tickets</h2>
                  {ticketTypes && ticketTypes.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {ticketTypes.length} option{ticketTypes.length !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
                
                {ticketsLoading ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <Skeleton key={i} className="h-28 w-full rounded-lg" />
                    ))}
                  </div>
                ) : ticketTypes && ticketTypes.length > 0 ? (
                  <div className="space-y-3">
                    {ticketTypes.map((ticketType) => {
                      const available = ticketType.quantity_available - ticketType.quantity_sold;
                      const isSoldOut = available <= 0;
                      const isFree = Number(ticketType.price) === 0;
                      const percentSold = Math.round((ticketType.quantity_sold / ticketType.quantity_available) * 100);

                      return (
                        <Card 
                          key={ticketType.id} 
                          className={`overflow-hidden transition-all duration-200 ${
                            isSoldOut 
                              ? 'opacity-60' 
                              : 'hover:shadow-md hover:border-primary/50 cursor-pointer'
                          }`}
                          onClick={() => !isSoldOut && !isPast && handleBuyClick(ticketType)}
                        >
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-semibold text-sm sm:text-base">{ticketType.name}</h3>
                                  {isFree && (
                                    <Badge variant="secondary" className="text-xs">Free</Badge>
                                  )}
                                </div>
                                {ticketType.description && (
                                  <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
                                    {ticketType.description}
                                  </p>
                                )}
                              </div>
                              <div className="text-right flex-shrink-0">
                                {isFree ? (
                                  <span className="text-lg font-bold text-primary">Free</span>
                                ) : (
                                  <CurrencyDisplay 
                                    amount={Number(ticketType.price)} 
                                    currency={ticketType.currency || 'NGN'} 
                                    size="md" 
                                    showBadge 
                                    showToggle 
                                  />
                                )}
                              </div>
                            </div>
                            
                            {/* Progress & CTA Row */}
                            <div className="mt-3 pt-3 border-t border-border">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  {isSoldOut ? (
                                    <span className="text-xs font-medium text-destructive">Sold Out</span>
                                  ) : (
                                    <div className="space-y-1">
                                      <div className="flex items-center justify-between text-xs">
                                        <span className="text-muted-foreground">{available} left</span>
                                        {percentSold > 50 && (
                                          <span className="text-primary font-medium">{percentSold}% sold</span>
                                        )}
                                      </div>
                                      {percentSold > 30 && (
                                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                          <div 
                                            className="h-full bg-primary rounded-full transition-all"
                                            style={{ width: `${percentSold}%` }}
                                          />
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <Button 
                                  size="sm" 
                                  variant={isSoldOut || isPast ? "secondary" : "default"}
                                  disabled={isPast || isSoldOut}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleBuyClick(ticketType);
                                  }}
                                  className="flex-shrink-0"
                                >
                                  {isSoldOut ? 'Sold Out' : isPast ? 'Ended' : isFree ? 'Get Ticket' : 'Buy Now'}
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center mb-3">
                        <Ticket className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground text-sm">No tickets available yet</p>
                      <p className="text-xs text-muted-foreground mt-1">Check back later for updates</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </main>

        <Footer />

        {/* Purchase Sheet - Mobile friendly bottom sheet */}
        <Sheet open={isPurchaseModalOpen} onOpenChange={setIsPurchaseModalOpen}>
          <SheetContent side="bottom" className="h-auto max-h-[90vh] overflow-y-auto rounded-t-2xl">
            <SheetHeader className="text-left pb-4">
              <SheetTitle className="text-lg">
                {isFreeTicket ? 'Get Free Ticket' : 'Purchase Ticket'}
              </SheetTitle>
              {selectedTicketType && (
                <p className="text-sm text-muted-foreground">{selectedTicketType.name}</p>
              )}
            </SheetHeader>
            
            {selectedTicketType && (
              <div className="space-y-5 pb-6">
                {/* Quantity Selector */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <span className="font-medium text-sm">Quantity</span>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="text-xl font-bold w-8 text-center">{quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => setQuantity(Math.min(availableTickets, quantity + 1))}
                      disabled={quantity >= availableTickets}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Total - only show for paid tickets */}
                {!isFreeTicket && (
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Amount</span>
                      <CurrencyDisplay 
                        amount={totalAmount} 
                        currency={selectedTicketType?.currency || 'NGN'} 
                        size="lg" 
                        showBadge 
                        showToggle 
                      />
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
                      <Label htmlFor="guest-email" className="text-sm">Email *</Label>
                      <Input
                        id="guest-email"
                        type="email"
                        placeholder="your@email.com"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        required
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="guest-name" className="text-sm">Name (optional)</Label>
                      <Input
                        id="guest-name"
                        type="text"
                        placeholder="Your name"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        className="h-11"
                      />
                    </div>
                  </div>
                )}

                {/* Wallet Balance - Only show for logged in users with paid tickets */}
                {user && !isFreeTicket && (() => {
                  const ticketCurrency = selectedTicketType?.currency || 'NGN';
                  const currencyBalance = currencyBalances?.find(b => b.currency === ticketCurrency)?.balance || 0;
                  return (
                    <div className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Wallet ({ticketCurrency})</span>
                      </div>
                      <span className="font-medium">{formatCurrency(currencyBalance, ticketCurrency)}</span>
                    </div>
                  );
                })()}

                {/* Actions */}
                <div className="space-y-3 pt-2">
                  {isFreeTicket ? (
                    <Button 
                      onClick={handleFreeTicket} 
                      disabled={purchaseTicket.isPending} 
                      className="w-full h-12 text-base"
                    >
                      {purchaseTicket.isPending ? 'Processing...' : 'Get Free Ticket'}
                    </Button>
                  ) : (
                    <>
                      {user && wallet && (() => {
                        const ticketCurrency = selectedTicketType?.currency || 'NGN';
                        const currencyBalance = currencyBalances?.find(b => b.currency === ticketCurrency)?.balance || 0;
                        const hasBalance = currencyBalance >= totalAmount;
                        
                        if (hasBalance) {
                          return (
                            <Button 
                              onClick={handleWalletPurchase} 
                              disabled={purchaseTicket.isPending} 
                              className="w-full h-12 text-base"
                            >
                              <Wallet className="mr-2 h-4 w-4" />
                              {purchaseTicket.isPending ? 'Processing...' : 'Pay with Wallet'}
                            </Button>
                          );
                        }
                        return null;
                      })()}
                      <Button 
                        variant={user && wallet && (() => {
                          const ticketCurrency = selectedTicketType?.currency || 'NGN';
                          const currencyBalance = currencyBalances?.find(b => b.currency === ticketCurrency)?.balance || 0;
                          return currencyBalance >= totalAmount;
                        })() ? 'outline' : 'default'} 
                        onClick={handleProceedToPayment}
                        className="w-full h-12 text-base"
                      >
                        Pay with Card/Bank/Crypto
                      </Button>
                    </>
                  )}
                  <Button 
                    variant="ghost" 
                    onClick={() => setIsPurchaseModalOpen(false)} 
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>

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
      </div>
    </>
  );
};

export default EventDetail;
