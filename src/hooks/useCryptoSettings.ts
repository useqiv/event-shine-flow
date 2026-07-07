import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useCryptoSettings = () => {
  return useQuery({
    queryKey: ['crypto-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('setting_key, setting_value')
        .in('setting_key', [
          'crypto_payment_enabled',
          'crypto_wallet_polygon_usdt',
          'crypto_wallet_polygon_usdc',
        ]);

      if (error) throw error;

      const settings = Object.fromEntries(
        (data || []).map((s) => [s.setting_key, s.setting_value || '']),
      );

      return {
        enabled: settings.crypto_payment_enabled === 'true',
        polygonUsdtWallet: settings.crypto_wallet_polygon_usdt || '',
        polygonUsdcWallet: settings.crypto_wallet_polygon_usdc || '',
      };
    },
    staleTime: 2 * 60 * 1000,
  });
};
