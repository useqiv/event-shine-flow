import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useFavoriteContestants, useToggleFavorite } from '@/hooks/useFavoriteContestants';
import { Heart, Trophy, Vote, Calendar, ArrowRight, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, isAfter } from 'date-fns';

const FavoriteContestants = () => {
  const { data: favorites, isLoading } = useFavoriteContestants();
  const { mutate: toggleFavorite, isPending } = useToggleFavorite();

  const handleRemove = (contestantId: string) => {
    toggleFavorite({ contestantId, isFavorite: true });
  };

  // Separate active and past contests
  const activeFavorites = favorites?.filter(
    (f) => f.contestant?.contest?.is_active && 
           isAfter(new Date(f.contestant?.contest?.end_date || ''), new Date())
  ) || [];

  const pastFavorites = favorites?.filter(
    (f) => !f.contestant?.contest?.is_active || 
           !isAfter(new Date(f.contestant?.contest?.end_date || ''), new Date())
  ) || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Heart className="h-6 w-6 text-red-500" />
            Favorite Contestants
          </h1>
          <p className="text-muted-foreground">
            Keep track of your favorite contestants across all contests
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : favorites && favorites.length > 0 ? (
          <div className="space-y-8">
            {/* Active Contests */}
            {activeFavorites.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  In Active Contests ({activeFavorites.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeFavorites.map((favorite) => (
                    <Card key={favorite.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="relative">
                        {favorite.contestant?.photo_url ? (
                          <img
                            src={favorite.contestant.photo_url}
                            alt={favorite.contestant.name}
                            className="w-full h-40 object-cover"
                          />
                        ) : (
                          <div className="w-full h-40 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                            <Trophy className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8"
                          onClick={() => handleRemove(favorite.contestant_id)}
                          disabled={isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Badge className="absolute bottom-2 left-2 bg-green-500">
                          Active
                        </Badge>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold truncate">{favorite.contestant?.name}</h3>
                        <p className="text-sm text-muted-foreground truncate mb-2">
                          {favorite.contestant?.contest?.title}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-sm">
                            <Vote className="h-4 w-4 text-primary" />
                            <span>{favorite.contestant?.vote_count?.toLocaleString()} votes</span>
                          </div>
                          <Link to={`/contests/${favorite.contestant?.contest_id}?vote=${favorite.contestant_id}`}>
                            <Button size="sm" variant="default">
                              Vote Now
                              <ArrowRight className="h-4 w-4 ml-1" />
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Past Contests */}
            {pastFavorites.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  Past Contests ({pastFavorites.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pastFavorites.map((favorite) => (
                    <Card key={favorite.id} className="overflow-hidden opacity-75">
                      <div className="relative">
                        {favorite.contestant?.photo_url ? (
                          <img
                            src={favorite.contestant.photo_url}
                            alt={favorite.contestant.name}
                            className="w-full h-40 object-cover grayscale"
                          />
                        ) : (
                          <div className="w-full h-40 bg-secondary flex items-center justify-center">
                            <Trophy className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8 bg-background/80"
                          onClick={() => handleRemove(favorite.contestant_id)}
                          disabled={isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Badge variant="secondary" className="absolute bottom-2 left-2">
                          Ended
                        </Badge>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold truncate">{favorite.contestant?.name}</h3>
                        <p className="text-sm text-muted-foreground truncate mb-2">
                          {favorite.contestant?.contest?.title}
                        </p>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Vote className="h-4 w-4" />
                          <span>Final: {favorite.contestant?.vote_count?.toLocaleString()} votes</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">No favorites yet</h3>
            <p className="text-muted-foreground mb-4">
              Browse contests and tap the heart icon to add contestants to your favorites
            </p>
            <Link to="/contests">
              <Button>
                Browse Contests
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default FavoriteContestants;
