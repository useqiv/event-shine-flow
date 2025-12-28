import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const DEFAULT_PLATFORM_CURRENCY = 'USD';

export const usePlatformCurrency = () => {
  const { data: platformCurrency = DEFAULT_PLATFORM_CURRENCY } = useQuery({
    queryKey: ['platform-default-currency'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('setting_value')
        .eq('setting_key', 'default_currency')
        .single();
      
      if (error || !data?.setting_value) {
        return DEFAULT_PLATFORM_CURRENCY;
      }
      
      return data.setting_value;
    },
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
  });

  return platformCurrency;
};
