import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
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
  Download,
  Share2,
  QrCode,
  TrendingUp,
  Clock,
  Sparkles,
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
  const [showVotePulse, setShowVotePulse] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  // Find contestant by slug
  const contestant = useMemo(() => {
    if (!contestants || !contestantSlug) return null;
    return contestants.find((c: any) => createContestantSlug(c.name) === contestantSlug);
  }, [contestants, contestantSlug]);

  // Enable real-time updates
  const { initializeVoteCounts } = useRealtimeContestants(contestId || '', () => {
    // Trigger pulse animation on vote update
    setShowVotePulse(true);
    setTimeout(() => setShowVotePulse(false), 1000);
  });
  useRealtimeContest(contestId || '');

  useEffect(() => {
    if (contestants && contestants.length > 0) {
      initializeVoteCounts(contestants);
    }
  }, [contestants, initializeVoteCounts]);

  // Get contestant rank and leader stats
  const { contestantRank, leaderVotes, voteProgress } = useMemo(() => {
    if (!contestants || !contestant) return { contestantRank: 0, leaderVotes: 0, voteProgress: 0 };
    const sorted = [...contestants].sort((a: any, b: any) => b.vote_count - a.vote_count);
    const rank = sorted.findIndex((c: any) => c.id === contestant.id) + 1;
    const leader = sorted[0]?.vote_count || 0;
    const progress = leader > 0 ? (contestant.vote_count / leader) * 100 : 0;
    return { contestantRank: rank, leaderVotes: leader, voteProgress: progress };
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
  const contestCurrency = contest?.vote_currency || 'NGN';

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

  const handleDownloadQR = () => {
    const svg = document.getElementById('contestant-qr-code');
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = 380;
      canvas.height = 380;
      ctx?.drawImage(img, 0, 0, 380, 380);
      
      const link = document.createElement('a');
      link.download = `vote-${createContestantSlug(contestant?.name || '')}-qr.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleShareQR = async () => {
    const svg = document.getElementById('contestant-qr-code');
    if (!svg || !contestant || !contest) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = async () => {
      canvas.width = 380;
      canvas.height = 380;
      ctx?.drawImage(img, 0, 0, 380, 380);
      
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        
        if (navigator.share && navigator.canShare) {
          const file = new File([blob], `vote-${contestant.name}-qr.png`, { type: 'image/png' });
          try {
            await navigator.share({
              title: `Vote for ${contestant.name}`,
              text: `Scan this QR code to vote for ${contestant.name} in ${contest.title}!`,
              files: [file]
            });
          } catch (e) {
            navigator.clipboard.writeText(contestantUrl);
            toast({
              title: "Link Copied!",
              description: "QR code link copied to clipboard."
            });
          }
        } else {
          navigator.clipboard.writeText(contestantUrl);
          toast({
            title: "Link Copied!",
            description: "QR code link copied to clipboard."
          });
        }
      }, 'image/png');
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
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

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-0" style={brandStyles}>
      <Helmet>
        <title>{contestant.name} - Vote in {contest.title}</title>
        <meta name="description" content={`Vote for ${contestant.name} in ${contest.title}. ${contestant.bio || ''}`} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={contestantUrl} />
        <meta property="og:title" content={`Vote for ${contestant.name} in ${contest.title}`} />
        <meta property="og:description" content={contestant.bio || `Support ${contestant.name} by voting! Currently ranked #${contestantRank} with ${contestant.vote_count.toLocaleString()} votes.`} />
        {contestant.photo_url && <meta property="og:image" content={contestant.photo_url} />}
        <meta property="og:site_name" content="EventShine" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`Vote for ${contestant.name}`} />
        <meta name="twitter:description" content={contestant.bio || `Support ${contestant.name} in ${contest.title}. Cast your votes now!`} />
        {contestant.photo_url && <meta name="twitter:image" content={contestant.photo_url} />}
      </Helmet>

      <Navbar />
      
      <main className="container mx-auto px-4 py-6 lg:py-8">
        {/* Back Link */}
        <Link 
          to={`/contests/${contestId}`} 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to {contest.title}
        </Link>

        <div className="grid lg:grid-cols-5 gap-6 lg:gap-10">
          {/* Left Column - Photo */}
          <div className="lg:col-span-2">
            <div className="sticky top-4 space-y-4">
              {/* Main Photo */}
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-secondary shadow-xl">
                {contestant.photo_url ? (
                  <img 
                    src={contestant.photo_url} 
                    alt={contestant.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary to-muted">
                    <Users className="h-24 w-24 text-muted-foreground" />
                  </div>
                )}
                
                {/* Rank Badge Overlay */}
                {contestantRank <= 3 && (
                  <div 
                    className="absolute top-4 left-4 flex items-center gap-2 px-3 py-2 rounded-full text-sm font-bold shadow-lg"
                    style={{ 
                      backgroundColor: contestantRank === 1 ? '#FFD700' : contestantRank === 2 ? '#C0C0C0' : '#CD7F32',
                      color: '#1a1a1a'
                    }}
                  >
                    <Trophy className="h-4 w-4" />
                    #{contestantRank} Place
                  </div>
                )}

                {/* Favorite Button */}
                {user && (
                  <div className="absolute top-4 right-4">
                    <FavoriteButton contestantId={contestant.id} />
                  </div>
                )}

                {/* Gradient Overlay at Bottom */}
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 to-transparent" />
                
                {/* Live Vote Badge - Shows on real-time update */}
                {showVotePulse && (
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-center">
                    <Badge className="bg-primary text-primary-foreground animate-fade-in px-4 py-2">
                      <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
                      New vote received!
                    </Badge>
                  </div>
                )}
              </div>

              {/* Hidden QR for download/share functionality */}
              <div className="hidden">
                <QRCodeSVG 
                  id="contestant-qr-code"
                  value={contestantUrl} 
                  size={380}
                  level="H"
                  includeMargin
                />
              </div>
            </div>
          </div>

          {/* Right Column - Info */}
          <div className="lg:col-span-3 space-y-6">
            {/* Hero Section - Name & Contest */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link 
                  to={`/contests/${contestId}`}
                  className="hover:text-primary transition-colors flex items-center"
                >
                  {contest.title}
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Link>
                <span>•</span>
                <span className="capitalize">{contest.category}</span>
              </div>
              
              <div className="flex items-center gap-4">
                <h1 className="text-4xl lg:text-5xl font-bold tracking-tight capitalize">
                  {contestant.name}
                </h1>
                
                {/* Small QR Thumbnail - Click to expand */}
                <button
                  onClick={() => setIsQRModalOpen(true)}
                  className="group relative p-1 bg-white rounded-lg border border-border shadow-sm hover:shadow-md transition-all hover:scale-105 cursor-pointer"
                  title="Click to expand QR code"
                >
                  <QRCodeSVG 
                    value={contestantUrl} 
                    size={48}
                    level="L"
                  />
                  <div className="absolute inset-0 bg-primary/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <QrCode className="h-4 w-4 text-primary" />
                  </div>
                </button>
              </div>
              
              {((contestant as any).state || (contestant as any).country) && (
                <p className="text-lg text-muted-foreground">
                  {[(contestant as any).state, (contestant as any).country].filter(Boolean).join(', ')}
                </p>
              )}
            </div>

            {/* QR Code Modal */}
            <Dialog open={isQRModalOpen} onOpenChange={setIsQRModalOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <QrCode className="h-5 w-5 text-primary" />
                    Share QR Code
                  </DialogTitle>
                  <DialogDescription>
                    Scan to vote for <span className="font-medium capitalize">{contestant.name}</span>
                  </DialogDescription>
                </DialogHeader>
                
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="bg-white p-4 rounded-2xl shadow-sm border">
                    <QRCodeSVG 
                      value={contestantUrl} 
                      size={220}
                      level="H"
                      includeMargin
                    />
                  </div>
                  
                  <div className="flex gap-3 w-full">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => {
                        handleDownloadQR();
                        setIsQRModalOpen(false);
                      }}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Save QR
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => {
                        handleShareQR();
                        setIsQRModalOpen(false);
                      }}
                    >
                      <Share2 className="mr-2 h-4 w-4" />
                      Share QR
                    </Button>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                    onClick={handleCopyLink}
                  >
                    <Copy className="mr-2 h-3 w-3" />
                    Copy link instead
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Vote Stats Card - Primary Focus */}
            <Card className="border-2 overflow-hidden" style={{ borderColor: `${primaryColor}30` }}>
              <CardContent className="p-0">
                {/* Vote Count Header */}
                <div 
                  className="p-6 text-center"
                  style={{ backgroundColor: `${primaryColor}10` }}
                >
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Votes</p>
                  <p 
                    className={`text-5xl lg:text-6xl font-bold tracking-tight ${showVotePulse ? 'animate-scale-in' : ''}`}
                    style={{ color: primaryColor }}
                  >
                    {contestant.vote_count.toLocaleString()}
                  </p>
                  {contestantRank > 0 && (
                    <Badge 
                      variant="secondary" 
                      className="mt-3 text-base px-4 py-1"
                    >
                      <TrendingUp className="h-4 w-4 mr-1" />
                      Rank #{contestantRank} of {contestants?.length || 0}
                    </Badge>
                  )}
                </div>
                
                {/* Progress to Leader */}
                {contestantRank > 1 && leaderVotes > 0 && (
                  <div className="px-6 py-4 border-t border-border/50">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Progress to #1</span>
                      <span className="font-medium">{Math.round(voteProgress)}%</span>
                    </div>
                    <Progress value={voteProgress} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-2">
                      {(leaderVotes - contestant.vote_count).toLocaleString()} votes behind leader
                    </p>
                  </div>
                )}

                {/* Vote Price & Action */}
                <div className="p-6 border-t border-border/50 bg-background">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Vote Price</p>
                      <CurrencyDisplay 
                        amount={Number(contest.vote_price)} 
                        currency={contestCurrency}
                        className="text-2xl font-bold"
                      />
                    </div>
                    {!isEnded && (
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground flex items-center justify-end">
                          <Clock className="h-3 w-3 mr-1" />
                          Ends in
                        </p>
                        <CountdownTimer endDate={contest.end_date} className="text-sm" />
                      </div>
                    )}
                  </div>
                  
                  {/* Desktop Vote Button */}
                  <Button 
                    size="lg" 
                    className="w-full text-lg h-14 font-semibold hidden lg:flex"
                    onClick={handleVoteClick}
                    disabled={isEnded}
                    style={{ 
                      backgroundColor: isEnded ? undefined : primaryColor,
                      color: isEnded ? undefined : 'white'
                    }}
                  >
                    <Vote className="mr-2 h-5 w-5" />
                    {isEnded ? 'Contest Ended' : 'Vote Now'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Bio & Details - Consolidated */}
            {contestant.bio && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-3">About {contestant.name}</h3>
                  <p className="text-muted-foreground leading-relaxed">{contestant.bio}</p>
                </CardContent>
              </Card>
            )}

            {/* Contest Period */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div 
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: `${primaryColor}15` }}
                  >
                    <Calendar className="h-5 w-5" style={{ color: primaryColor }} />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Contest Period</h3>
                    <p className="text-muted-foreground">
                      {format(new Date(contest.start_date), 'MMM d, yyyy')} — {format(new Date(contest.end_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Share Actions */}
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={handleCopyLink}
                className="flex-1 sm:flex-none"
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy Link
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
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-6">Other Contestants</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {contestants
                .filter((c: any) => c.id !== contestant.id)
                .slice(0, 6)
                .map((c: any) => (
                  <Link 
                    key={c.id}
                    to={`/contests/${contestId}/contestant/${createContestantSlug(c.name)}`}
                    className="group"
                  >
                    <Card className="overflow-hidden hover:ring-2 hover:ring-primary/50 hover:shadow-lg transition-all duration-200">
                      <div className="aspect-square bg-secondary relative overflow-hidden">
                        {c.photo_url ? (
                          <img 
                            src={c.photo_url} 
                            alt={c.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Users className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-3">
                        <p className="font-medium text-sm truncate capitalize">{c.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.vote_count.toLocaleString()} votes
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
            </div>
            
            <div className="text-center mt-8">
              <Button variant="outline" size="lg" asChild>
                <Link to={`/contests/${contestId}`}>
                  View All Contestants
                </Link>
              </Button>
            </div>
          </div>
        )}
      </main>

      <Footer />

      {/* Sticky Mobile Vote CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t lg:hidden z-50">
        <div className="container mx-auto flex items-center gap-3">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Vote Price</p>
            <CurrencyDisplay 
              amount={Number(contest.vote_price)} 
              currency={contestCurrency}
              className="font-bold"
            />
          </div>
          <Button 
            size="lg" 
            className="px-8 font-semibold"
            onClick={handleVoteClick}
            disabled={isEnded}
            style={{ 
              backgroundColor: isEnded ? undefined : primaryColor,
              color: isEnded ? undefined : 'white'
            }}
          >
            <Vote className="mr-2 h-5 w-5" />
            {isEnded ? 'Ended' : 'Vote Now'}
          </Button>
        </div>
      </div>

      {/* Vote Selection Dialog */}
      <Dialog open={isVoteSelectionOpen} onOpenChange={setIsVoteSelectionOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="capitalize">Vote for {contestant.name}</DialogTitle>
            <DialogDescription>
              Select the number of votes you want to cast
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-3 gap-2 py-4">
            {voteOptions.map((option) => (
              <Button
                key={option}
                variant={voteQuantity === option ? "default" : "outline"}
                onClick={() => setVoteQuantity(option)}
                className="h-16 text-lg font-semibold"
                style={voteQuantity === option ? { backgroundColor: primaryColor } : undefined}
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
                className="text-2xl font-bold"
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
                style={{ backgroundColor: primaryColor, color: 'white' }}
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
