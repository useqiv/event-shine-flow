import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Campaign {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  short_description: string | null;
  image_url: string | null;
  goal_amount: number;
  current_amount: number;
  currency: string;
  category: string;
  status: string;
  is_featured: boolean;
  start_date: string;
  end_date: string | null;
  donor_count: number;
  created_at: string;
  updated_at: string;
  creator?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface Donation {
  id: string;
  campaign_id: string;
  donor_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  is_anonymous: boolean;
  donor_message: string | null;
  status: string;
  created_at: string;
  donor?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export const useCampaigns = (filters?: { category?: string; status?: string; featured?: boolean }) => {
  return useQuery({
    queryKey: ['campaigns', filters],
    queryFn: async () => {
      let query = supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.featured) {
        query = query.eq('is_featured', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Fetch creator profiles separately
      const campaigns = data || [];
      const creatorIds = [...new Set(campaigns.map(c => c.creator_id))];
      
      if (creatorIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', creatorIds);
        
        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
        
        return campaigns.map(c => ({
          ...c,
          creator: profileMap.get(c.creator_id) || null,
        })) as Campaign[];
      }
      
      return campaigns as Campaign[];
    },
  });
};

export const useCampaign = (id: string) => {
  return useQuery({
    queryKey: ['campaign', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      
      // Fetch creator profile
      const { data: creator } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('id', data.creator_id)
        .single();
      
      return { ...data, creator } as Campaign;
    },
    enabled: !!id,
  });
};

export const useMyCampaigns = () => {
  return useQuery({
    queryKey: ['my-campaigns'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Campaign[];
    },
  });
};

export const useCampaignDonations = (campaignId: string) => {
  return useQuery({
    queryKey: ['campaign-donations', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('donations')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      
      const donations = data || [];
      const donorIds = [...new Set(donations.map(d => d.donor_id))];
      
      if (donorIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', donorIds);
        
        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
        
        return donations.map(d => ({
          ...d,
          donor: profileMap.get(d.donor_id) || null,
        })) as Donation[];
      }
      
      return donations as Donation[];
    },
    enabled: !!campaignId,
  });
};

interface CreateCampaignInput {
  title: string;
  short_description?: string | null;
  description?: string | null;
  goal_amount: number;
  currency: string;
  category: string;
  image_url?: string | null;
  end_date?: string | null;
  status?: string;
}

export const useCreateCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (campaign: CreateCampaignInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('campaigns')
        .insert({
          title: campaign.title,
          short_description: campaign.short_description,
          description: campaign.description,
          goal_amount: campaign.goal_amount,
          currency: campaign.currency,
          category: campaign.category,
          image_url: campaign.image_url,
          end_date: campaign.end_date,
          status: campaign.status || 'draft',
          creator_id: user.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['my-campaigns'] });
      toast.success('Campaign created successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};


export const useUpdateCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Campaign> & { id: string }) => {
      const { data, error } = await supabase
        .from('campaigns')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['my-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaign', data.id] });
      toast.success('Campaign updated!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useCreateDonation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (donation: {
      campaign_id: string;
      amount: number;
      currency: string;
      payment_method: string;
      is_anonymous?: boolean;
      donor_message?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('donations')
        .insert({ ...donation, donor_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaign', data.campaign_id] });
      queryClient.invalidateQueries({ queryKey: ['campaign-donations', data.campaign_id] });
      toast.success('Thank you for your donation!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};
