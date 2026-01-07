import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Trophy, User, Vote, Search } from 'lucide-react';
import { filterContestants } from '@/components/ContestantFilter';

const EmbedLeaderboard = () => {
  const { contestId } = useParams<{ contestId: string }>();

  // Fetch contest
  const { data: contest, isLoading: contestLoading } = useQuery({
    queryKey: ['embed-contest', contestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contests')
        .select('*')
        .eq('id', contestId)
        .eq('is_active', true)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!contestId,
  });

  // Fetch contestants
  const { data: contestants, isLoading: contestantsLoading } = useQuery({
    queryKey: ['embed-contestants', contestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contestants')
        .select('*')
        .eq('contest_id', contestId!)
        .order('vote_count', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    enabled: !!contestId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const primaryColor = contest?.brand_primary_color || '#7c3aed';
  const secondaryColor = contest?.brand_secondary_color || '#f97316';

  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredContestants = useMemo(() => {
    return filterContestants(contestants || [], searchTerm);
  }, [contestants, searchTerm]);

  if (contestLoading || contestantsLoading) {
    return (
      <div className="p-4 space-y-3">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="flex items-center justify-center h-full p-8 text-center">
        <div>
          <Trophy className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">Contest not found or inactive</p>
        </div>
      </div>
    );
  }

  const maxVotes = contestants?.[0]?.vote_count || 1;

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Header */}
      <div 
        className="rounded-lg p-4 mb-4 text-white"
        style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
      >
        <div className="flex items-center gap-2 mb-1">
          {contest.brand_logo_url ? (
            <img src={contest.brand_logo_url} alt="Logo" className="h-6 object-contain" />
          ) : (
            <Trophy className="h-5 w-5" />
          )}
          <h1 className="font-bold text-lg">{contest.title}</h1>
        </div>
        <p className="text-sm opacity-90">Live Leaderboard</p>
      </div>

      {/* Search */}
      {contestants && contestants.length > 3 && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name, state, country..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-9 text-sm"
          />
        </div>
      )}

      {/* Leaderboard */}
      <div className="space-y-2">
        {filteredContestants && filteredContestants.length > 0 ? (
          filteredContestants.map((contestant, index) => {
            const percentage = (contestant.vote_count / maxVotes) * 100;
            const isTop3 = index < 3;
            
            return (
              <div 
                key={contestant.id} 
                className="relative bg-card border rounded-lg p-3 overflow-hidden"
              >
                {/* Progress bar background */}
                <div 
                  className="absolute inset-0 opacity-10"
                  style={{ 
                    width: `${percentage}%`, 
                    backgroundColor: primaryColor 
                  }}
                />
                
                <div className="relative flex items-center gap-3">
                  {/* Rank */}
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      isTop3 ? 'text-white' : 'bg-muted text-muted-foreground'
                    }`}
                    style={isTop3 ? { 
                      backgroundColor: index === 0 ? '#eab308' : index === 1 ? '#9ca3af' : '#b45309' 
                    } : {}}
                  >
                    {index + 1}
                  </div>
                  
                  {/* Photo */}
                  <div className="w-10 h-10 rounded-full bg-muted overflow-hidden flex-shrink-0">
                    {contestant.photo_url ? (
                      <img 
                        src={contestant.photo_url} 
                        alt={contestant.name} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  
                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{contestant.name}</p>
                  </div>
                  
                  {/* Votes */}
                  <div className="flex items-center gap-1 text-sm font-semibold" style={{ color: primaryColor }}>
                    <Vote className="h-4 w-4" />
                    {contestant.is_public_votes 
                      ? contestant.vote_count.toLocaleString()
                      : '---'}
                  </div>
                </div>
              </div>
            );
          })
        ) : contestants && contestants.length > 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <User className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No contestants match "{searchTerm}"</p>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <User className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>No contestants yet</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t text-center">
        <a 
          href={`${window.location.origin}/c/${contest.custom_slug || contest.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium hover:underline"
          style={{ color: primaryColor }}
        >
          Vote Now on Useqiv →
        </a>
      </div>
    </div>
  );
};

export default EmbedLeaderboard;
