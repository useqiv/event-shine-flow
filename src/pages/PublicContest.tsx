import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CountdownTimer } from '@/components/ui/countdown-timer';
import { ShareButtons } from '@/components/ui/share-buttons';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { LiveContestView } from '@/components/live/LiveContestView';
import PaymentModal from '@/components/PaymentModal';
import CurrencyDisplay from '@/components/ui/currency-display';
import CurrencySelector, { currencies, useConversionDisplay, formatCurrency, getCurrencySymbol } from '@/components/ui/currency-selector';
import LiveRatesIndicator from '@/components/ui/live-rates-indicator';
import { useAuth } from '@/contexts/AuthContext';
import { Trophy, User, Vote, ExternalLink, Radio, LayoutGrid, ArrowRightLeft } from 'lucide-react';
import ContestantFilter, { filterContestants } from '@/components/ContestantFilter';

const voteOptions = [1, 5, 10, 25, 50, 100];

const PublicContest = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { convert, isLive, rates, lastUpdated } = useConversionDisplay();
  
  // Voting state
  const [selectedContestant, setSelectedContestant] = useState<any>(null);
  const [voteQuantity, setVoteQuantity] = useState(1);
  const [isVoteSelectionOpen, setIsVoteSelectionOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'live' | 'standard'>('live');
  const [paymentCurrency, setPaymentCurrency] = useState<string>('');

  // Fetch contest by slug
  const { data: contest, isLoading: contestLoading } = useQuery({
    queryKey: ['public-contest', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contests')
        .select('*')
        .eq('custom_slug', slug)
        .eq('is_active', true)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  // Fetch contestants
  const { data: contestants, isLoading: contestantsLoading } = useQuery({
    queryKey: ['public-contestants', contest?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contestants')
        .select('*')
        .eq('contest_id', contest!.id)
        .order('vote_count', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!contest?.id,
  });

  // Brand colors with fallbacks
  const primaryColor = contest?.brand_primary_color || '#7c3aed';
  const secondaryColor = contest?.brand_secondary_color || '#f97316';

  // Generate CSS variables for branding
  const brandStyles = useMemo(() => ({
    '--brand-primary': primaryColor,
    '--brand-secondary': secondaryColor,
  } as React.CSSProperties), [primaryColor, secondaryColor]);

  const isEnded = contest && new Date(contest.end_date) < new Date();
  const contestUrl = `${window.location.origin}/c/${slug}`;
  const contestCurrency = contest?.vote_currency || 'NGN';
  const totalAmount = contest ? voteQuantity * Number(contest.vote_price) : 0;
  
  // Calculate converted amount for payment
  const effectivePaymentCurrency = paymentCurrency || contestCurrency;
  const convertedAmount = useMemo(() => {
    if (effectivePaymentCurrency === contestCurrency) return totalAmount;
    return convert(totalAmount, contestCurrency, effectivePaymentCurrency);
  }, [totalAmount, contestCurrency, effectivePaymentCurrency, rates]);

  // Filter contestants based on search term
  const filteredContestants = useMemo(() => {
    return filterContestants(contestants || [], searchTerm);
  }, [contestants, searchTerm]);

  const handleVoteClick = (contestant: any) => {
    setSelectedContestant(contestant);
    setVoteQuantity(1);
    setPaymentCurrency(''); // Reset to contest currency
    setIsVoteSelectionOpen(true);
  };

  const handleProceedToPayment = () => {
    setIsVoteSelectionOpen(false);
    setIsPaymentModalOpen(true);
  };

  if (contestLoading) {
    return (
      <div className="min-h-screen bg-background" style={brandStyles}>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-64 w-full mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center py-12">
          <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Contest not found</h2>
          <p className="text-muted-foreground mb-4">This contest may not exist or is no longer active.</p>
          <Link to="/">
            <Button variant="outline">Go to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{contest.title} | Useqiv</title>
        <meta name="description" content={contest.description || `Vote now in ${contest.title}`} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={contestUrl} />
        <meta property="og:title" content={contest.title} />
        <meta property="og:description" content={contest.description || `Vote now in ${contest.title}`} />
        {contest.image_url && <meta property="og:image" content={contest.image_url} />}
        {contest.image_url && <meta property="og:image:width" content="1200" />}
        {contest.image_url && <meta property="og:image:height" content="630" />}
        <meta property="og:site_name" content="USEQIV" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={contestUrl} />
        <meta name="twitter:title" content={contest.title} />
        <meta name="twitter:description" content={contest.description || `Vote now in ${contest.title}`} />
        {contest.image_url && <meta name="twitter:image" content={contest.image_url} />}
        
        {/* Canonical URL */}
        <link rel="canonical" href={contestUrl} />
      </Helmet>

      <div className="min-h-screen bg-background" style={brandStyles}>
        {/* Header with branding */}
        <header 
          className="py-4 px-6"
          style={{ backgroundColor: primaryColor }}
        >
          <div className="container mx-auto flex items-center justify-between">
            {contest.brand_logo_url ? (
              <img 
                src={contest.brand_logo_url} 
                alt="Contest Logo" 
                className="h-10 object-contain"
              />
            ) : (
              <div className="flex items-center gap-2 text-white">
                <Trophy className="h-6 w-6" />
                <span className="font-bold text-lg">Useqiv</span>
              </div>
            )}
            {user ? (
              <Link to="/dashboard">
                <Button 
                  variant="secondary" 
                  size="sm"
                  className="text-foreground"
                >
                  Dashboard
                </Button>
              </Link>
            ) : (
              <Link to="/auth">
                <Button 
                  variant="secondary" 
                  size="sm"
                  className="text-foreground"
                >
                  Login / Sign Up
                </Button>
              </Link>
            )}
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {/* Contest Header */}
          <Card className="mb-8 overflow-hidden">
            <div className="relative h-64 md:h-80 bg-secondary overflow-hidden">
              {contest.image_url ? (
                <img 
                  src={contest.image_url} 
                  alt={contest.title} 
                  className="h-full w-full object-cover" 
                />
              ) : (
                <div 
                  className="h-full w-full flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                >
                  <Trophy className="h-24 w-24 text-white/50" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <Badge 
                  className="mb-2"
                  style={{ backgroundColor: secondaryColor }}
                >
                  {contest.category}
                </Badge>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">{contest.title}</h1>
              </div>
              {isEnded && (
                <div className="absolute top-4 right-4">
                  <Badge variant="destructive" className="text-lg px-4 py-2">Ended</Badge>
                </div>
              )}
            </div>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                <div className="grid grid-cols-2 gap-4 flex-1">
                  <div>
                    <p className="text-sm text-muted-foreground">Vote Price</p>
                    <p className="text-xl font-bold">₦{Number(contest.vote_price).toLocaleString()}</p>
                  </div>
                  <div>
                    <CountdownTimer 
                      endDate={contest.end_date} 
                      startDate={contest.start_date}
                    />
                  </div>
                </div>
                <ShareButtons 
                  title={contest.title} 
                  description={contest.description || `Vote now in ${contest.title}`}
                  url={contestUrl}
                />
              </div>
              {contest.description && (
                <p className="mt-4 text-muted-foreground">{contest.description}</p>
              )}
            </CardContent>
          </Card>

          {/* Live Voting Mode Toggle */}
          {contest.is_live_voting && !contestantsLoading && contestants && contestants.length > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="h-5 w-5 text-red-500" />
                <span className="font-medium">Live Voting</span>
              </div>
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'live' | 'standard')}>
                <TabsList>
                  <TabsTrigger value="live" className="flex items-center gap-1">
                    <Radio className="h-3 w-3" />
                    Live
                  </TabsTrigger>
                  <TabsTrigger value="standard" className="flex items-center gap-1">
                    <LayoutGrid className="h-3 w-3" />
                    Grid
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          )}

          {/* Live Contest View */}
          {contest.is_live_voting && viewMode === 'live' && !contestantsLoading && contestants && contestants.length > 0 ? (
            <LiveContestView
              contestId={contest.id}
              contestTitle={contest.title}
              contestCustomSlug={contest.custom_slug}
              streamUrl={contest.stream_url}
              streamPlatform={contest.stream_platform as any}
              contestants={contestants}
              totalVotes={contest.total_votes}
              votePrice={Number(contest.vote_price)}
              voteCurrency={contest.vote_currency || 'NGN'}
              isEnded={isEnded || false}
              primaryColor={primaryColor}
              onVoteClick={handleVoteClick}
            />
          ) : (
          /* Contestants - Standard View */
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <h2 className="text-xl font-bold">Contestants</h2>
              {contestants && contestants.length > 0 && (
                <ContestantFilter
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                />
              )}
            </div>
            {contestantsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-64 w-full" />
                ))}
              </div>
            ) : filteredContestants && filteredContestants.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredContestants.map((contestant, index) => (
                  <Card 
                    key={contestant.id} 
                    className="overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="relative h-48 bg-secondary">
                      {contestant.photo_url ? (
                        <img 
                          src={contestant.photo_url} 
                          alt={contestant.name} 
                          className="h-full w-full object-cover" 
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <User className="h-16 w-16 text-muted-foreground" />
                        </div>
                      )}
                      {index < 3 && (
                        <div className="absolute top-2 left-2">
                          <Badge 
                            style={{ 
                              backgroundColor: index === 0 ? '#eab308' : index === 1 ? '#9ca3af' : '#b45309'
                            }}
                          >
                            #{index + 1}
                          </Badge>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg">{contestant.name}</h3>
                      {contestant.bio && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{contestant.bio}</p>
                      )}
                      <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                        <Vote className="h-4 w-4" />
                        <span>
                          {contestant.is_public_votes 
                            ? `${contestant.vote_count.toLocaleString()} votes`
                            : 'Votes hidden'}
                        </span>
                      </div>
                      <Button 
                          className="w-full mt-4"
                          style={{ backgroundColor: primaryColor }}
                          disabled={isEnded}
                          onClick={() => handleVoteClick(contestant)}
                        >
                          {isEnded ? 'Voting Ended' : 'Vote Now'}
                        </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : contestants && contestants.length > 0 ? (
              <Card className="p-8 text-center">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No contestants match your search</p>
                <Button variant="outline" className="mt-3" onClick={() => setSearchTerm('')}>
                  Clear Search
                </Button>
              </Card>
            ) : (
              <Card className="p-8 text-center">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No contestants yet</p>
              </Card>
            )}
          </div>
          )}

          {/* Call to Action - only show for non-authenticated users */}
          {!user && (
            <Card className="mt-8 p-6 text-center" style={{ borderColor: primaryColor }}>
              <h3 className="text-xl font-bold mb-2">Create an account for easier voting!</h3>
              <p className="text-muted-foreground mb-4">
                Sign up to track your votes and get notified about contest updates.
              </p>
              <div className="flex gap-4 justify-center">
                <Link to="/auth">
                  <Button style={{ backgroundColor: primaryColor }}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Login / Sign Up
                  </Button>
                </Link>
              </div>
            </Card>
          )}
        </main>

        {/* Footer */}
        <footer className="py-6 px-4 border-t border-border mt-8">
          <div className="container mx-auto text-center text-sm text-muted-foreground">
            Powered by <Link to="/" className="font-semibold hover:underline" style={{ color: primaryColor }}>Useqiv</Link>
          </div>
        </footer>
      </div>

      {/* Vote Selection Dialog */}
      <Dialog open={isVoteSelectionOpen} onOpenChange={setIsVoteSelectionOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Vote for {selectedContestant?.name}</DialogTitle>
            <DialogDescription>
              Select the number of votes you want to cast
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 gap-2">
              {voteOptions.map((option) => (
                <Button
                  key={option}
                  variant={voteQuantity === option ? 'default' : 'outline'}
                  onClick={() => setVoteQuantity(option)}
                  style={voteQuantity === option ? { backgroundColor: primaryColor } : undefined}
                >
                  {option} {option === 1 ? 'Vote' : 'Votes'}
                </Button>
              ))}
            </div>
            
            {/* Currency Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-2">
                  <ArrowRightLeft className="h-4 w-4" />
                  Pay in different currency
                </label>
                <LiveRatesIndicator isLive={isLive} lastUpdated={lastUpdated} />
              </div>
              <CurrencySelector
                value={effectivePaymentCurrency}
                onValueChange={(value) => setPaymentCurrency(value)}
              />
              {effectivePaymentCurrency !== contestCurrency && (
                <p className="text-xs text-muted-foreground">
                  Original price: {formatCurrency(totalAmount, contestCurrency)}
                </p>
              )}
            </div>
            
            <div className="p-4 bg-muted rounded-lg space-y-2">
              {effectivePaymentCurrency !== contestCurrency && (
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>Original ({contestCurrency})</span>
                  <span>{formatCurrency(totalAmount, contestCurrency)}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">
                  {effectivePaymentCurrency !== contestCurrency ? 'You Pay' : 'Total Amount'}
                </span>
                <span className="text-xl font-bold">
                  {formatCurrency(Math.ceil(convertedAmount * 100) / 100, effectivePaymentCurrency)}
                </span>
              </div>
              {effectivePaymentCurrency !== contestCurrency && (
                <p className="text-xs text-muted-foreground text-right">
                  Converted rate (includes fees)
                </p>
              )}
            </div>

            {!user && (
              <p className="text-sm text-muted-foreground text-center">
                You'll need to provide your email address on the next step
              </p>
            )}
            
            <Button 
              className="w-full" 
              onClick={handleProceedToPayment}
              style={{ backgroundColor: primaryColor }}
            >
              Proceed to Payment
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      {selectedContestant && contest && (
        <PaymentModal
          open={isPaymentModalOpen}
          onOpenChange={setIsPaymentModalOpen}
          type="vote"
          amount={totalAmount}
          currency={contestCurrency}
          originalCurrency={contestCurrency}
          itemDetails={{
            contest_id: contest.id,
            contestant_id: selectedContestant.id,
            vote_quantity: voteQuantity,
            name: selectedContestant.name,
          }}
        />
      )}
    </>
  );
};

export default PublicContest;
