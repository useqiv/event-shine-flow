import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { queryCache, selectColumns } from '@/lib/queryConfig';

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
  custom_slug: string | null;
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
        .select(selectColumns.campaignCard)
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
      
      // Fetch creator profiles separately with minimal columns
      const campaigns = data || [];
      const creatorIds = [...new Set(campaigns.map(c => c.creator_id))];
      
      if (creatorIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select(selectColumns.profileEssential)
          .in('id', creatorIds);
        
        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
        
        return campaigns.map(c => ({
          ...c,
          creator: profileMap.get(c.creator_id) || null,
        })) as Campaign[];
      }
      
      return campaigns as Campaign[];
    },
    ...queryCache.publicListing,
  });
};

export const useCampaign = (idOrSlug: string) => {
  return useQuery({
    queryKey: ['campaign', idOrSlug],
    queryFn: async () => {
      // Check if it's a UUID or a custom slug
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
      
      let data;
      let error;
      
      if (isUUID) {
        const result = await supabase
          .from('campaigns')
          .select(selectColumns.campaignDetail)
          .eq('id', idOrSlug)
          .maybeSingle();
        data = result.data;
        error = result.error;
      } else {
        // Try by custom_slug
        const result = await supabase
          .from('campaigns')
          .select(selectColumns.campaignDetail)
          .eq('custom_slug', idOrSlug)
          .maybeSingle();
        data = result.data;
        error = result.error;
      }
      
      if (error) throw error;
      if (!data) return null;
      
      // Fetch creator profile with minimal columns
      const { data: creator } = await supabase
        .from('profiles')
        .select(selectColumns.profileEssential)
        .eq('id', data.creator_id)
        .maybeSingle();
      
      return { ...data, creator } as Campaign;
    },
    enabled: !!idOrSlug,
    ...queryCache.moderate,
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
        .select(selectColumns.campaignCard)
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Campaign[];
    },
    ...queryCache.moderate,
  });
};

/** Campaigns owned by the organization (creator_id = org owner). Used in org manage UI. */
export const useOrganizationCampaigns = (organizationId: string | null | undefined) => {
  return useQuery({
    queryKey: ['organization-campaigns', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];

      const { data, error } = await supabase
        .from('campaigns')
        .select(selectColumns.campaignCard)
        .eq('creator_id', organizationId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Campaign[];
    },
    enabled: !!organizationId,
    ...queryCache.moderate,
  });
};

/**
 * Resolve creator_id for new campaigns: org owners and delegated team editors
 * create under the organization owner's id so campaigns appear in org manage lists.
 */
export async function resolveCampaignCreatorId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'organization')
    .maybeSingle();

  if (roleData) {
    return user.id;
  }

  const { data: teamMember } = await supabase
    .from('team_members')
    .select('organization_id, permissions, status')
    .eq('user_id', user.id)
    .eq('status', 'accepted')
    .maybeSingle();

  if (teamMember) {
    const permissions = teamMember.permissions as { can_edit_campaigns?: boolean };
    if (permissions?.can_edit_campaigns && teamMember.organization_id) {
      return teamMember.organization_id;
    }
  }

  return user.id;
}

export const useCampaignDonations = (campaignId: string) => {
  return useQuery({
    queryKey: ['campaign-donations', campaignId],
    queryFn: async () => {
      // Use donations_safe view with minimal columns
      const { data, error } = await supabase
        .from('donations_safe')
        .select('id, campaign_id, donor_id, amount, currency, payment_method, is_anonymous, donor_message, status, created_at')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      
      const donations = data || [];
      const donorIds = [...new Set(donations.map(d => d.donor_id).filter(Boolean))];
      
      if (donorIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select(selectColumns.profileEssential)
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
    ...queryCache.dynamic,
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
      const creatorId = await resolveCampaignCreatorId();

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
          creator_id: creatorId,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['my-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['organization-campaigns'] });
      toast.success('Campaign created successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};


export type UpdateCampaignInput = {
  id: string;
  title?: string;
  short_description?: string | null;
  description?: string | null;
  goal_amount?: number;
  category?: string;
  end_date?: string | null;
  image_url?: string | null;
  status?: string;
  custom_slug?: string | null;
};

export const useUpdateCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateCampaignInput) => {
      const allowed: UpdateCampaignInput = { id, ...updates };
      const { id: _id, ...payload } = allowed;

      const { data, error } = await supabase
        .from('campaigns')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Invalidate all campaign-related queries to ensure fresh data across the app
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['my-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['organization-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaign', data.id] });
      queryClient.invalidateQueries({ queryKey: ['admin-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['featured-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaign-donations', data.id] });
      queryClient.invalidateQueries({ queryKey: ['campaign-updates', data.id] });
      queryClient.invalidateQueries({ queryKey: ['campaign-analytics', data.id] });
      toast.success('Campaign updated!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useDeleteCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['my-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['organization-campaigns'] });
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
