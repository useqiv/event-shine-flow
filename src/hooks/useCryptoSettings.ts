import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useCryptoSettings = () => {
  return useQuery({
    queryKey: ['crypto-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('setting_value')
        .eq('setting_key', 'crypto_payment_enabled')
        .maybeSingle();

      if (error) throw error;

      return {
        enabled: data?.setting_value === 'true',
      };
    },
    staleTime: 2 * 60 * 1000,
  });
};
