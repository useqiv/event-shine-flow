import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, User, ExternalLink, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { getContestVotingStatus } from '@/lib/contestVoting';
import { ContestantVoteDisplay } from '@/components/contest/ContestantVoteDisplay';
import { normalizeVoteDisplayMode } from '@/lib/voteDisplay';

const EmbedContest = () => {
  const { contestId } = useParams<{ contestId: string }>();

  const { data: contest, isLoading: contestLoading } = useQuery({
    queryKey: ['embed-contest-full', contestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contests')
        .select('*')
        .eq('id', contestId)
        .eq('is_active', true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!contestId,
  });

  const { data: contestants, isLoading: contestantsLoading } = useQuery({
    queryKey: ['embed-contest-contestants', contestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contestants')
        .select('*')
        .eq('contest_id', contestId!)
        .order('vote_count', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!contestId,
    refetchInterval: 30000,
  });

  if (contestLoading || contestantsLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-6 w-3/4" />
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="flex items-center justify-center h-full p-8 text-center bg-background">
        <div>
          <Trophy className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">Contest not found or inactive</p>
        </div>
      </div>
    );
  }

  const primaryColor = contest.brand_primary_color || '#7c3aed';
  const secondaryColor = contest.brand_secondary_color || '#f97316';
  const voteDisplayMode = normalizeVoteDisplayMode(contest.vote_display_mode);
  const contestUrl = `${window.location.origin}/c/${contest.custom_slug || contest.id}`;
  const maxVotes = contestants?.[0]?.vote_count || 1;
  const { isEnded, isVotingLocked, shortVoteButtonLabel } = getContestVotingStatus(contest);

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Header */}
      <div
        className="rounded-xl p-5 mb-4 text-white"
        style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
      >
        <div className="flex items-center gap-3 mb-2">
          {contest.brand_logo_url ? (
            <img src={contest.brand_logo_url} alt="Logo" className="h-8 object-contain" />
          ) : (
            <Trophy className="h-6 w-6" />
          )}
          <h1 className="font-bold text-xl">{contest.title}</h1>
        </div>
        {contest.description && (
          <p className="text-sm opacity-90 line-clamp-2 mb-3">{contest.description}</p>
        )}
        <div className="flex items-center gap-4 text-sm opacity-80">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {format(new Date(contest.end_date), 'MMM d, yyyy')}
          </span>
          <span className="flex items-center gap-1">
            <Vote className="h-3.5 w-3.5" />
            {contest.total_votes.toLocaleString()} votes
          </span>
          {isEnded && (
            <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-medium">Ended</span>
          )}
          {!isEnded && isVotingLocked && (
            <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-medium">Opens soon</span>
          )}
        </div>
      </div>

      {/* Contestants Grid */}
      <div className="space-y-2 mb-4">
        {contestants && contestants.length > 0 ? (
          contestants.map((contestant, index) => {
            const percentage = (contestant.vote_count / maxVotes) * 100;
            const isTop3 = index < 3;

            return (
              <div key={contestant.id} className="relative bg-card border rounded-lg p-3 overflow-hidden">
                {voteDisplayMode === 'progress_bar' && (
                  <div
                    className="absolute inset-0 opacity-10"
                    style={{ width: `${percentage}%`, backgroundColor: primaryColor }}
                  />
                )}
                <div className="relative flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      isTop3 ? 'text-white' : 'bg-muted text-muted-foreground'
                    }`}
                    style={isTop3 ? {
                      backgroundColor: index === 0 ? '#eab308' : index === 1 ? '#9ca3af' : '#b45309',
                    } : {}}
                  >
                    {index + 1}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-muted overflow-hidden flex-shrink-0">
                    {contestant.photo_url ? (
                      <img src={contestant.photo_url} alt={contestant.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{contestant.name}</p>
                  </div>
                  <ContestantVoteDisplay
                    mode={voteDisplayMode}
                    voteCount={contestant.vote_count}
                    maxVotes={maxVotes}
                    isPublicVotes={contestant.is_public_votes}
                    primaryColor={primaryColor}
                    className={voteDisplayMode === 'count' ? 'text-sm font-semibold' : undefined}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <User className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>No contestants yet</p>
          </div>
        )}
      </div>

      {/* CTA */}
      {!isVotingLocked && (
        <Button asChild className="w-full" size="lg" style={{ backgroundColor: primaryColor }}>
          <a href={contestUrl} target="_blank" rel="noopener noreferrer">
            <Vote className="h-4 w-4 mr-2" />
            {shortVoteButtonLabel}
          </a>
        </Button>
      )}

      {/* Footer */}
      <div className="mt-4 pt-4 border-t text-center">
        <a
          href={contestUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:text-primary flex items-center justify-center gap-1"
        >
          <ExternalLink className="h-3 w-3" />
          View on Useqiv
        </a>
      </div>
    </div>
  );
};

export default EmbedContest;
