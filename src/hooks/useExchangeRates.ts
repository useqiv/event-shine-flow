import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ExchangeRatesResponse {
  rates: Record<string, number>;
  cached: boolean;
  fallback?: boolean;
  lastUpdated: string;
}

// Default fallback rates
const fallbackRates: Record<string, number> = {
  USD: 1,
  NGN: 1550,
  EUR: 0.92,
  GBP: 0.79,
  GHS: 15.5,
  KES: 153,
  ZAR: 18.5,
};

export const useExchangeRates = () => {
  return useQuery({
    queryKey: ['exchange-rates'],
    queryFn: async (): Promise<ExchangeRatesResponse> => {
      const { data, error } = await supabase.functions.invoke('get-exchange-rates');
      
      if (error) {
        console.error('Error fetching exchange rates:', error);
        return {
          rates: fallbackRates,
          cached: false,
          fallback: true,
          lastUpdated: new Date().toISOString()
        };
      }
      
      return data;
    },
    staleTime: 30 * 60 * 1000, // Consider data fresh for 30 minutes
    gcTime: 60 * 60 * 1000, // Keep in cache for 1 hour
    refetchOnWindowFocus: false,
    retry: 2,
  });
};

// Export fallback rates for use in static contexts
export { fallbackRates };
