/**
 * Analytics utility functions for calculating voting patterns and statistics
 * These are reusable across ContestAnalytics, CampaignAnalytics, and AdminPaymentHistory
 */

import { format, subDays } from 'date-fns';

export interface VoteRecord {
  id: string;
  user_id?: string | null;
  guest_email?: string | null;
  quantity: number;
  amount_paid: number;
  /** Fee-free org revenue; falls back to amount_paid when unset */
  base_amount?: number;
  payment_method?: string | null;
  created_at: string;
}

const voteRevenue = (vote: VoteRecord): number =>
  Number(vote.base_amount ?? vote.amount_paid) || 0;

export interface ContestantRecord {
  id: string;
  name: string;
  vote_count: number;
}

export interface HourlyData {
  hour: number;
  count: number;
}

export interface DailyData {
  date: string;
  votes: number;
  revenue: number;
}

export interface ContestantStats {
  name: string;
  votes: number;
  percentage: number;
}

export interface PaymentMethodStats {
  method: string;
  count: number;
}

export interface AnalyticsResult {
  totalRevenue: number;
  totalVotes: number;
  uniqueVoters: number;
  averageVotesPerVoter: number;
  peakVotingHours: HourlyData[];
  dailyVotes: DailyData[];
  topContestants: ContestantStats[];
  voterPaymentMethods: PaymentMethodStats[];
}

/**
 * Calculate unique voters from vote records
 * Uses user_id for authenticated users, guest_email for guests, falls back to vote id
 */
export const calculateUniqueVoters = (votes: VoteRecord[]): number => {
  return new Set(votes.map(v => v.user_id || v.guest_email || v.id)).size;
};

/**
 * Calculate total votes (sum of quantities)
 */
export const calculateTotalVotes = (votes: VoteRecord[]): number => {
  return votes.reduce((sum, v) => sum + v.quantity, 0);
};

/**
 * Calculate total revenue
 */
export const calculateTotalRevenue = (votes: VoteRecord[]): number => {
  return votes.reduce((sum, v) => sum + voteRevenue(v), 0);
};

/**
 * Calculate peak voting hours distribution (0-23)
 */
export const calculatePeakVotingHours = (votes: VoteRecord[]): HourlyData[] => {
  const hourlyMap = new Map<number, number>();
  
  votes.forEach(vote => {
    const hour = new Date(vote.created_at).getHours();
    hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + vote.quantity);
  });
  
  return Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    count: hourlyMap.get(i) || 0,
  }));
};

/**
 * Calculate daily vote/revenue trends for last N days
 */
export const calculateDailyVotes = (votes: VoteRecord[], days: number = 14): DailyData[] => {
  const dailyMap = new Map<string, { votes: number; revenue: number }>();
  
  // Initialize all days with zero values
  const dateRange = Array.from({ length: days }, (_, i) =>
    format(subDays(new Date(), days - 1 - i), 'yyyy-MM-dd')
  );
  
  dateRange.forEach(date => {
    dailyMap.set(date, { votes: 0, revenue: 0 });
  });

  // Aggregate votes by date
  votes.forEach(vote => {
    const date = format(new Date(vote.created_at), 'yyyy-MM-dd');
    if (dailyMap.has(date)) {
      const current = dailyMap.get(date)!;
      dailyMap.set(date, {
        votes: current.votes + vote.quantity,
        revenue: current.revenue + voteRevenue(vote),
      });
    }
  });

  return Array.from(dailyMap.entries()).map(([date, data]) => ({
    date: format(new Date(date), 'MMM d'),
    votes: data.votes,
    revenue: data.revenue,
  }));
};

/**
 * Calculate top contestants by vote percentage
 */
export const calculateTopContestants = (
  contestants: ContestantRecord[],
  limit: number = 10
): ContestantStats[] => {
  const totalVotes = contestants.reduce((sum, c) => sum + c.vote_count, 0) || 1;
  
  return contestants
    .slice(0, limit)
    .map(c => ({
      name: c.name,
      votes: c.vote_count,
      percentage: (c.vote_count / totalVotes) * 100,
    }));
};

/**
 * Calculate payment method distribution
 */
export const calculatePaymentMethodStats = (votes: VoteRecord[]): PaymentMethodStats[] => {
  const paymentMethodMap = new Map<string, number>();
  
  votes.forEach(vote => {
    const method = vote.payment_method || 'unknown';
    paymentMethodMap.set(method, (paymentMethodMap.get(method) || 0) + 1);
  });
  
  return Array.from(paymentMethodMap.entries())
    .map(([method, count]) => ({ method, count }))
    .sort((a, b) => b.count - a.count);
};

/**
 * Calculate all analytics in one call
 */
export const calculateFullAnalytics = (
  votes: VoteRecord[],
  contestants: ContestantRecord[] = [],
  daysRange: number = 14
): AnalyticsResult => {
  const totalVotes = calculateTotalVotes(votes);
  const uniqueVoters = calculateUniqueVoters(votes);
  
  return {
    totalRevenue: calculateTotalRevenue(votes),
    totalVotes,
    uniqueVoters,
    averageVotesPerVoter: uniqueVoters > 0 ? totalVotes / uniqueVoters : 0,
    peakVotingHours: calculatePeakVotingHours(votes),
    dailyVotes: calculateDailyVotes(votes, daysRange),
    topContestants: calculateTopContestants(contestants),
    voterPaymentMethods: calculatePaymentMethodStats(votes),
  };
};
