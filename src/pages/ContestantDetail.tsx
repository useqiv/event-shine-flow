import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useContest, useContestants, useVote, useContestVoteOptions } from '@/hooks/useContests';
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
import { supabase } from '@/integrations/supabase/client';
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
import { getContestUrl, getContestantUrl, createContestantSlug, getContestantShareUrl } from '@/lib/urlHelpers';

// Note: createContestantSlug is imported from @/lib/urlHelpers

const ContestantDetail = () => {
  // Support both route patterns: /contests/:contestId/contestant/:slug and /c/:slug/contestant/:contestantSlug
  const params = useParams<{ contestId?: string; contestantSlug: string; slug?: string }>();
  const contestIdFromParams = params.contestId;
  const contestSlug = params.slug; // For /c/:slug/contestant/:contestantSlug route
  const contestantSlug = params.contestantSlug;
  
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: wallet } = useWallet();
  const { data: currencyBalances } = useWalletCurrencyBalances();
  const vote = useVote();
  
  // If we have a contest slug (short URL), fetch contest by slug first
  const { data: contestBySlug, isLoading: slugLoading } = useQuery({
    queryKey: ['contest-by-slug', contestSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contests')
        .select('*')
        .eq('custom_slug', contestSlug)
        .eq('is_active', true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!contestSlug && !contestIdFromParams,
  });
  
  // Determine the actual contest ID to use
  const contestId = contestIdFromParams || contestBySlug?.id;
  
  // Use the standard hook if we have a contestId from params, otherwise use the slug-fetched contest
  const { data: contestFromHook, isLoading: contestHookLoading } = useContest(contestIdFromParams || '');
  const contest = contestIdFromParams ? contestFromHook : contestBySlug;
  const contestLoading = contestIdFromParams ? contestHookLoading : slugLoading;
  const { data: contestVoteOptions = [] } = useContestVoteOptions(contestId || '');
  
  const { data: contestants, isLoading: contestantsLoading } = useContestants(contestId || '');
  
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
  const hasNotStarted = contest && new Date(contest.start_date) > new Date();
  const isVotingLocked = isEnded || hasNotStarted;
  const normalizedVoteOptions = useMemo(() => {
    if (contestVoteOptions.length > 0) {
      return contestVoteOptions.map((option) => ({
        vote_quantity: Number(option.vote_quantity),
        price: Number(option.price),
      }));
    }
    const fallbackQuantity = Math.max(1, Number((contest as any)?.vote_amount ?? 1));
    return [{ vote_quantity: fallbackQuantity, price: Number(contest?.vote_price ?? 1) * fallbackQuantity }];
  }, [contestVoteOptions, contest, (contest as any)?.vote_amount]);
  const selectedOption = useMemo(
    () =>
      normalizedVoteOptions.find((option) => option.vote_quantity === voteQuantity) || normalizedVoteOptions[0],
    [normalizedVoteOptions, voteQuantity]
  );
  const totalAmount = selectedOption?.price || 0;
  const contestCurrency = contest?.vote_currency || 'NGN';

  // Generate URLs - use custom_slug if available
  const contestUrl = contest ? getContestUrl(contest.id, (contest as any)?.custom_slug) : '';
  const contestantUrl = contestant 
    ? getContestantUrl(contestId!, contestant.name, (contest as any)?.custom_slug, true)
    : '';
  const contestantPageSlug = contestant ? createContestantSlug(contestant.name) : '';
  const contestantImageUrl = contestant?.photo_url
    ? (contestant.photo_url.startsWith('http') ? contestant.photo_url : `https://www.useqiv.com${contestant.photo_url}`)
    : '';
  const ogImage = contestantImageUrl;
  const contestantShareUrl = contest && contestantPageSlug
    ? `${getContestantShareUrl((contest as any)?.custom_slug || contest.id, contestantPageSlug, true)}?${new URLSearchParams({
        name: contestant?.name || '',
        contest: contest?.title || '',
        description: `Vote and support ${contestant?.name || ''} on ${contest?.title || ''}`.trim(),
        ...(contestantImageUrl ? { image: contestantImageUrl } : {}),
      }).toString()}`
    : contestantUrl;
  
  // Back link path - use short URL if accessed via slug route
  const backLinkPath = contestSlug ? `/c/${contestSlug}` : `/contests/${contestId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(contestantShareUrl);
    toast({
      title: "Link Copied!",
      description: "Contestant share link copied to clipboard."
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
    if (hasNotStarted) {
      toast({
        title: "Voting Not Open Yet",
        description: `Voting opens on ${new Date(contest!.start_date).toLocaleString()}.`,
        variant: "destructive"
      });
      return;
    }
    setVoteQuantity(normalizedVoteOptions[0]?.vote_quantity || 1);
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
            navigator.clipboard.writeText(contestantShareUrl);
            toast({
              title: "Link Copied!",
              description: "QR code link copied to clipboard."
            });
          }
        } else {
          navigator.clipboard.writeText(contestantShareUrl);
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
        <title>{`Vote for ${contestant.name} in ${contest.title}`}</title>
        <meta name="description" content={`Vote and support ${contestant.name} for ${contest.title}. ${contestant.bio || ''}`.trim()} />
        <link rel="canonical" href={contestantUrl} />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="profile" />
        <meta property="og:url" content={contestantUrl} />
        <meta property="og:title" content={`Vote for ${contestant.name} in ${contest.title}`} />
        <meta property="og:description" content={`Vote and support ${contestant.name} for ${contest.title}. Currently ranked #${contestantRank} with ${contestant.vote_count.toLocaleString()} votes.`} />
        {ogImage && <meta property="og:image" content={ogImage} />}
        {ogImage && <meta property="og:image:secure_url" content={ogImage} />}
        {ogImage && <meta property="og:image:width" content="1200" />}
        {ogImage && <meta property="og:image:height" content="630" />}
        {ogImage && <meta property="og:image:alt" content={contestant.name} />}
        <meta property="og:site_name" content="USEQIV" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@useqiv" />
        <meta name="twitter:url" content={contestantUrl} />
        <meta name="twitter:title" content={`Vote for ${contestant.name}`} />
        <meta name="twitter:description" content={`Support ${contestant.name} in ${contest.title}. Cast your votes now!`} />
        {ogImage && <meta name="twitter:image" content={ogImage} />}
        {ogImage && <meta name="twitter:image:alt" content={contestant.name} />}
      </Helmet>

      <Navbar />
      
      <main className="container mx-auto px-4 pt-20 sm:pt-24 lg:pt-28 pb-4 sm:pb-6 lg:pb-8">
        {/* Back Link */}
        <Link 
          to={backLinkPath} 
          className="inline-flex items-center text-xs sm:text-sm text-muted-foreground hover:text-foreground mb-4 sm:mb-5 lg:mb-6 transition-colors"
        >
          <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
          <span className="truncate max-w-[200px] sm:max-w-none">Back to {contest.title}</span>
        </Link>

        {/* Mobile-First Layout: Stack vertically, grid on lg+ */}
        <div className="flex flex-col lg:grid lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-10">
          
          {/* Mobile: Name & QR first for immediate context */}
          <div className="lg:hidden space-y-3">
            {/* Contest breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground overflow-hidden">
              <Link 
                to={backLinkPath}
                className="hover:text-primary transition-colors flex items-center truncate"
              >
                <span className="truncate">{contest.title}</span>
                <ExternalLink className="h-3 w-3 ml-1 flex-shrink-0" />
              </Link>
              <span className="flex-shrink-0">•</span>
              <span className="capitalize flex-shrink-0">{contest.category}</span>
            </div>
            
            {/* Name with QR */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight capitalize leading-tight">
                  {contestant.name}
                </h1>
                {((contestant as any).state || (contestant as any).country) && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {[(contestant as any).state, (contestant as any).country].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
              
              {/* QR Thumbnail */}
              <button
                onClick={() => setIsQRModalOpen(true)}
                className="flex-shrink-0 p-1.5 bg-white rounded-lg border border-border shadow-sm active:scale-95 transition-transform"
                aria-label="Share QR code"
              >
                <QRCodeSVG value={contestantUrl} size={40} level="L" />
              </button>
            </div>

            {/* Quick Stats Row */}
            <div className="flex items-center gap-3">
              {contestantRank <= 3 && (
                <Badge 
                  className="text-xs px-2 py-1"
                  style={{ 
                    backgroundColor: contestantRank === 1 ? '#FFD700' : contestantRank === 2 ? '#C0C0C0' : '#CD7F32',
                    color: '#1a1a1a'
                  }}
                >
                  <Trophy className="h-3 w-3 mr-1" />
                  #{contestantRank}
                </Badge>
              )}
              <Badge variant="secondary" className="text-xs px-2 py-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                {contestant.vote_count.toLocaleString()} votes
              </Badge>
              {user && (
                <FavoriteButton contestantId={contestant.id} className="ml-auto" />
              )}
            </div>
          </div>

          {/* Photo Section */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-4 space-y-4">
              {/* Main Photo - Compact on mobile, full on desktop */}
              <div className="relative aspect-square sm:aspect-[4/5] lg:aspect-[3/4] rounded-xl sm:rounded-2xl overflow-hidden bg-secondary shadow-lg sm:shadow-xl">
                {contestant.photo_url ? (
                  <img 
                    src={contestant.photo_url} 
                    alt={contestant.name}
                    className="w-full h-full object-cover"
                    loading="eager"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary to-muted">
                    <Users className="h-16 sm:h-20 lg:h-24 text-muted-foreground" />
                  </div>
                )}
                
                {/* Rank Badge - Desktop only (shown in stats row on mobile) */}
                {contestantRank <= 3 && (
                  <div 
                    className="absolute top-3 left-3 sm:top-4 sm:left-4 hidden lg:flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold shadow-lg"
                    style={{ 
                      backgroundColor: contestantRank === 1 ? '#FFD700' : contestantRank === 2 ? '#C0C0C0' : '#CD7F32',
                      color: '#1a1a1a'
                    }}
                  >
                    <Trophy className="h-3 w-3 sm:h-4 sm:w-4" />
                    #{contestantRank} Place
                  </div>
                )}

                {/* Favorite Button - Desktop only */}
                {user && (
                  <div className="absolute top-3 right-3 sm:top-4 sm:right-4 hidden lg:block">
                    <FavoriteButton contestantId={contestant.id} />
                  </div>
                )}

                {/* Gradient Overlay */}
                <div className="absolute inset-x-0 bottom-0 h-20 sm:h-32 bg-gradient-to-t from-black/60 to-transparent" />
                
                {/* Live Vote Badge */}
                {showVotePulse && (
                  <div className="absolute bottom-3 sm:bottom-4 left-3 right-3 sm:left-4 sm:right-4 flex items-center justify-center">
                    <Badge className="bg-primary text-primary-foreground animate-fade-in px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm">
                      <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 animate-pulse" />
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

          {/* Content Column */}
          <div className="lg:col-span-3 space-y-4 sm:space-y-6">
            {/* Desktop: Hero Section - Name & Contest (hidden on mobile, shown above) */}
            <div className="hidden lg:block space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link 
                  to={backLinkPath}
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
                
                {/* QR Thumbnail - Desktop */}
                <button
                  onClick={() => setIsQRModalOpen(true)}
                  className="group relative p-1 bg-white rounded-lg border border-border shadow-sm hover:shadow-md transition-all hover:scale-105 cursor-pointer"
                  title="Click to expand QR code"
                >
                  <QRCodeSVG value={contestantUrl} size={48} level="L" />
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
              <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md mx-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <QrCode className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    Share QR Code
                  </DialogTitle>
                  <DialogDescription className="text-sm">
                    Scan to vote for <span className="font-medium capitalize">{contestant.name}</span>
                  </DialogDescription>
                </DialogHeader>
                
                <div className="flex flex-col items-center gap-3 sm:gap-4 py-3 sm:py-4">
                  <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm border">
                    <QRCodeSVG 
                      value={contestantUrl} 
                      size={180}
                      level="H"
                      includeMargin
                      className="sm:w-[220px] sm:h-[220px]"
                    />
                  </div>
                  
                  <div className="flex gap-2 sm:gap-3 w-full">
                    <Button 
                      variant="outline" 
                      className="flex-1 h-10 sm:h-11 text-sm"
                      onClick={() => {
                        handleDownloadQR();
                        setIsQRModalOpen(false);
                      }}
                    >
                      <Download className="mr-1.5 sm:mr-2 h-4 w-4" />
                      Save
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 h-10 sm:h-11 text-sm"
                      onClick={() => {
                        handleShareQR();
                        setIsQRModalOpen(false);
                      }}
                    >
                      <Share2 className="mr-1.5 sm:mr-2 h-4 w-4" />
                      Share
                    </Button>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground text-xs sm:text-sm"
                    onClick={handleCopyLink}
                  >
                    <Copy className="mr-1.5 sm:mr-2 h-3 w-3" />
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
                  className="p-4 sm:p-6 text-center"
                  style={{ backgroundColor: `${primaryColor}10` }}
                >
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Total Votes</p>
                  <p 
                    className={`text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight ${showVotePulse ? 'animate-scale-in' : ''}`}
                    style={{ color: primaryColor }}
                  >
                    {contestant.vote_count.toLocaleString()}
                  </p>
                  {contestantRank > 0 && (
                    <Badge 
                      variant="secondary" 
                      className="mt-2 sm:mt-3 text-xs sm:text-base px-3 sm:px-4 py-0.5 sm:py-1"
                    >
                      <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      Rank #{contestantRank} of {contestants?.length || 0}
                    </Badge>
                  )}
                </div>
                
                {/* Progress to Leader */}
                {contestantRank > 1 && leaderVotes > 0 && (
                  <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-border/50">
                    <div className="flex justify-between text-xs sm:text-sm mb-2">
                      <span className="text-muted-foreground">Progress to #1</span>
                      <span className="font-medium">{Math.round(voteProgress)}%</span>
                    </div>
                    <Progress value={voteProgress} className="h-1.5 sm:h-2" />
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-1.5 sm:mt-2">
                      {(leaderVotes - contestant.vote_count).toLocaleString()} votes behind leader
                    </p>
                  </div>
                )}

                {/* Vote Price & Action */}
                <div className="p-4 sm:p-6 border-t border-border/50 bg-background">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Vote Price</p>
                      <CurrencyDisplay 
                        amount={Number(contest.vote_price)} 
                        currency={contestCurrency}
                        className="text-xl sm:text-2xl font-bold"
                      />
                    </div>
                    {!isEnded && (
                      <div className="text-right">
                        <p className="text-xs sm:text-sm text-muted-foreground flex items-center justify-end">
                          <Clock className="h-3 w-3 mr-1" />
                          Ends in
                        </p>
                        <CountdownTimer endDate={contest.end_date} className="text-xs sm:text-sm" />
                      </div>
                    )}
                  </div>
                  
                  {/* Desktop Vote Button */}
                  <Button 
                    size="lg" 
                    className="w-full text-base sm:text-lg h-12 sm:h-14 font-semibold hidden lg:flex"
                    onClick={handleVoteClick}
                    disabled={isVotingLocked}
                    style={{ 
                      backgroundColor: isVotingLocked ? undefined : primaryColor,
                      color: isVotingLocked ? undefined : 'white'
                    }}
                  >
                    <Vote className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    {isEnded ? 'Contest Ended' : hasNotStarted ? 'Voting Not Open Yet' : 'Vote Now'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Bio & Details - Consolidated */}
            {contestant.bio && (
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <h3 className="font-semibold text-base sm:text-lg mb-2 sm:mb-3">About {contestant.name}</h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{contestant.bio}</p>
                </CardContent>
              </Card>
            )}

            {/* Contest Period */}
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div 
                    className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl flex-shrink-0"
                    style={{ backgroundColor: `${primaryColor}15` }}
                  >
                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: primaryColor }} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm sm:text-base mb-0.5 sm:mb-1">Contest Period</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {format(new Date(contest.start_date), 'MMM d, yyyy')} — {format(new Date(contest.end_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Share Actions */}
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <Button
                variant="outline"
                onClick={handleCopyLink}
                className="flex-1 sm:flex-none h-9 sm:h-10 text-xs sm:text-sm"
              >
                <Copy className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Copy Link
              </Button>
              
              <ShareButtons 
                title={`Vote for ${contestant.name} in ${contest.title}`}
                description={contestant.bio || `Support ${contestant.name} by voting!`}
                url={contestantShareUrl}
                imageUrl={contestant.photo_url}
              />
            </div>
          </div>
        </div>

        {/* Other Contestants */}
        {contestants && contestants.length > 1 && (
          <div className="mt-10 sm:mt-12 lg:mt-16">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Other Contestants</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {contestants
                .filter((c: any) => c.id !== contestant.id)
                .slice(0, 6)
                .map((c: any) => (
                  <Link 
                    key={c.id}
                    to={contestSlug ? `/c/${contestSlug}/contestant/${createContestantSlug(c.name)}` : `/contests/${contestId}/contestant/${createContestantSlug(c.name)}`}
                    className="group"
                  >
                    <Card className="overflow-hidden hover:ring-2 hover:ring-primary/50 hover:shadow-lg transition-all duration-200 active:scale-[0.98]">
                      <div className="aspect-square bg-secondary relative overflow-hidden">
                        {c.photo_url ? (
                          <img 
                            src={c.photo_url} 
                            alt={c.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Users className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-2 sm:p-3">
                        <p className="font-medium text-xs sm:text-sm truncate capitalize">{c.name}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          {c.vote_count.toLocaleString()} votes
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
            </div>
            
            <div className="text-center mt-6 sm:mt-8">
              <Button variant="outline" size="default" className="sm:h-11" asChild>
                <Link to={backLinkPath}>
                  View All Contestants
                </Link>
              </Button>
            </div>
          </div>
        )}
      </main>

      <Footer />

      {/* Sticky Mobile Vote CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-3 sm:p-4 bg-background/95 backdrop-blur-sm border-t lg:hidden z-50 safe-area-inset-bottom">
        <div className="container mx-auto flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] sm:text-xs text-muted-foreground">Vote Price</p>
            <CurrencyDisplay 
              amount={Number(contest.vote_price)} 
              currency={contestCurrency}
              className="text-sm sm:text-base font-bold"
            />
          </div>
          <Button 
            size="default"
            className="px-6 sm:px-8 font-semibold h-10 sm:h-11 text-sm sm:text-base"
            onClick={handleVoteClick}
            disabled={isVotingLocked}
            style={{ 
              backgroundColor: isVotingLocked ? undefined : primaryColor,
              color: isVotingLocked ? undefined : 'white'
            }}
          >
            <Vote className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            {isEnded ? 'Ended' : hasNotStarted ? 'Not Open' : 'Vote Now'}
          </Button>
        </div>
      </div>

      {/* Vote Selection Dialog */}
      <Dialog open={isVoteSelectionOpen} onOpenChange={setIsVoteSelectionOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="capitalize text-base sm:text-lg">Vote for {contestant.name}</DialogTitle>
            <DialogDescription className="text-sm">
              Select the number of votes you want to cast
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-3 gap-2 py-3 sm:py-4">
            {normalizedVoteOptions.map((option) => (
              <Button
                key={option.vote_quantity}
                variant={voteQuantity === option.vote_quantity ? "default" : "outline"}
                onClick={() => setVoteQuantity(option.vote_quantity)}
                className="h-12 sm:h-16 text-base sm:text-lg font-semibold"
                style={voteQuantity === option.vote_quantity ? { backgroundColor: primaryColor } : undefined}
              >
                {option.vote_quantity}
              </Button>
            ))}
          </div>
          
          <div className="border-t pt-3 sm:pt-4 space-y-3 sm:space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Amount:</span>
              <CurrencyDisplay 
                amount={totalAmount} 
                currency={contestCurrency}
                className="text-xl sm:text-2xl font-bold"
              />
            </div>
            
            <div className="flex gap-2">
              {user && (
                <Button 
                  onClick={handleWalletPayment} 
                  className="flex-1 h-10 sm:h-11 text-sm"
                  variant="outline"
                  disabled={vote.isPending}
                >
                  <Wallet className="mr-1.5 sm:mr-2 h-4 w-4" />
                  Wallet
                </Button>
              )}
              <Button 
                onClick={handleProceedToPayment} 
                className="flex-1 h-10 sm:h-11 text-sm"
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
