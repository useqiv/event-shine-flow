import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useFavoriteContestantsQuickView } from '@/hooks/useFavoriteContestantsQuickView';
import { Heart, Trophy, TrendingUp, ArrowRight, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

export const FavoriteContestantsQuickView = () => {
  const { data: favorites, isLoading } = useFavoriteContestantsQuickView();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Heart className="h-5 w-5 text-destructive" />
            Your Favorites
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-12" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!favorites || favorites.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Heart className="h-5 w-5 text-destructive" />
            Your Favorites
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Heart className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-3">
              No favorite contestants yet
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/contests')}
            >
              Browse Contests
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getRankBadgeVariant = (rank: number) => {
    if (rank === 1) return 'default';
    if (rank <= 3) return 'secondary';
    return 'outline';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Heart className="h-5 w-5 text-destructive" />
          Your Favorites
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {favorites.slice(0, 4).map((fav) => {
          const isActive = fav.contestant.contest.is_active && 
            new Date(fav.contestant.contest.end_date) > new Date();
          
          return (
            <div
              key={fav.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors"
              onClick={() => navigate(`/contests/${fav.contestant.contest.id}`)}
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={fav.contestant.photo_url || undefined} />
                <AvatarFallback>
                  {fav.contestant.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">
                    {fav.contestant.name}
                  </p>
                  {isActive && (
                    <span className="flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {fav.contestant.contest.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {fav.contestant.vote_count.toLocaleString()} votes
                  </span>
                  {!isActive && (
                    <Badge variant="outline" className="text-xs py-0 px-1">
                      <Clock className="h-2.5 w-2.5 mr-0.5" />
                      Ended
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-1">
                <Badge variant={getRankBadgeVariant(fav.rank)} className="text-xs">
                  {getRankIcon(fav.rank)}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  of {fav.totalContestants}
                </span>
              </div>
            </div>
          );
        })}

        {favorites.length > 4 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => navigate('/dashboard/favorites')}
          >
            View All ({favorites.length})
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
