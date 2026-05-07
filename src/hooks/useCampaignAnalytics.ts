import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getBaseAmountsByTransactionId } from '@/lib/baseAmount';

export interface CampaignAnalytics {
  id: string;
  campaign_id: string;
  date: string;
  hour: number | null;
  views: number;
  unique_visitors: number;
  donations_count: number;
  donations_amount: number;
  shares_count: number;
  source: string | null;
  created_at: string;
}

export interface DonationTrend {
  date: string;
  donations: number;
  amount: number;
}

export interface SourceData {
  source: string;
  views: number;
  donations: number;
}

export const useCampaignAnalytics = (campaignId: string) => {
  return useQuery({
    queryKey: ['campaign-analytics', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaign_analytics')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('date', { ascending: true });
      
      if (error) throw error;
      return data as CampaignAnalytics[];
    },
    enabled: !!campaignId,
  });
};

export const useCampaignDonationTrends = (campaignId: string, days: number = 30) => {
  return useQuery({
    queryKey: ['campaign-donation-trends', campaignId, days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const { data, error } = await supabase
        .from('donations')
        .select('amount, created_at, transaction_id')
        .eq('campaign_id', campaignId)
        .eq('status', 'completed')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      const baseAmountMap = await getBaseAmountsByTransactionId(
        (data || []).map(d => d.transaction_id)
      );

      // Group by date (use fee-free base donation amounts)
      const trendMap = new Map<string, { donations: number; amount: number }>();
      
      (data || []).forEach(donation => {
        const date = new Date(donation.created_at).toLocaleDateString('en-CA');
        const baseAmount = baseAmountMap.get(donation.transaction_id) ?? Number(donation.amount);
        const existing = trendMap.get(date) || { donations: 0, amount: 0 };
        trendMap.set(date, {
          donations: existing.donations + 1,
          amount: existing.amount + Number(baseAmount || 0),
        });
      });
      
      // Fill in missing dates
      const trends: DonationTrend[] = [];
      for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toLocaleDateString('en-CA');
        const existing = trendMap.get(dateStr);
        trends.push({
          date: dateStr,
          donations: existing?.donations || 0,
          amount: existing?.amount || 0,
        });
      }
      
      return trends;
    },
    enabled: !!campaignId,
  });
};

export const useCampaignDonorStats = (campaignId: string) => {
  return useQuery({
    queryKey: ['campaign-donor-stats', campaignId],
    queryFn: async () => {
      // Use donations_safe view to protect anonymous donor identities
      const { data: donations, error } = await supabase
        .from('donations_safe')
        .select('donor_id, amount, transaction_id, is_anonymous, created_at')
        .eq('campaign_id', campaignId)
        .eq('status', 'completed');
      
      if (error) throw error;
      
      const baseAmountMap = await getBaseAmountsByTransactionId(
        (donations || []).map(d => d.transaction_id)
      );

      const donorMap = new Map<string, { total: number; count: number; firstDonation: string }>();
      
      (donations || []).forEach(d => {
        const baseAmount = baseAmountMap.get(d.transaction_id) ?? Number(d.amount);
        const existing = donorMap.get(d.donor_id);
        if (existing) {
          donorMap.set(d.donor_id, {
            total: existing.total + Number(baseAmount || 0),
            count: existing.count + 1,
            firstDonation: existing.firstDonation,
          });
        } else {
          donorMap.set(d.donor_id, {
            total: Number(baseAmount || 0),
            count: 1,
            firstDonation: d.created_at,
          });
        }
      });
      
      const donors = Array.from(donorMap.values());
      const totalDonors = donors.length;
      const repeatDonors = donors.filter(d => d.count > 1).length;
      const averageDonation =
        donations?.length
          ? donors.reduce((sum, d) => sum + d.total, 0) / donations.length
          : 0;

      const totalDonationsAmount = donors.reduce((sum, d) => sum + d.total, 0);
      
      // Donation size distribution
      const amounts = (donations || []).map(d => baseAmountMap.get(d.transaction_id) ?? Number(d.amount));
      const distribution = {
        small: amounts.filter(a => a < 5000).length,
        medium: amounts.filter(a => a >= 5000 && a < 20000).length,
        large: amounts.filter(a => a >= 20000 && a < 50000).length,
        major: amounts.filter(a => a >= 50000).length,
      };
      
      return {
        totalDonors,
        repeatDonors,
        repeatDonorRate: totalDonors ? (repeatDonors / totalDonors) * 100 : 0,
        averageDonation,
        totalDonationsAmount,
        distribution,
        anonymousDonations: donations?.filter(d => d.is_anonymous).length || 0,
      };
    },
    enabled: !!campaignId,
  });
};

export const trackCampaignView = async (campaignId: string, source: string = 'direct') => {
  try {
    await supabase.rpc('track_campaign_view', {
      p_campaign_id: campaignId,
      p_source: source,
    });
  } catch (error) {
    console.error('Failed to track campaign view:', error);
  }
};

export const useCampaignTrafficSources = (campaignId: string) => {
  return useQuery({
    queryKey: ['campaign-traffic-sources', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaign_analytics')
        .select('source, views, donations_count, donations_amount')
        .eq('campaign_id', campaignId);
      
      if (error) throw error;
      
      // Aggregate by source
      const sourceMap = new Map<string, { views: number; donations: number; amount: number }>();
      
      (data || []).forEach(row => {
        const source = row.source || 'direct';
        const existing = sourceMap.get(source) || { views: 0, donations: 0, amount: 0 };
        sourceMap.set(source, {
          views: existing.views + (row.views || 0),
          donations: existing.donations + (row.donations_count || 0),
          amount: existing.amount + (row.donations_amount || 0),
        });
      });
      
      return Array.from(sourceMap.entries()).map(([source, stats]) => ({
        source,
        ...stats,
        conversionRate: stats.views > 0 ? (stats.donations / stats.views) * 100 : 0,
      })).sort((a, b) => b.views - a.views);
    },
    enabled: !!campaignId,
  });
};

export const useCampaignViewStats = (campaignId: string) => {
  return useQuery({
    queryKey: ['campaign-view-stats', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaign_analytics')
        .select('views, unique_visitors, shares_count, date')
        .eq('campaign_id', campaignId);
      
      if (error) throw error;
      
      const totalViews = data?.reduce((sum, r) => sum + (r.views || 0), 0) || 0;
      const uniqueVisitors = data?.reduce((sum, r) => sum + (r.unique_visitors || 0), 0) || 0;
      const totalShares = data?.reduce((sum, r) => sum + (r.shares_count || 0), 0) || 0;
      
      return {
        totalViews,
        uniqueVisitors,
        totalShares,
      };
    },
    enabled: !!campaignId,
  });
};
