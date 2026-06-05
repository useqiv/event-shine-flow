import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useReferralLeaderboard } from '@/hooks/useReferralLeaderboard';
import { useWallet } from '@/hooks/useWallet';
import { useAuth } from '@/contexts/AuthContext';
import { Trophy, Medal, Award, Users, Gift, Crown } from 'lucide-react';
import ReferralCard from '@/components/ReferralCard';

const ReferralLeaderboard = () => {
  const { data: leaderboard, isLoading } = useReferralLeaderboard(20);
  const { data: wallet } = useWallet();
  const { user } = useAuth();

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 2:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      case 3:
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      default:
        return '';
    }
  };

  // Find user's rank
  const userRank = leaderboard?.findIndex(entry => entry.user_id === user?.id);
  const userEntry = userRank !== undefined && userRank >= 0 ? leaderboard?.[userRank] : null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Trophy className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Referral Leaderboard</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Leaderboard */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Top Referrers
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : leaderboard && leaderboard.length > 0 ? (
                  <div className="space-y-3">
                    {leaderboard.map((entry, index) => {
                      const rank = index + 1;
                      const isCurrentUser = entry.user_id === user?.id;
                      
                      return (
                        <div
                          key={entry.user_id}
                          className={`flex items-center gap-4 p-4 rounded-lg transition-colors ${
                            rank <= 3 
                              ? getRankBadge(rank) 
                              : 'bg-secondary/30'
                          } ${isCurrentUser ? 'ring-2 ring-primary' : ''}`}
                        >
                          {/* Rank */}
                          <div className="w-10 flex justify-center">
                            {getRankIcon(rank)}
                          </div>

                          {/* Avatar */}
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={entry.avatar_url || ''} />
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {entry.display_name?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">
                              {entry.display_name}
                              {isCurrentUser && (
                                <Badge variant="outline" className="ml-2 text-xs">You</Badge>
                              )}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {entry.referral_count} referral{entry.referral_count !== 1 ? 's' : ''}
                            </p>
                          </div>

                          {/* Earnings */}
                          <div className="text-right">
                            <p className="font-bold text-primary">
                              ₦{entry.total_earnings.toLocaleString()}
                            </p>
                            <p className="text-xs text-muted-foreground">earned</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No referrals yet</h3>
                    <p className="text-muted-foreground">
                      Be the first to refer friends and earn rewards!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Your Stats */}
            {user && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Your Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Your Rank</span>
                    <span className="font-bold">
                      {userEntry ? `#${(userRank ?? 0) + 1}` : 'Not ranked'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Referrals</span>
                    <span className="font-bold">{userEntry?.referral_count || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total Earnings</span>
                    <span className="font-bold text-primary">
                      ₦{(wallet?.referral_earnings || 0).toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Referral Card */}
            <ReferralCard />

            {/* How it works */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Gift className="h-5 w-5 text-accent" />
                  How It Works
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3 text-sm">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">1</span>
                    <span className="text-muted-foreground">Share your unique referral link with friends</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">2</span>
                    <span className="text-muted-foreground">They sign up using your link</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">3</span>
                    <span className="text-muted-foreground">They join USEQIV and start exploring events and contests</span>
                  </li>
                </ol>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ReferralLeaderboard;
