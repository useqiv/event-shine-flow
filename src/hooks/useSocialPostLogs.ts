import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SocialPostLog {
  id: string;
  organization_id: string;
  platform: string;
  post_type: string;
  status: string;
  posted_at: string;
  engagement_clicks: number | null;
  engagement_impressions: number | null;
  error_message: string | null;
  contests?: { title: string } | null;
}

export const useSocialPostLogs = (limit = 200) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['social-post-logs-all', user?.id, limit],
    queryFn: async (): Promise<SocialPostLog[]> => {
      const { data, error } = await supabase
        .from('social_post_logs')
        .select('*, contests(title)')
        .eq('organization_id', user!.id)
        .order('posted_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as SocialPostLog[];
    },
    enabled: !!user?.id,
  });
};
