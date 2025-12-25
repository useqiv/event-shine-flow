import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface FraudAlert {
  id: string;
  type: 'rapid_votes' | 'bulk_votes' | 'suspicious_pattern';
  severity: 'low' | 'medium' | 'high';
  message: string;
  contestantId: string;
  contestantName: string;
  details: {
    voteCount?: number;
    timeWindow?: string;
    averageVotes?: number;
  };
  timestamp: Date;
}

export const useFraudDetection = (contestId: string) => {
  return useQuery({
    queryKey: ['fraud-detection', contestId],
    queryFn: async (): Promise<FraudAlert[]> => {
      if (!contestId) return [];

      // Get votes for this contest in the last 24 hours
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const { data: recentVotes, error } = await supabase
        .from('votes')
        .select(`
          id,
          contestant_id,
          quantity,
          created_at,
          user_id,
          contestants (
            name
          )
        `)
        .eq('contest_id', contestId)
        .gte('created_at', twentyFourHoursAgo.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const alerts: FraudAlert[] = [];

      // Group votes by user
      const votesByUser: Record<string, any[]> = {};
      recentVotes?.forEach((vote: any) => {
        if (!votesByUser[vote.user_id]) {
          votesByUser[vote.user_id] = [];
        }
        votesByUser[vote.user_id].push(vote);
      });

      // Group votes by contestant
      const votesByContestant: Record<string, { name: string; votes: any[] }> = {};
      recentVotes?.forEach((vote: any) => {
        if (!votesByContestant[vote.contestant_id]) {
          votesByContestant[vote.contestant_id] = {
            name: vote.contestants?.name || 'Unknown',
            votes: []
          };
        }
        votesByContestant[vote.contestant_id].votes.push(vote);
      });

      // Detection 1: Rapid votes from same user (more than 5 votes in 10 minutes)
      Object.entries(votesByUser).forEach(([userId, votes]) => {
        if (votes.length >= 5) {
          const sortedVotes = votes.sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
          
          for (let i = 0; i <= sortedVotes.length - 5; i++) {
            const window = sortedVotes.slice(i, i + 5);
            const firstTime = new Date(window[0].created_at).getTime();
            const lastTime = new Date(window[4].created_at).getTime();
            const diffMinutes = (lastTime - firstTime) / (1000 * 60);
            
            if (diffMinutes <= 10) {
              const contestantId = window[0].contestant_id;
              const existingAlert = alerts.find(
                a => a.type === 'rapid_votes' && a.contestantId === contestantId
              );
              
              if (!existingAlert) {
                alerts.push({
                  id: `rapid-${userId}-${contestantId}`,
                  type: 'rapid_votes',
                  severity: 'medium',
                  message: `Rapid voting detected for ${votesByContestant[contestantId]?.name}`,
                  contestantId,
                  contestantName: votesByContestant[contestantId]?.name || 'Unknown',
                  details: {
                    voteCount: 5,
                    timeWindow: `${diffMinutes.toFixed(1)} minutes`
                  },
                  timestamp: new Date(window[4].created_at)
                });
              }
            }
          }
        }
      });

      // Detection 2: Bulk votes (single transaction with 50+ votes)
      recentVotes?.forEach((vote: any) => {
        if (vote.quantity >= 50) {
          alerts.push({
            id: `bulk-${vote.id}`,
            type: 'bulk_votes',
            severity: vote.quantity >= 100 ? 'high' : 'medium',
            message: `Large vote purchase for ${vote.contestants?.name}`,
            contestantId: vote.contestant_id,
            contestantName: vote.contestants?.name || 'Unknown',
            details: {
              voteCount: vote.quantity
            },
            timestamp: new Date(vote.created_at)
          });
        }
      });

      // Detection 3: Suspicious pattern - contestant getting 3x more votes than average
      const totalVotes = recentVotes?.reduce((sum, v: any) => sum + v.quantity, 0) || 0;
      const contestantCount = Object.keys(votesByContestant).length;
      const averageVotes = contestantCount > 0 ? totalVotes / contestantCount : 0;

      Object.entries(votesByContestant).forEach(([contestantId, data]) => {
        const contestantTotal = data.votes.reduce((sum, v) => sum + v.quantity, 0);
        if (averageVotes > 0 && contestantTotal > averageVotes * 3 && contestantTotal > 50) {
          alerts.push({
            id: `pattern-${contestantId}`,
            type: 'suspicious_pattern',
            severity: contestantTotal > averageVotes * 5 ? 'high' : 'low',
            message: `${data.name} has unusually high vote activity`,
            contestantId,
            contestantName: data.name,
            details: {
              voteCount: contestantTotal,
              averageVotes: Math.round(averageVotes)
            },
            timestamp: new Date()
          });
        }
      });

      // Sort by severity and timestamp
      const severityOrder = { high: 0, medium: 1, low: 2 };
      return alerts.sort((a, b) => {
        if (severityOrder[a.severity] !== severityOrder[b.severity]) {
          return severityOrder[a.severity] - severityOrder[b.severity];
        }
        return b.timestamp.getTime() - a.timestamp.getTime();
      });
    },
    enabled: !!contestId,
    refetchInterval: 60000, // Refresh every minute
  });
};
