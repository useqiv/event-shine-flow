import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { subDays, format, startOfDay } from 'date-fns';

interface DailyRevenue {
  date: string;
  tickets: number;
  votes: number;
  total: number;
}

export const useRevenueTrends = (days: number = 30) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['revenue-trends', user?.id, days],
    queryFn: async (): Promise<DailyRevenue[]> => {
      const startDate = subDays(new Date(), days);
      
      // Get organization's events
      const { data: events } = await supabase
        .from('events')
        .select('id')
        .eq('organization_id', user!.id);
      
      const eventIds = events?.map(e => e.id) || [];
      
      // Get organization's contests
      const { data: contests } = await supabase
        .from('contests')
        .select('id')
        .eq('organization_id', user!.id);
      
      const contestIds = contests?.map(c => c.id) || [];
      
      // Get tickets from the last N days
      let ticketsByDate: Record<string, number> = {};
      if (eventIds.length > 0) {
        const { data: tickets } = await supabase
          .from('tickets')
          .select('amount_paid, created_at')
          .in('event_id', eventIds)
          .gte('created_at', startDate.toISOString());
        
        tickets?.forEach(ticket => {
          const dateKey = format(new Date(ticket.created_at), 'yyyy-MM-dd');
          ticketsByDate[dateKey] = (ticketsByDate[dateKey] || 0) + Number(ticket.amount_paid);
        });
      }
      
      // Get votes from the last N days
      let votesByDate: Record<string, number> = {};
      if (contestIds.length > 0) {
        const { data: votes } = await supabase
          .from('votes')
          .select('amount_paid, created_at')
          .in('contest_id', contestIds)
          .gte('created_at', startDate.toISOString());
        
        votes?.forEach(vote => {
          const dateKey = format(new Date(vote.created_at), 'yyyy-MM-dd');
          votesByDate[dateKey] = (votesByDate[dateKey] || 0) + Number(vote.amount_paid);
        });
      }
      
      // Build daily data for the last N days
      const dailyData: DailyRevenue[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dateKey = format(date, 'yyyy-MM-dd');
        const tickets = ticketsByDate[dateKey] || 0;
        const votes = votesByDate[dateKey] || 0;
        
        dailyData.push({
          date: format(date, 'MMM d'),
          tickets,
          votes,
          total: tickets + votes,
        });
      }
      
      return dailyData;
    },
    enabled: !!user,
  });
};
