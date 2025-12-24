import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

interface Contestant {
  id: string;
  name: string;
}

interface VoteHistoryChartProps {
  contestId: string;
  contestants: Contestant[];
  className?: string;
}

// Generate distinct colors for each contestant
const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(142, 76%, 36%)',
  'hsl(38, 92%, 50%)',
  'hsl(280, 65%, 60%)',
  'hsl(200, 98%, 39%)',
  'hsl(0, 72%, 51%)',
  'hsl(330, 81%, 60%)',
  'hsl(172, 66%, 50%)',
];

const VoteHistoryChart = ({ contestId, contestants, className }: VoteHistoryChartProps) => {
  // Fetch vote history for the contest
  const { data: votes, isLoading } = useQuery({
    queryKey: ['vote-history', contestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('votes')
        .select('contestant_id, quantity, created_at')
        .eq('contest_id', contestId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  // Process votes into time series data
  const chartData = useMemo(() => {
    if (!votes || votes.length === 0 || contestants.length === 0) return [];

    // Group votes by day and contestant
    const votesByDay = new Map<string, Map<string, number>>();
    const cumulativeVotes = new Map<string, number>();

    // Initialize cumulative votes for each contestant
    contestants.forEach(c => cumulativeVotes.set(c.id, 0));

    votes.forEach(vote => {
      const day = format(new Date(vote.created_at), 'MMM d');
      
      if (!votesByDay.has(day)) {
        votesByDay.set(day, new Map());
        // Initialize with previous cumulative values
        contestants.forEach(c => {
          votesByDay.get(day)!.set(c.id, cumulativeVotes.get(c.id) || 0);
        });
      }

      // Update cumulative votes
      const currentTotal = (cumulativeVotes.get(vote.contestant_id) || 0) + vote.quantity;
      cumulativeVotes.set(vote.contestant_id, currentTotal);
      votesByDay.get(day)!.set(vote.contestant_id, currentTotal);
    });

    // Convert to chart format
    const data: any[] = [];
    votesByDay.forEach((contestantVotes, day) => {
      const entry: any = { date: day };
      contestants.forEach(c => {
        entry[c.id] = contestantVotes.get(c.id) || 0;
      });
      data.push(entry);
    });

    return data;
  }, [votes, contestants]);

  // Build chart config
  const chartConfig = useMemo(() => {
    const config: Record<string, { label: string; color: string }> = {};
    contestants.forEach((contestant, index) => {
      config[contestant.id] = {
        label: contestant.name,
        color: CHART_COLORS[index % CHART_COLORS.length],
      };
    });
    return config;
  }, [contestants]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Vote Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Vote Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No vote data available yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Vote Trends Over Time
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              tickLine={{ stroke: 'hsl(var(--muted))' }}
              axisLine={{ stroke: 'hsl(var(--muted))' }}
            />
            <YAxis 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              tickLine={{ stroke: 'hsl(var(--muted))' }}
              axisLine={{ stroke: 'hsl(var(--muted))' }}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value) => {
                const contestant = contestants.find(c => c.id === value);
                return contestant?.name || value;
              }}
            />
            {contestants.map((contestant, index) => (
              <Line
                key={contestant.id}
                type="monotone"
                dataKey={contestant.id}
                name={contestant.id}
                stroke={CHART_COLORS[index % CHART_COLORS.length]}
                strokeWidth={2}
                dot={{ fill: CHART_COLORS[index % CHART_COLORS.length], r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default VoteHistoryChart;
