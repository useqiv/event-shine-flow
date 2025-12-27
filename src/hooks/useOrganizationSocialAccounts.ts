import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface SocialAccount {
  id: string;
  organization_id: string;
  platform: string;
  account_name: string | null;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
  is_connected: boolean;
  created_at: string;
  updated_at: string;
}

export const useOrganizationSocialAccounts = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['organization-social-accounts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organization_social_accounts')
        .select('*')
        .eq('organization_id', user!.id)
        .order('platform');
      
      if (error) throw error;
      return data as SocialAccount[];
    },
    enabled: !!user,
  });
};

export const useConnectSocialAccount = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (data: {
      platform: string;
      account_name: string;
      access_token?: string;
    }) => {
      const { data: result, error } = await supabase
        .from('organization_social_accounts')
        .upsert({
          organization_id: user!.id,
          platform: data.platform,
          account_name: data.account_name,
          access_token: data.access_token || null,
          is_connected: true,
        }, {
          onConflict: 'organization_id,platform'
        })
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['organization-social-accounts'] });
      toast.success(`${variables.platform} account connected`);
    },
    onError: (error) => {
      toast.error('Failed to connect account');
      console.error(error);
    },
  });
};

export const useDisconnectSocialAccount = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('organization_social_accounts')
        .update({ is_connected: false, access_token: null })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-social-accounts'] });
      toast.success('Account disconnected');
    },
    onError: (error) => {
      toast.error('Failed to disconnect account');
      console.error(error);
    },
  });
};

export const useDeleteSocialAccount = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('organization_social_accounts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-social-accounts'] });
      toast.success('Account removed');
    },
    onError: (error) => {
      toast.error('Failed to remove account');
      console.error(error);
    },
  });
};
