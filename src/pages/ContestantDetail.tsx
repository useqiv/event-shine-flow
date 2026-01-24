import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useContest, useContestants, useVote } from '@/hooks/useContests';
import { useRealtimeContestants, useRealtimeContest } from '@/hooks/useRealtimeContestants';
import { useWallet, useWalletCurrencyBalances } from '@/hooks/useWallet';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ShareButtons } from '@/components/ui/share-buttons';
import { CountdownTimer } from '@/components/ui/countdown-timer';
import PaymentModal from '@/components/PaymentModal';
import { FavoriteButton } from '@/components/dashboard/FavoriteButton';
import { formatCurrency } from '@/components/ui/currency-selector';
import CurrencyDisplay from '@/components/ui/currency-display';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Trophy, 
  Calendar, 
  Vote, 
  ArrowLeft, 
  Users,
  Wallet,
  ExternalLink,
  Copy,
} from 'lucide-react';
import { format } from 'date-fns';

const voteOptions = [1, 5, 10, 25, 50, 100];

// Helper to create URL-friendly slug from name
export const createContestantSlug = (name: string) => {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
};

const ContestantDetail = () => {
  const { contestId, contestantSlug } = useParams<{ contestId: string; contestantSlug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: contest, isLoading: contestLoading } = useContest(contestId || '');
  const { data: contestants, isLoading: contestantsLoading } = useContestants(contestId || '');
  const { data: wallet } = useWallet();
  const { data: currencyBalances } = useWalletCurrencyBalances();
  const vote = useVote();
  
  const [voteQuantity, setVoteQuantity] = useState(1);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isVoteSelectionOpen, setIsVoteSelectionOpen] = useState(false);

  // Find contestant by slug
  const contestant = useMemo(() => {
    if (!contestants || !contestantSlug) return null;
    return contestants.find((c: any) => createContestantSlug(c.name) === contestantSlug);
  }, [contestants, contestantSlug]);

  // Enable real-time updates
  const { initializeVoteCounts } = useRealtimeContestants(contestId || '', () => {});
  useRealtimeContest(contestId || '');

  useEffect(() => {
    if (contestants && contestants.length > 0) {
      initializeVoteCounts(contestants);
    }
  }, [contestants, initializeVoteCounts]);

  // Get contestant rank
  const contestantRank = useMemo(() => {
    if (!contestants || !contestant) return 0;
    const sorted = [...contestants].sort((a: any, b: any) => b.vote_count - a.vote_count);
    return sorted.findIndex((c: any) => c.id === contestant.id) + 1;
  }, [contestants, contestant]);

  // Brand colors
  const primaryColor = (contest as any)?.brand_primary_color || '#7c3aed';
  const secondaryColor = (contest as any)?.brand_secondary_color || '#f97316';
  const brandStyles = useMemo(() => ({
    '--brand-primary': primaryColor,
    '--brand-secondary': secondaryColor,
  } as React.CSSProperties), [primaryColor, secondaryColor]);

  const isEnded = contest && new Date(contest.end_date) < new Date();
  const totalAmount = contest ? voteQuantity * Number(contest.vote_price) : 0;
  const contestCurrency = (contest as any)?.currency || 'NGN';

  // Generate contestant page URL
  const contestantUrl = contestant 
    ? `${window.location.origin}/contests/${contestId}/contestant/${createContestantSlug(contestant.name)}`
    : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(contestantUrl);
    toast({
      title: "Link Copied!",
      description: "Contestant page link copied to clipboard."
    });
  };

  const handleVoteClick = () => {
    if (isEnded) {
      toast({
        title: "Contest Ended",
        description: "This contest has ended. Voting is no longer available.",
        variant: "destructive"
      });
      return;
    }
    setVoteQuantity(1);
    setIsVoteSelectionOpen(true);
  };

  const handleProceedToPayment = () => {
    setIsVoteSelectionOpen(false);
    setIsPaymentModalOpen(true);
  };

  const handleWalletPayment = async () => {
    if (!contestant || !contest || !user) return;
    
    const balance = currencyBalances?.find(b => b.currency === contestCurrency);
    const walletBalance = balance?.balance || 0;
    
    if (walletBalance < totalAmount) {
      toast({
        title: "Insufficient Balance",
        description: `You need ${formatCurrency(totalAmount, contestCurrency)} to vote. Your balance is ${formatCurrency(walletBalance, contestCurrency)}`,
        variant: "destructive"
      });
      return;
    }

    try {
      await vote.mutateAsync({
        contestantId: contestant.id,
        contestId: contestId!,
        quantity: voteQuantity,
        amountPaid: totalAmount,
        paymentMethod: 'wallet',
        currency: contestCurrency
      });

      toast({
        title: "Vote Successful!",
        description: `You voted ${voteQuantity} time(s) for ${contestant.name}!`
      });
      setIsVoteSelectionOpen(false);
    } catch (error: any) {
      toast({
        title: "Vote Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (contestLoading || contestantsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid lg:grid-cols-2 gap-8">
            <Skeleton className="h-96 rounded-lg" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-12 w-32" />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!contest || !contestant) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Contestant Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The contestant you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild>
            <Link to="/contests">Browse Contests</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" style={brandStyles}>
      <Helmet>
        <title>{contestant.name} - Vote in {contest.title}</title>
        <meta name="description" content={`Vote for ${contestant.name} in ${contest.title}. ${contestant.bio || ''}`} />
        <meta property="og:title" content={`Vote for ${contestant.name}`} />
        <meta property="og:description" content={`Support ${contestant.name} in ${contest.title}. Cast your votes now!`} />
        {contestant.photo_url && <meta property="og:image" content={contestant.photo_url} />}
      </Helmet>

      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Back Link */}
        <Link 
          to={`/contests/${contestId}`} 
          className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to {contest.title}
        </Link>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Contestant Photo */}
          <div className="space-y-4">
            <div className="relative aspect-square rounded-xl overflow-hidden bg-secondary">
              {contestant.photo_url ? (
                <img 
                  src={contestant.photo_url} 
                  alt={contestant.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Users className="h-24 w-24 text-muted-foreground" />
                </div>
              )}
              
              {/* Rank Badge */}
              {contestantRank <= 3 && (
                <Badge 
                  className="absolute top-4 left-4 text-lg px-3 py-1"
                  style={{ 
                    backgroundColor: contestantRank === 1 ? '#FFD700' : contestantRank === 2 ? '#C0C0C0' : '#CD7F32',
                    color: 'black'
                  }}
                >
                  <Trophy className="h-4 w-4 mr-1" />
                  #{contestantRank}
                </Badge>
              )}
            </div>

            {/* QR Code Section */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold mb-1">Share QR Code</h3>
                    <p className="text-sm text-muted-foreground">
                      Scan to vote for {contestant.name}
                    </p>
                  </div>
                  <div className="bg-white p-2 rounded-lg">
                    <QRCodeSVG 
                      value={contestantUrl} 
                      size={80}
                      level="H"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contestant Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {user && (
                  <FavoriteButton contestantId={contestant.id} />
                )}
                <h1 className="text-3xl font-bold">{contestant.name}</h1>
              </div>
              
              <Link 
                to={`/contests/${contestId}`}
                className="inline-flex items-center text-muted-foreground hover:text-primary"
              >
                {contest.title}
                <ExternalLink className="h-3 w-3 ml-1" />
              </Link>
            </div>

            {/* Vote Count */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div 
                    className="p-4 rounded-full"
                    style={{ backgroundColor: `${primaryColor}20` }}
                  >
                    <Vote className="h-8 w-8" style={{ color: primaryColor }} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Votes</p>
                    <p className="text-3xl font-bold" style={{ color: primaryColor }}>
                      {contestant.vote_count.toLocaleString()}
                    </p>
                  </div>
                  {contestantRank > 0 && (
                    <Badge variant="secondary" className="ml-auto text-lg">
                      Rank #{contestantRank}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Bio */}
            {contestant.bio && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2">About</h3>
                  <p className="text-muted-foreground">{contestant.bio}</p>
                </CardContent>
              </Card>
            )}

            {/* Contest Info */}
            <Card>
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Contest Period</p>
                    <p className="font-medium">
                      {format(new Date(contest.start_date), 'MMM d')} - {format(new Date(contest.end_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                
                {!isEnded && (
                  <div className="pt-3 border-t">
                    <p className="text-sm text-muted-foreground mb-2">Time Remaining</p>
                    <CountdownTimer endDate={contest.end_date} />
                  </div>
                )}

                <div className="pt-3 border-t">
                  <p className="text-sm text-muted-foreground">Vote Price</p>
                  <CurrencyDisplay 
                    amount={Number(contest.vote_price)} 
                    currency={contestCurrency}
                    className="text-lg font-semibold"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button 
                size="lg" 
                className="flex-1"
                onClick={handleVoteClick}
                disabled={isEnded}
                style={{ 
                  backgroundColor: primaryColor,
                  color: 'white'
                }}
              >
                <Vote className="mr-2 h-5 w-5" />
                {isEnded ? 'Contest Ended' : 'Vote Now'}
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                onClick={handleCopyLink}
                title="Copy Link"
              >
                <Copy className="h-5 w-5" />
              </Button>
              
              <ShareButtons 
                title={`Vote for ${contestant.name} in ${contest.title}`}
                description={contestant.bio || `Support ${contestant.name} by voting!`}
                url={contestantUrl}
                imageUrl={contestant.photo_url}
              />
            </div>
          </div>
        </div>

        {/* Other Contestants */}
        {contestants && contestants.length > 1 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Other Contestants</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {contestants
                .filter((c: any) => c.id !== contestant.id)
                .slice(0, 6)
                .map((c: any) => (
                  <Link 
                    key={c.id}
                    to={`/contests/${contestId}/contestant/${createContestantSlug(c.name)}`}
                    className="group"
                  >
                    <Card className="overflow-hidden hover:ring-2 hover:ring-primary transition-all">
                      <div className="aspect-square bg-secondary">
                        {c.photo_url ? (
                          <img 
                            src={c.photo_url} 
                            alt={c.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Users className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-3">
                        <p className="font-medium text-sm truncate">{c.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.vote_count.toLocaleString()} votes
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
            </div>
            
            <div className="text-center mt-6">
              <Button variant="outline" asChild>
                <Link to={`/contests/${contestId}`}>
                  View All Contestants
                </Link>
              </Button>
            </div>
          </div>
        )}
      </main>

      <Footer />

      {/* Vote Selection Dialog */}
      <Dialog open={isVoteSelectionOpen} onOpenChange={setIsVoteSelectionOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Vote for {contestant.name}</DialogTitle>
            <DialogDescription>
              Select the number of votes
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-3 gap-2 py-4">
            {voteOptions.map((option) => (
              <Button
                key={option}
                variant={voteQuantity === option ? "default" : "outline"}
                onClick={() => setVoteQuantity(option)}
                className="h-16 text-lg"
              >
                {option}
              </Button>
            ))}
          </div>
          
          <div className="border-t pt-4 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Amount:</span>
              <CurrencyDisplay 
                amount={totalAmount} 
                currency={contestCurrency}
                className="text-xl font-bold"
              />
            </div>
            
            <div className="flex gap-2">
              {user && (
                <Button 
                  onClick={handleWalletPayment} 
                  className="flex-1"
                  variant="outline"
                  disabled={vote.isPending}
                >
                  <Wallet className="mr-2 h-4 w-4" />
                  Pay with Wallet
                </Button>
              )}
              <Button 
                onClick={handleProceedToPayment} 
                className="flex-1"
                style={{ backgroundColor: primaryColor }}
              >
                {user ? 'Pay with Card' : 'Proceed to Pay'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      {contestant && contest && (
        <PaymentModal
          open={isPaymentModalOpen}
          onOpenChange={setIsPaymentModalOpen}
          type="vote"
          amount={totalAmount}
          currency={contestCurrency}
          itemDetails={{
            contest_id: contestId,
            contestant_id: contestant.id,
            vote_quantity: voteQuantity,
            name: `${voteQuantity} vote(s) for ${contestant.name}`
          }}
        />
      )}
    </div>
  );
};

export default ContestantDetail;
