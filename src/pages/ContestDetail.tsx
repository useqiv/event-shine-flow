import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useContest, useContestants, useVote, useMyContestVotes } from '@/hooks/useContests';
import { useContestCategories, ContestCategory } from '@/hooks/useContestCategories';
import { useRealtimeContestants, useRealtimeContest } from '@/hooks/useRealtimeContestants';

import { useWallet } from '@/hooks/useWallet';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useRecordConversion } from '@/hooks/useInfluencerTracking';
import { ShareButtons, ContestantShareButton } from '@/components/ui/share-buttons';
import { CountdownTimer } from '@/components/ui/countdown-timer';
import PaymentModal from '@/components/PaymentModal';
import { FavoriteButton } from '@/components/dashboard/FavoriteButton';
import confetti from 'canvas-confetti';
import { formatCurrency } from '@/components/ui/currency-selector';
import CurrencyDisplay from '@/components/ui/currency-display';
import LiveRatesIndicator from '@/components/ui/live-rates-indicator';
import { 
  Trophy, 
  Calendar, 
  Vote, 
  ArrowLeft, 
  User,
  Wallet,
  History,
  Clock,
  ChevronRight,
  Users,
} from 'lucide-react';
import { format } from 'date-fns';
import { useMemo } from 'react';

const voteOptions = [1, 5, 10, 25, 50, 100];

const ContestDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const voteForContestant = searchParams.get('vote');
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: contest, isLoading: contestLoading } = useContest(id || '');
  const { data: contestants, isLoading: contestantsLoading } = useContestants(id || '');
  const { data: contestCategories } = useContestCategories(id || '');
  const { data: myVotes, isLoading: myVotesLoading } = useMyContestVotes(id || '');
  const { data: wallet } = useWallet();
  const vote = useVote();
  const { recordConversion } = useRecordConversion();
  const contestantRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [highlightedContestant, setHighlightedContestant] = useState<string | null>(null);
  const [pulsingContestants, setPulsingContestants] = useState<Set<string>>(new Set());
  const previousLeaderRef = useRef<string | null>(null);
  

  // Category navigation state (for drill-down UX)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Payment modal state
  const [selectedContestant, setSelectedContestant] = useState<any>(null);
  const [voteQuantity, setVoteQuantity] = useState(1);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isVoteSelectionOpen, setIsVoteSelectionOpen] = useState(false);

  // Handle vote updates with pulse animation and confetti
  const handleVoteUpdate = useCallback((contestantId: string, newVoteCount: number, previousVoteCount: number) => {
    setPulsingContestants(prev => new Set(prev).add(contestantId));
    setTimeout(() => {
      setPulsingContestants(prev => {
        const next = new Set(prev);
        next.delete(contestantId);
        return next;
      });
    }, 1000);
  }, []);

  // Enable real-time updates for live leaderboard
  const { initializeVoteCounts } = useRealtimeContestants(id || '', handleVoteUpdate);
  useRealtimeContest(id || '');

  // Initialize vote counts and check for leader changes
  useEffect(() => {
    if (contestants && contestants.length > 0) {
      initializeVoteCounts(contestants);
      
      const currentLeader = contestants[0]?.id;
      if (previousLeaderRef.current && previousLeaderRef.current !== currentLeader) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
      previousLeaderRef.current = currentLeader;
    }
  }, [contestants, initializeVoteCounts]);

  // Brand colors with fallbacks
  const primaryColor = (contest as any)?.brand_primary_color || '#7c3aed';
  const secondaryColor = (contest as any)?.brand_secondary_color || '#f97316';
  const brandLogoUrl = (contest as any)?.brand_logo_url;
  
  // Generate CSS variables for branding
  const brandStyles = useMemo(() => ({
    '--brand-primary': primaryColor,
    '--brand-secondary': secondaryColor,
  } as React.CSSProperties), [primaryColor, secondaryColor]);

  const isEnded = contest && new Date(contest.end_date) < new Date();
  const totalAmount = contest ? voteQuantity * Number(contest.vote_price) : 0;

  // Group contestants by category
  const contestantsByCategory = useMemo(() => {
    if (!contestants) return { uncategorized: [] };
    
    const grouped: Record<string, any[]> = {};
    const uncategorized: any[] = [];
    
    contestants.forEach((contestant: any) => {
      if (contestant.category_id && contestCategories) {
        const category = contestCategories.find(c => c.id === contestant.category_id);
        if (category) {
          if (!grouped[category.id]) {
            grouped[category.id] = [];
          }
          grouped[category.id].push(contestant);
        } else {
          uncategorized.push(contestant);
        }
      } else {
        uncategorized.push(contestant);
      }
    });
    
    return { ...grouped, uncategorized };
  }, [contestants, contestCategories]);

  const hasCategories = contestCategories && contestCategories.length > 0 && 
    Object.keys(contestantsByCategory).some(key => key !== 'uncategorized' && contestantsByCategory[key].length > 0);

  // Get the selected category object
  const selectedCategory = selectedCategoryId 
    ? contestCategories?.find(c => c.id === selectedCategoryId) 
    : null;
  
  // Get contestants for selected category
  const selectedCategoryContestants = selectedCategoryId 
    ? (contestantsByCategory[selectedCategoryId] || [])
    : [];

  // Handle auto-scroll and highlight when vote parameter is present
  useEffect(() => {
    if (voteForContestant && contestants && contestants.length > 0) {
      const targetContestant = contestants.find((c: any) => c.id === voteForContestant);
      if (targetContestant) {
        setHighlightedContestant(voteForContestant);
        
        setTimeout(() => {
          const element = contestantRefs.current[voteForContestant];
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 300);

        setTimeout(() => {
          setHighlightedContestant(null);
        }, 3000);
      }
    }
  }, [voteForContestant, contestants]);

  const handleVoteClick = (contestant: any) => {
    setSelectedContestant(contestant);
    setVoteQuantity(1);
    setIsVoteSelectionOpen(true);
  };

  const handleProceedToPayment = () => {
    setIsVoteSelectionOpen(false);
    setIsPaymentModalOpen(true);
  };

  const handleWalletPayment = async () => {
    if (!selectedContestant || !contest) return;

    try {
      await vote.mutateAsync({
        contestantId: selectedContestant.id,
        contestId: contest.id,
        quantity: voteQuantity,
        amountPaid: totalAmount,
        paymentMethod: 'wallet',
      });

      if (totalAmount > 0) {
        await recordConversion(totalAmount);
      }

      toast({
        title: 'Vote Successful!',
        description: `You have cast ${voteQuantity} vote(s) for ${selectedContestant.name}.`,
      });

      setIsVoteSelectionOpen(false);
      setVoteQuantity(1);
    } catch (error: any) {
      toast({
        title: 'Vote Failed',
        description: error.message || 'An error occurred while voting.',
        variant: 'destructive',
      });
    }
  };

  if (contestLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="space-y-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-64 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-16 text-center">
          <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold">Contest not found</h2>
          <Link to="/contests">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Contests
            </Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={brandStyles}>
      
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 pt-24">
        <div className="space-y-6">
          {/* Back Button */}
          <Link to="/contests">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Contests
            </Button>
          </Link>

        {/* Contest Header */}
        <Card className="overflow-hidden">
          <div className="relative h-64 md:h-80 bg-secondary rounded-t-lg overflow-hidden">
            {contest.image_url ? (
              <img 
                src={contest.image_url} 
                alt={contest.title} 
                className="h-full w-full object-cover" 
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
                <Trophy className="h-24 w-24 text-white/80" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
            {/* Brand Logo */}
            {brandLogoUrl && (
              <div className="absolute top-4 left-4">
                <img 
                  src={brandLogoUrl} 
                  alt="Contest Logo" 
                  className="h-10 md:h-12 object-contain bg-background/80 backdrop-blur-sm rounded-lg px-3 py-2"
                />
              </div>
            )}
            <div className="absolute bottom-4 left-4 right-4">
              <Badge 
                className="mb-2" 
                style={{ backgroundColor: primaryColor, color: 'white' }}
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
                  <p className="text-xl font-bold">
                    <CurrencyDisplay 
                      amount={Number(contest.vote_price)} 
                      currency={contest.vote_currency || 'NGN'} 
                      size="md"
                      showBadge
                      showToggle
                    />
                  </p>
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
                url={`${window.location.origin}/contests/${id}`}
              />
            </div>
          {contest.description && (
              <p className="mt-4 text-muted-foreground">{contest.description}</p>
            )}
          </CardContent>
        </Card>


        {/* Contestants / Categories */}
        <div>
          {contestantsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-64 w-full" />
              ))}
            </div>
          ) : contestants && contestants.length > 0 ? (
            hasCategories ? (
              // Category-based drill-down navigation
              selectedCategoryId ? (
                // Show contestants in selected category
                <div>
                  <Button 
                    variant="ghost" 
                    onClick={() => setSelectedCategoryId(null)} 
                    className="mb-4"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Categories
                  </Button>
                  
                  <div className="mb-6">
                    <h2 className="text-xl font-bold" style={{ color: primaryColor }}>
                      {selectedCategory?.name}
                    </h2>
                    {selectedCategory?.description && (
                      <p className="text-muted-foreground mt-1">{selectedCategory.description}</p>
                    )}
                    <p className="text-sm text-muted-foreground mt-2">
                      {selectedCategoryContestants.length} contestant{selectedCategoryContestants.length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {selectedCategoryContestants.map((contestant: any, index: number) => (
                      <Card 
                        key={contestant.id} 
                        ref={(el) => { contestantRefs.current[contestant.id] = el; }}
                        className={`overflow-hidden transition-all duration-500 ${highlightedContestant === contestant.id ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-[1.02]' : ''} ${pulsingContestants.has(contestant.id) ? 'animate-pulse ring-2 ring-green-500 ring-offset-2 ring-offset-background' : ''}`}
                      >
                        <div className="relative h-48 bg-secondary">
                          {contestant.photo_url ? (
                            <img src={contestant.photo_url} alt={contestant.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <User className="h-16 w-16 text-muted-foreground" />
                            </div>
                          )}
                          {index < 3 && (
                            <div className="absolute top-2 left-2">
                              <Badge className={index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-amber-600'}>
                                #{index + 1}
                              </Badge>
                            </div>
                          )}
                        </div>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-lg">{contestant.name}</h3>
                            <div className="flex items-center gap-1">
                              <FavoriteButton contestantId={contestant.id} />
                              <ContestantShareButton 
                                contestId={id || ''} 
                                contestantId={contestant.id} 
                                contestantName={contestant.name} 
                                contestTitle={contest?.title || ''} 
                              />
                            </div>
                          </div>
                          {contestant.bio && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{contestant.bio}</p>
                          )}
                          <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                            <Vote className="h-4 w-4" />
                            <span>{contestant.is_public_votes ? `${contestant.vote_count.toLocaleString()} votes` : 'Votes hidden'}</span>
                          </div>
                          <Button 
                            className="w-full mt-4" 
                            onClick={() => handleVoteClick(contestant)} 
                            disabled={isEnded} 
                            style={!isEnded ? { backgroundColor: primaryColor, borderColor: primaryColor } : undefined}
                          >
                            {isEnded ? 'Voting Ended' : 'Vote Now'}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                // Show categories list
                <div>
                  <h2 className="text-xl font-bold mb-4">Select a Category</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {contestCategories?.map((category) => {
                      const categoryContestants = contestantsByCategory[category.id] || [];
                      if (categoryContestants.length === 0) return null;
                      
                      return (
                        <Card 
                          key={category.id} 
                          className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] overflow-hidden"
                          onClick={() => setSelectedCategoryId(category.id)}
                        >
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg" style={{ color: primaryColor }}>
                                  {category.name}
                                </h3>
                                {category.description && (
                                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                    {category.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                                  <Users className="h-4 w-4" />
                                  <span>{categoryContestants.length} contestant{categoryContestants.length !== 1 ? 's' : ''}</span>
                                </div>
                              </div>
                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                  
                  {/* Show uncategorized contestants if any */}
                  {contestantsByCategory.uncategorized.length > 0 && (
                    <div className="mt-8">
                      <h3 className="text-lg font-semibold mb-4">Other Contestants</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {contestantsByCategory.uncategorized.map((contestant: any, index: number) => (
                          <Card 
                            key={contestant.id} 
                            ref={(el) => { contestantRefs.current[contestant.id] = el; }}
                            className={`overflow-hidden transition-all duration-500 ${highlightedContestant === contestant.id ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-[1.02]' : ''} ${pulsingContestants.has(contestant.id) ? 'animate-pulse ring-2 ring-green-500 ring-offset-2 ring-offset-background' : ''}`}
                          >
                            <div className="relative h-48 bg-secondary">
                              {contestant.photo_url ? (
                                <img src={contestant.photo_url} alt={contestant.name} className="h-full w-full object-cover" />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center">
                                  <User className="h-16 w-16 text-muted-foreground" />
                                </div>
                              )}
                              {index < 3 && (
                                <div className="absolute top-2 left-2">
                                  <Badge className={index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-amber-600'}>
                                    #{index + 1}
                                  </Badge>
                                </div>
                              )}
                            </div>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="font-semibold text-lg">{contestant.name}</h3>
                                <div className="flex items-center gap-1">
                                  <FavoriteButton contestantId={contestant.id} />
                                  <ContestantShareButton 
                                    contestId={id || ''} 
                                    contestantId={contestant.id} 
                                    contestantName={contestant.name} 
                                    contestTitle={contest?.title || ''} 
                                  />
                                </div>
                              </div>
                              {contestant.bio && (
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{contestant.bio}</p>
                              )}
                              <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                                <Vote className="h-4 w-4" />
                                <span>{contestant.is_public_votes ? `${contestant.vote_count.toLocaleString()} votes` : 'Votes hidden'}</span>
                              </div>
                              <Button 
                                className="w-full mt-4" 
                                onClick={() => handleVoteClick(contestant)} 
                                disabled={isEnded} 
                                style={!isEnded ? { backgroundColor: primaryColor, borderColor: primaryColor } : undefined}
                              >
                                {isEnded ? 'Voting Ended' : 'Vote Now'}
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            ) : (
              // No categories - show all contestants directly
              <div>
                <h2 className="text-xl font-bold mb-4">Contestants</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {contestants.map((contestant, index) => (
                    <Card 
                      key={contestant.id} 
                      ref={(el) => { contestantRefs.current[contestant.id] = el; }}
                      className={`overflow-hidden transition-all duration-500 ${highlightedContestant === contestant.id ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-[1.02]' : ''} ${pulsingContestants.has(contestant.id) ? 'animate-pulse ring-2 ring-green-500 ring-offset-2 ring-offset-background' : ''}`}
                    >
                      <div className="relative h-48 bg-secondary">
                        {contestant.photo_url ? (
                          <img src={contestant.photo_url} alt={contestant.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <User className="h-16 w-16 text-muted-foreground" />
                          </div>
                        )}
                        {index < 3 && (
                          <div className="absolute top-2 left-2">
                            <Badge className={index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-amber-600'}>
                              #{index + 1}
                            </Badge>
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-lg">{contestant.name}</h3>
                          <div className="flex items-center gap-1">
                            <FavoriteButton contestantId={contestant.id} />
                            <ContestantShareButton 
                              contestId={id || ''} 
                              contestantId={contestant.id} 
                              contestantName={contestant.name} 
                              contestTitle={contest?.title || ''} 
                            />
                          </div>
                        </div>
                        {contestant.bio && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{contestant.bio}</p>
                        )}
                        <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                          <Vote className="h-4 w-4" />
                          <span>{contestant.is_public_votes ? `${contestant.vote_count.toLocaleString()} votes` : 'Votes hidden'}</span>
                        </div>
                        <Button 
                          className="w-full mt-4" 
                          onClick={() => handleVoteClick(contestant)} 
                          disabled={isEnded} 
                          style={!isEnded ? { backgroundColor: primaryColor, borderColor: primaryColor } : undefined}
                        >
                          {isEnded ? 'Voting Ended' : 'Vote Now'}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )
          ) : (
            <Card className="p-8 text-center">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No contestants yet</p>
            </Card>
          )}
        </div>

        {/* Voting History - Only show for logged in users */}
        {user && (
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <History className="h-5 w-5" />
              Your Voting History
            </h2>
            {myVotesLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : myVotes && myVotes.length > 0 ? (
              <div className="space-y-4">
                {/* Summary Stats Card */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="p-4">
                    <p className="text-sm text-muted-foreground">Total Votes Cast</p>
                    <p className="text-2xl font-bold">
                      {myVotes.reduce((sum: number, v: any) => sum + v.quantity, 0).toLocaleString()}
                    </p>
                  </Card>
                  <Card className="p-4">
                    <p className="text-sm text-muted-foreground">Total Spent</p>
                    <p className="text-2xl font-bold">
                      <CurrencyDisplay 
                        amount={myVotes.reduce((sum: number, v: any) => sum + Number(v.amount_paid), 0)} 
                        currency={contest.vote_currency || 'NGN'} 
                        size="lg"
                        showBadge
                        showToggle
                      />
                    </p>
                  </Card>
                  <Card className="p-4">
                    <p className="text-sm text-muted-foreground">Transactions</p>
                    <p className="text-2xl font-bold">{myVotes.length}</p>
                  </Card>
                  <Card className="p-4">
                    <p className="text-sm text-muted-foreground">Contestants Voted</p>
                    <p className="text-2xl font-bold">
                      {new Set(myVotes.map((v: any) => v.contestant_id)).size}
                    </p>
                  </Card>
                </div>

                {/* Vote History List */}
                <Card>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {myVotes.map((vote: any) => (
                      <div key={vote.id} className="flex items-center gap-4 p-4">
                        <div className="h-12 w-12 rounded-full bg-secondary overflow-hidden flex-shrink-0">
                          {vote.contestant?.photo_url ? (
                            <img 
                              src={vote.contestant.photo_url} 
                              alt={vote.contestant.name} 
                              className="h-full w-full object-cover" 
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <User className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {vote.contestant?.name || 'Unknown Contestant'}
                          </p>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Vote className="h-3.5 w-3.5" />
                              {vote.quantity} {vote.quantity === 1 ? 'vote' : 'votes'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {format(new Date(vote.created_at), 'MMM d, yyyy h:mm a')}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            <CurrencyDisplay amount={Number(vote.amount_paid)} currency={contest.vote_currency || 'NGN'} size="sm" />
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {vote.payment_method}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              </div>
            ) : (
              <Card className="p-6 text-center">
                <Vote className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">You haven't voted in this contest yet</p>
                <p className="text-sm text-muted-foreground mt-1">Cast your first vote above!</p>
              </Card>
            )}
          </div>
        )}
        </div>
      {isVoteSelectionOpen && selectedContestant && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Vote for {selectedContestant.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Vote Quantity */}
              <div>
                <p className="text-sm font-medium mb-2">Number of Votes</p>
                <div className="grid grid-cols-3 gap-2">
                  {voteOptions.map((option) => (
                    <Button
                      key={option}
                      variant={voteQuantity === option ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setVoteQuantity(option)}
                    >
                      {option} {option === 1 ? 'vote' : 'votes'}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="p-4 rounded-lg bg-secondary">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Amount</span>
                  <span className="text-xl font-bold">
                    <CurrencyDisplay amount={totalAmount} currency={contest.vote_currency || 'NGN'} size="lg" />
                  </span>
                </div>
              </div>

              {/* Wallet Balance - Only show for logged in users */}
              {user && (
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    <span className="text-sm">Wallet Balance</span>
                  </div>
                  <span className="font-medium">{formatCurrency(wallet?.balance || 0, contest.vote_currency || 'NGN')}</span>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3">
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setIsVoteSelectionOpen(false)} className="flex-1">
                    Cancel
                  </Button>
                  {user && wallet && wallet.balance >= totalAmount && (
                    <Button onClick={handleWalletPayment} disabled={vote.isPending} className="flex-1">
                      {vote.isPending ? 'Processing...' : 'Pay with Wallet'}
                    </Button>
                  )}
                </div>
                <Button 
                  variant={user && wallet && wallet.balance >= totalAmount ? 'outline' : 'default'} 
                  onClick={handleProceedToPayment} 
                  className="w-full"
                >
                  Pay with Card/Bank/Crypto
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payment Modal for external payments */}
      {selectedContestant && contest && (
        <PaymentModal
          open={isPaymentModalOpen}
          onOpenChange={setIsPaymentModalOpen}
          type="vote"
          amount={totalAmount}
          currency={(contest as any).vote_currency || 'NGN'}
          itemDetails={{
            contest_id: contest.id,
            contestant_id: selectedContestant.id,
            vote_quantity: voteQuantity,
            name: selectedContestant.name,
          }}
        />
      )}
      </main>
      <Footer />
    </div>
  );
};

export default ContestDetail;
