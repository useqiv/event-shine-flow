import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useContests } from '@/hooks/useContests';
import { useEvents } from '@/hooks/useEvents';
import { Search, Trophy, Calendar, X } from 'lucide-react';
import { format } from 'date-fns';

export const DashboardSearch = () => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const { data: contests } = useContests();
  const { data: events } = useEvents();

  const searchResults = useMemo(() => {
    if (!query.trim()) return { contests: [], events: [] };

    const searchTerm = query.toLowerCase();

    const matchedContests = contests?.filter(
      (contest) =>
        contest.title.toLowerCase().includes(searchTerm) ||
        contest.category.toLowerCase().includes(searchTerm) ||
        contest.description?.toLowerCase().includes(searchTerm)
    ).slice(0, 3) || [];

    const matchedEvents = events?.filter(
      (event) =>
        event.title.toLowerCase().includes(searchTerm) ||
        event.category.toLowerCase().includes(searchTerm) ||
        event.venue.toLowerCase().includes(searchTerm) ||
        event.description?.toLowerCase().includes(searchTerm)
    ).slice(0, 3) || [];

    return { contests: matchedContests, events: matchedEvents };
  }, [query, contests, events]);

  const hasResults = searchResults.contests.length > 0 || searchResults.events.length > 0;
  const showDropdown = isFocused && query.trim().length > 0;

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search contests, events..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          className="pl-10 pr-10"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {showDropdown && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 shadow-lg">
          <CardContent className="p-2 max-h-80 overflow-y-auto">
            {hasResults ? (
              <div className="space-y-4">
                {searchResults.contests.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground px-2 mb-1">CONTESTS</p>
                    <div className="space-y-1">
                      {searchResults.contests.map((contest) => (
                        <Link
                          key={contest.id}
                          to={`/contests/${contest.id}`}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary transition-colors"
                        >
                          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Trophy className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{contest.title}</p>
                            <p className="text-xs text-muted-foreground">{contest.total_votes.toLocaleString()} votes</p>
                          </div>
                          <Badge variant="secondary" className="text-xs">{contest.category}</Badge>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {searchResults.events.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground px-2 mb-1">EVENTS</p>
                    <div className="space-y-1">
                      {searchResults.events.map((event) => (
                        <Link
                          key={event.id}
                          to={`/events/${event.id}`}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary transition-colors"
                        >
                          <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                            <Calendar className="h-4 w-4 text-accent" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{event.title}</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(event.event_date), 'MMM d, yyyy')}</p>
                          </div>
                          <Badge variant="secondary" className="text-xs">{event.category}</Badge>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <Search className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No results found for "{query}"</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
