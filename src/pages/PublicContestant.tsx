import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useVote } from '@/hooks/useContests';
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
import { supabase } from '@/integrations/supabase/client';
import { getContestUrl, getContestantUrl, createContestantSlug } from '@/lib/urlHelpers';
import { 
  Trophy, 
  Calendar, 
  Vote, 
  ArrowLeft, 
  Users,
  Wallet,
  ExternalLink,
  Copy,
  Download,
  Share2,
  QrCode,
  TrendingUp,
  Clock,
  Sparkles,
} from 'lucide-react';
import { format } from 'date-fns';

const voteOptions = [1, 5, 10, 25, 50, 100];

const PublicContestant = () => {
  const { slug, contestantSlug } = useParams<{ slug: string; contestantSlug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: wallet } = useWallet();
  const { data: currencyBalances } = useWalletCurrencyBalances();
  const vote = useVote();
  
  const [voteQuantity, setVoteQuantity] = useState(1);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isVoteSelectionOpen, setIsVoteSelectionOpen] = useState(false);
  const [showVotePulse, setShowVotePulse] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

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

  // Find contestant by slug
  const contestant = useMemo(() => {
    if (!contestants || !contestantSlug) return null;
    return contestants.find((c: any) => createContestantSlug(c.name) === contestantSlug);
  }, [contestants, contestantSlug]);

  // Brand colors
  const primaryColor = contest?.brand_primary_color || '#7c3aed';
  const secondaryColor = contest?.brand_secondary_color || '#f97316';
  const brandStyles = useMemo(() => ({
    '--brand-primary': primaryColor,
    '--brand-secondary': secondaryColor,
  } as React.CSSProperties), [primaryColor, secondaryColor]);

  const isEnded = contest && new Date(contest.end_date) < new Date();
  const totalAmount = contest ? voteQuantity * Number(contest.vote_price) : 0;
  const contestCurrency = contest?.vote_currency || 'NGN';

  // Generate contestant page URL - use custom_slug
  const contestantUrl = contestant 
    ? getContestantUrl(contest?.id || '', contestant.name, contest?.custom_slug)
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
        contestId: contest.id,
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
        description: error.message,
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
          <div className="grid lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2">
              <Skeleton className="aspect-[3/4] rounded-2xl" />
            </div>
            <div className="lg:col-span-3 space-y-4">
              <Skeleton className="h-12 w-64" />
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-14 w-full" />
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

  // Calculate rank
  const sortedContestants = [...(contestants || [])].sort((a: any, b: any) => b.vote_count - a.vote_count);
  const rank = sortedContestants.findIndex((c: any) => c.id === contestant.id) + 1;
  const totalContestants = sortedContestants.length;

  // Calculate vote progress
  const maxVotes = Math.max(...(contestants || []).map((c: any) => c.vote_count), 1);
  const voteProgress = (contestant.vote_count / maxVotes) * 100;

  return (
    <div className="min-h-screen bg-background" style={brandStyles}>
      <Helmet>
        <title>{`Vote for ${contestant.name} | ${contest.title}`}</title>
        <meta name="description" content={contestant.bio || `Support ${contestant.name} in ${contest.title}. Cast your votes now!`} />
        <meta property="og:title" content={`Vote for ${contestant.name}`} />
        <meta property="og:description" content={contestant.bio || `Support ${contestant.name} in ${contest.title}. Cast your votes now!`} />
        {contestant.photo_url && <meta property="og:image" content={contestant.photo_url} />}
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`Vote for ${contestant.name}`} />
        <meta name="twitter:description" content={contestant.bio || `Support ${contestant.name} in ${contest.title}. Cast your votes now!`} />
        {contestant.photo_url && <meta name="twitter:image" content={contestant.photo_url} />}
      </Helmet>

      <Navbar />
      
      <main className="container mx-auto px-4 pt-20 sm:pt-24 lg:pt-28 pb-4 sm:pb-6 lg:pb-8">
        {/* Back Link */}
        <Link 
          to={`/c/${slug}`} 
          className="inline-flex items-center text-xs sm:text-sm text-muted-foreground hover:text-foreground mb-4 sm:mb-5 lg:mb-6 transition-colors"
        >
          <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
          <span className="truncate max-w-[200px] sm:max-w-none">Back to {contest.title}</span>
        </Link>

        {/* Simple mobile-first layout */}
        <div className="flex flex-col lg:grid lg:grid-cols-5 gap-6 lg:gap-10">
          
          {/* Photo Section */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-4 space-y-4">
              <div className="relative aspect-square sm:aspect-[3/4] rounded-2xl overflow-hidden bg-muted">
                {contestant.photo_url ? (
                  <img 
                    src={contestant.photo_url} 
                    alt={contestant.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/40">
                    <Users className="h-20 w-20 text-primary/50" />
                  </div>
                )}
                {rank <= 3 && (
                  <Badge 
                    className="absolute top-4 left-4 text-lg px-3 py-1"
                    style={{ backgroundColor: rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : '#CD7F32' }}
                  >
                    <Trophy className="h-4 w-4 mr-1" />
                    #{rank}
                  </Badge>
                )}
              </div>
              
              {/* Desktop QR Code */}
              <Card className="hidden lg:block">
                <CardContent className="p-4 flex items-center gap-4">
                  <QRCodeSVG value={contestantUrl} size={80} />
                  <div className="flex-1">
                    <p className="font-medium text-sm">Share QR Code</p>
                    <p className="text-xs text-muted-foreground">Scan to vote for {contestant.name}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleCopyLink}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Details Section */}
          <div className="lg:col-span-3 space-y-4 sm:space-y-6">
            {/* Name and Actions */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">{contestant.name}</h1>
                <p className="text-muted-foreground mt-1">Competing in {contest.title}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <FavoriteButton contestantId={contestant.id} />
                <ShareButtons 
                  title={`Vote for ${contestant.name}`} 
                  description={contestant.bio || `Support ${contestant.name} in ${contest.title}`}
                  url={contestantUrl}
                />
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              <Card>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-2 text-primary">
                    <Vote className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="text-xs sm:text-sm text-muted-foreground">Total Votes</span>
                  </div>
                  <p className={`text-xl sm:text-2xl font-bold mt-1 ${showVotePulse ? 'animate-pulse text-primary' : ''}`}>
                    {contestant.is_public_votes ? contestant.vote_count.toLocaleString() : '---'}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-2 text-primary">
                    <Trophy className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="text-xs sm:text-sm text-muted-foreground">Rank</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold mt-1">
                    #{rank} <span className="text-sm font-normal text-muted-foreground">of {totalContestants}</span>
                  </p>
                </CardContent>
              </Card>
              
              <Card className="col-span-2 sm:col-span-1">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-2 text-primary">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="text-xs sm:text-sm text-muted-foreground">Time Left</span>
                  </div>
                  <div className="mt-1">
                    <CountdownTimer endDate={contest.end_date} className="text-xl sm:text-2xl font-bold" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Vote Progress */}
            {contestant.is_public_votes && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Vote Progress</span>
                    <span className="text-sm text-muted-foreground">{voteProgress.toFixed(1)}% of leader</span>
                  </div>
                  <Progress value={voteProgress} className="h-3" />
                </CardContent>
              </Card>
            )}

            {/* Bio */}
            {contestant.bio && (
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <h3 className="font-semibold mb-2">About</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{contestant.bio}</p>
                </CardContent>
              </Card>
            )}

            {/* Vote CTA */}
            <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-lg">Support {contestant.name}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <CurrencyDisplay amount={Number(contest.vote_price)} currency={contestCurrency} /> per vote
                    </p>
                  </div>
                  <Button 
                    size="lg" 
                    onClick={handleVoteClick}
                    disabled={isEnded}
                    className="w-full sm:w-auto px-8"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Vote className="h-5 w-5 mr-2" />
                    {isEnded ? 'Contest Ended' : 'Vote Now'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Contest Info */}
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  {contest.image_url && (
                    <img src={contest.image_url} alt={contest.title} className="w-12 h-12 rounded-lg object-cover" />
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold">{contest.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      Ends {format(new Date(contest.end_date), 'PPP')}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/c/${slug}`}>
                      View Contest
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />

      {/* Vote Selection Dialog */}
      <Dialog open={isVoteSelectionOpen} onOpenChange={setIsVoteSelectionOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Vote for {contestant.name}</DialogTitle>
            <DialogDescription>
              Select how many votes you want to cast
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 gap-2">
              {voteOptions.map((option) => (
                <Button
                  key={option}
                  variant={voteQuantity === option ? "default" : "outline"}
                  onClick={() => setVoteQuantity(option)}
                  className="h-14 text-lg font-semibold"
                >
                  {option}
                </Button>
              ))}
            </div>
            
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <span className="text-muted-foreground">Total Cost:</span>
              <span className="text-xl font-bold">
                <CurrencyDisplay amount={totalAmount} currency={contestCurrency} />
              </span>
            </div>

            {user && (
              <Button
                className="w-full"
                variant="outline"
                onClick={handleWalletPayment}
                disabled={vote.isPending}
              >
                <Wallet className="h-4 w-4 mr-2" />
                Pay with Wallet
              </Button>
            )}

            <Button 
              className="w-full" 
              size="lg"
              onClick={handleProceedToPayment}
              disabled={vote.isPending}
            >
              Proceed to Payment
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      <PaymentModal
        open={isPaymentModalOpen}
        onOpenChange={setIsPaymentModalOpen}
        type="vote"
        amount={totalAmount}
        currency={contestCurrency}
        itemDetails={{
          contest_id: contest.id,
          contestant_id: contestant.id,
          vote_quantity: voteQuantity,
          name: contestant.name
        }}
      />
    </div>
  );
};

export default PublicContestant;
