import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';

interface FeeSettings {
  flutterwave_fee_percentage: number;
  flutterwave_fee_fixed: number;
  crypto_fee_percentage: number;
  crypto_network_surcharge: number;
  convenience_fee_type: 'none' | 'percentage' | 'fixed';
  convenience_fee_value: number;
  convenience_fee_cap: number | null;
}

interface FeeBreakdown {
  paymentMethodFee: number;
  convenienceFee: number;
  totalFees: number;
  totalWithFees: number;
}

const defaultSettings: FeeSettings = {
  flutterwave_fee_percentage: 0,
  flutterwave_fee_fixed: 0,
  crypto_fee_percentage: 0,
  crypto_network_surcharge: 0,
  convenience_fee_type: 'none',
  convenience_fee_value: 0,
  convenience_fee_cap: null,
};

export const usePaymentFees = () => {
  const { data: settings, isLoading } = useQuery({
    queryKey: ['payment-fee-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('setting_key, setting_value')
        .in('setting_key', [
          'flutterwave_fee_percentage',
          'flutterwave_fee_fixed',
          'crypto_fee_percentage',
          'crypto_network_surcharge',
          'convenience_fee_type',
          'convenience_fee_value',
          'convenience_fee_cap',
        ]);

      if (error) throw error;

      const result = { ...defaultSettings };
      data?.forEach((s) => {
        const val = s.setting_value || '0';
        switch (s.setting_key) {
          case 'flutterwave_fee_percentage':
            result.flutterwave_fee_percentage = parseFloat(val) || 0;
            break;
          case 'flutterwave_fee_fixed':
            result.flutterwave_fee_fixed = parseFloat(val) || 0;
            break;
          case 'crypto_fee_percentage':
            result.crypto_fee_percentage = parseFloat(val) || 0;
            break;
          case 'crypto_network_surcharge':
            result.crypto_network_surcharge = parseFloat(val) || 0;
            break;
          case 'convenience_fee_type':
            result.convenience_fee_type = (val as FeeSettings['convenience_fee_type']) || 'none';
            break;
          case 'convenience_fee_value':
            result.convenience_fee_value = parseFloat(val) || 0;
            break;
          case 'convenience_fee_cap':
            result.convenience_fee_cap = val ? parseFloat(val) || null : null;
            break;
        }
      });
      return result;
    },
    staleTime: 5 * 60 * 1000,
  });

  const calculateFees = useMemo(() => {
    return (amount: number, method: 'flutterwave' | 'crypto'): FeeBreakdown => {
      const s = settings || defaultSettings;

      // Payment method fee
      let paymentMethodFee = 0;
      if (method === 'flutterwave') {
        paymentMethodFee = (amount * s.flutterwave_fee_percentage) / 100 + s.flutterwave_fee_fixed;
      } else {
        paymentMethodFee = (amount * s.crypto_fee_percentage) / 100 + s.crypto_network_surcharge;
      }
      paymentMethodFee = Math.round(paymentMethodFee * 100) / 100;

      // Convenience fee
      let convenienceFee = 0;
      if (s.convenience_fee_type === 'percentage') {
        convenienceFee = (amount * s.convenience_fee_value) / 100;
      } else if (s.convenience_fee_type === 'fixed') {
        convenienceFee = s.convenience_fee_value;
      }
      if (s.convenience_fee_cap && convenienceFee > s.convenience_fee_cap) {
        convenienceFee = s.convenience_fee_cap;
      }
      convenienceFee = Math.round(convenienceFee * 100) / 100;

      const totalFees = Math.round((paymentMethodFee + convenienceFee) * 100) / 100;
      const totalWithFees = Math.round((amount + totalFees) * 100) / 100;

      return { paymentMethodFee, convenienceFee, totalFees, totalWithFees };
    };
  }, [settings]);

  return { settings: settings || defaultSettings, isLoading, calculateFees };
};
