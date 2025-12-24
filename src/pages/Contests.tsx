import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useContests } from '@/hooks/useContests';
import { Trophy, Search, Filter, Calendar, Vote, Heart } from 'lucide-react';
import { format } from 'date-fns';
import { useIsSaved, useToggleSave } from '@/hooks/useSavedItems';
import { useAuth } from '@/contexts/AuthContext';

const ContestCard = ({ contest }: { contest: any }) => {
  const { user } = useAuth();
  const { data: isSaved } = useIsSaved('contest', contest.id);
  const toggleSave = useToggleSave();

  const handleToggleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (user) {
      toggleSave.mutate({ itemType: 'contest', itemId: contest.id });
    }
  };

  const isEnded = new Date(contest.end_date) < new Date();
  const isStarted = new Date(contest.start_date) <= new Date();

  return (
    <Link to={`/contests/${contest.id}`}>
      <Card className="group hover:border-primary/50 transition-all duration-300 overflow-hidden">
        <div className="relative h-48 bg-secondary">
          {contest.image_url ? (
            <img 
              src={contest.image_url} 
              alt={contest.title} 
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" 
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <Trophy className="h-16 w-16 text-muted-foreground" />
            </div>
          )}
          <div className="absolute top-3 left-3">
            <Badge variant={contest.is_featured ? 'default' : 'secondary'}>
              {contest.category}
            </Badge>
          </div>
          {user && (
            <button 
              onClick={handleToggleSave}
              className="absolute top-3 right-3 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors"
            >
              <Heart className={`h-4 w-4 ${isSaved ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
            </button>
          )}
          {isEnded && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <Badge variant="destructive" className="text-lg px-4 py-2">Ended</Badge>
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {contest.title}
          </h3>
          {contest.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {contest.description}
            </p>
          )}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Vote className="h-4 w-4" />
              <span>{contest.total_votes.toLocaleString()} votes</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {isEnded ? 'Ended' : isStarted ? 'Ends' : 'Starts'} {format(new Date(isEnded || isStarted ? contest.end_date : contest.start_date), 'MMM d')}
              </span>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm font-medium text-primary">
              ₦{contest.vote_price} per vote
            </span>
            <Button size="sm">Vote Now</Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

const Contests = () => {
  const { data: contests, isLoading } = useContests();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const categories = contests 
    ? [...new Set(contests.map(c => c.category))]
    : [];

  const filteredContests = contests?.filter(contest => {
    const matchesSearch = contest.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          contest.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || contest.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contests</h1>
          <p className="text-muted-foreground">Browse and vote for your favorite contestants</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Contests Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredContests && filteredContests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContests.map((contest) => (
              <ContestCard key={contest.id} contest={contest} />
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">No contests found</h3>
            <p className="text-muted-foreground mt-1">
              {searchQuery || categoryFilter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Check back later for new contests'}
            </p>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Contests;
