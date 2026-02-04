import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { queryCache, selectColumns } from '@/lib/queryConfig';

export const useUserRole = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('user_roles')
        .select(selectColumns.userRole)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Prioritize roles: admin > organization > influencer > user
      if (!data || data.length === 0) return 'user';
      
      const roles = data.map(r => r.role);
      if (roles.includes('admin')) return 'admin';
      if (roles.includes('organization')) return 'organization';
      if (roles.includes('influencer')) return 'influencer';
      return 'user';
    },
    enabled: !!user?.id,
    ...queryCache.static, // Role rarely changes
  });
};

export const useIsOrganization = () => {
  const { data: role, isLoading } = useUserRole();
  return {
    isOrganization: role === 'organization',
    isLoading,
  };
};
