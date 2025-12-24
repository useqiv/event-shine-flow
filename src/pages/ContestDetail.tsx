import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useContest, useContestants, useVote } from '@/hooks/useContests';
import { useRealtimeVotes } from '@/hooks/useRealtimeVotes';
import LiveVoteIndicator, { VotePulse, LiveVoteCounter } from '@/components/LiveVoteIndicator';
import { useWallet } from '@/hooks/useWallet';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Trophy, 
  Calendar, 
  Vote, 
  ArrowLeft, 
  User,
  Wallet,
  CreditCard,
  Building2,
  Coins
} from 'lucide-react';
import { format } from 'date-fns';

const voteOptions = [1, 5, 10, 25, 50, 100];

const ContestDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: contest, isLoading: contestLoading } = useContest(id || '');
  const { data: contestants, isLoading: contestantsLoading } = useContestants(id || '');
  const { data: wallet } = useWallet();
  const vote = useVote();

  // Enable real-time vote updates
  const { lastVoteEvent, clearVoteEvent, isContestantUpdated } = useRealtimeVotes(id);

  const [selectedContestant, setSelectedContestant] = useState<any>(null);
  const [voteQuantity, setVoteQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'card' | 'bank_transfer' | 'usdt'>('wallet');
  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);

  const isEnded = contest && new Date(contest.end_date) < new Date();
  const totalAmount = contest ? voteQuantity * Number(contest.vote_price) : 0;
  const hasInsufficientBalance = paymentMethod === 'wallet' && (wallet?.balance || 0) < totalAmount;

  const handleVoteClick = (contestant: any) => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please login to vote for a contestant.',
        variant: 'destructive',
      });
      return;
    }
    setSelectedContestant(contestant);
    setIsVoteModalOpen(true);
  };

  const handleVoteSubmit = async () => {
    if (!selectedContestant || !contest) return;

    try {
      await vote.mutateAsync({
        contestantId: selectedContestant.id,
        contestId: contest.id,
        quantity: voteQuantity,
        amountPaid: totalAmount,
        paymentMethod,
      });

      toast({
        title: 'Vote Successful!',
        description: `You have cast ${voteQuantity} vote(s) for ${selectedContestant.name}.`,
      });

      setIsVoteModalOpen(false);
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
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!contest) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold">Contest not found</h2>
          <Link to="/contests">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Contests
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Back Button */}
        <Link to="/contests">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Contests
          </Button>
        </Link>

        {/* Contest Header */}
        <Card>
          <div className="relative h-64 md:h-80 bg-secondary rounded-t-lg overflow-hidden">
            {contest.image_url ? (
              <img 
                src={contest.image_url} 
                alt={contest.title} 
                className="h-full w-full object-cover" 
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <Trophy className="h-24 w-24 text-muted-foreground" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <Badge className="mb-2">{contest.category}</Badge>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">{contest.title}</h1>
            </div>
            {isEnded && (
              <div className="absolute top-4 right-4">
                <Badge variant="destructive" className="text-lg px-4 py-2">Ended</Badge>
              </div>
            )}
          </div>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Votes</p>
                <p className="text-xl font-bold">{contest.total_votes.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vote Price</p>
                <p className="text-xl font-bold">₦{Number(contest.vote_price).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Start Date</p>
                <p className="text-xl font-bold">{format(new Date(contest.start_date), 'MMM d')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">End Date</p>
                <p className="text-xl font-bold">{format(new Date(contest.end_date), 'MMM d')}</p>
              </div>
            </div>
            {contest.description && (
              <p className="mt-4 text-muted-foreground">{contest.description}</p>
            )}
          </CardContent>
        </Card>

        {/* Contestants */}
        <div>
          <h2 className="text-xl font-bold mb-4">Contestants</h2>
          {contestantsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-64 w-full" />
              ))}
            </div>
          ) : contestants && contestants.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {contestants.map((contestant, index) => (
                <VotePulse key={contestant.id} isActive={isContestantUpdated(contestant.id)}>
                  <Card className="overflow-hidden h-full">
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
                          <Badge className={index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-amber-600'}>
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
                            ? <><LiveVoteCounter count={contestant.vote_count} isUpdating={isContestantUpdated(contestant.id)} /> votes</>
                            : 'Votes hidden'}
                        </span>
                      </div>
                      <Button 
                        className="w-full mt-4" 
                        onClick={() => handleVoteClick(contestant)}
                        disabled={isEnded}
                      >
                        {isEnded ? 'Voting Ended' : 'Vote Now'}
                      </Button>
                    </CardContent>
                  </Card>
                </VotePulse>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No contestants yet</p>
            </Card>
          )}
        </div>
      </div>

      {/* Vote Modal */}
      <Dialog open={isVoteModalOpen} onOpenChange={setIsVoteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Vote for {selectedContestant?.name}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Vote Quantity */}
            <div>
              <Label className="text-sm font-medium">Number of Votes</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
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

            {/* Payment Method */}
            <div>
              <Label className="text-sm font-medium">Payment Method</Label>
              <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)} className="mt-2 space-y-2">
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-secondary/50 cursor-pointer">
                  <RadioGroupItem value="wallet" id="wallet" />
                  <Label htmlFor="wallet" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Wallet className="h-4 w-4" />
                    Wallet (₦{wallet?.balance?.toLocaleString() || '0'})
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-secondary/50 cursor-pointer">
                  <RadioGroupItem value="card" id="card" />
                  <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer flex-1">
                    <CreditCard className="h-4 w-4" />
                    Card Payment
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-secondary/50 cursor-pointer">
                  <RadioGroupItem value="bank_transfer" id="bank" />
                  <Label htmlFor="bank" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Building2 className="h-4 w-4" />
                    Bank Transfer
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-secondary/50 cursor-pointer">
                  <RadioGroupItem value="usdt" id="usdt" />
                  <Label htmlFor="usdt" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Coins className="h-4 w-4" />
                    USDT
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Total */}
            <div className="p-4 rounded-lg bg-secondary">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Amount</span>
                <span className="text-xl font-bold">₦{totalAmount.toLocaleString()}</span>
              </div>
            </div>

            {hasInsufficientBalance && (
              <p className="text-sm text-destructive">
                Insufficient wallet balance. Please fund your wallet or choose another payment method.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVoteModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleVoteSubmit} 
              disabled={vote.isPending || hasInsufficientBalance}
            >
              {vote.isPending ? 'Processing...' : 'Confirm Vote'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Live Vote Indicator */}
      <LiveVoteIndicator voteEvent={lastVoteEvent} onDismiss={clearVoteEvent} />
    </DashboardLayout>
  );
};

export default ContestDetail;
