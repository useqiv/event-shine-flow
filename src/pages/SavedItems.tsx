import React from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSavedContests, useSavedEvents, useToggleSave } from '@/hooks/useSavedItems';
import { Heart, Calendar, MapPin, Vote, Trophy, Bookmark } from 'lucide-react';
import { format } from 'date-fns';

const SavedItems = () => {
  const { data: savedContests, isLoading: contestsLoading } = useSavedContests();
  const { data: savedEvents, isLoading: eventsLoading } = useSavedEvents();
  const toggleSave = useToggleSave();

  const handleUnsave = (type: 'contest' | 'event', id: string) => {
    toggleSave.mutate({ itemType: type, itemId: id });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Bookmark className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Saved Items</h1>
        </div>

        <Tabs defaultValue="contests" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="contests" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Contests ({savedContests?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Events ({savedEvents?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="contests" className="mt-6">
            {contestsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-64 w-full rounded-lg" />
                ))}
              </div>
            ) : savedContests && savedContests.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedContests.map((contest: any) => {
                  return (
                    <Card key={contest.id} className="overflow-hidden group">
                      <div className="relative aspect-video">
                        <img
                          src={contest.image_url || '/placeholder.svg'}
                          alt={contest.title}
                          className="w-full h-full object-cover"
                        />
                        {isEnded && (
                          <Badge className="absolute top-2 left-2 bg-destructive">Ended</Badge>
                        )}
                        <Button
                          variant="secondary"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8"
                          onClick={() => handleUnsave('contest', contest.id)}
                        >
                          <Heart className="h-4 w-4 fill-destructive text-destructive" />
                        </Button>
                      </div>
                      <CardContent className="p-4">
                        <Badge variant="outline" className="mb-2">{contest.category}</Badge>
                        <h3 className="font-semibold line-clamp-1">{contest.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {contest.description}
                        </p>
                        <div className="flex items-center justify-end mt-4">
                          <Button asChild size="sm">
                            <Link to={`/contests/${contest.id}`}>
                              Vote Now
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No saved contests</h3>
                <p className="text-muted-foreground mb-4">
                  Save contests you're interested in to find them here
                </p>
                <Button asChild>
                  <Link to="/contests">Browse Contests</Link>
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="events" className="mt-6">
            {eventsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-64 w-full rounded-lg" />
                ))}
              </div>
            ) : savedEvents && savedEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedEvents.map((event: any) => {
                  return (
                    <Card key={event.id} className="overflow-hidden group">
                      <div className="relative aspect-video">
                        <img
                          src={event.image_url || '/placeholder.svg'}
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                        
                        <Button
                          variant="secondary"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8"
                          onClick={() => handleUnsave('event', event.id)}
                        >
                          <Heart className="h-4 w-4 fill-destructive text-destructive" />
                        </Button>
                      </div>
                      <CardContent className="p-4">
                        <Badge variant="outline" className="mb-2">{event.category}</Badge>
                        <h3 className="font-semibold line-clamp-1">{event.title}</h3>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(event.event_date), 'MMM d, yyyy • h:mm a')}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <MapPin className="h-4 w-4" />
                          <span className="line-clamp-1">{event.venue}</span>
                        </div>
                        <div className="flex justify-end mt-4">
                          <Button asChild size="sm">
                            <Link to={`/events/${event.id}`}>
                              {isPast ? 'View Details' : 'Get Tickets'}
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No saved events</h3>
                <p className="text-muted-foreground mb-4">
                  Save events you're interested in to find them here
                </p>
                <Button asChild>
                  <Link to="/events">Browse Events</Link>
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default SavedItems;
