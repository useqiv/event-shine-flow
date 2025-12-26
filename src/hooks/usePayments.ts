import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FlutterwavePaymentParams {
  type: 'vote' | 'ticket' | 'wallet';
  amount: number;
  currency: string;
  email: string;
  phone?: string;
  name: string;
  user_id: string;
  contest_id?: string;
  contestant_id?: string;
  vote_quantity?: number;
  event_id?: string;
  ticket_type_id?: string;
  ticket_quantity?: number;
  redirect_url?: string;
}

interface CryptoPaymentParams {
  type: 'vote' | 'ticket';
  crypto_currency: 'USDT' | 'USDC' | 'BTC' | 'ETH';
  network: 'ethereum' | 'bsc' | 'polygon' | 'tron';
  amount_usd: number;
  user_id: string;
  contest_id?: string;
  contestant_id?: string;
  vote_quantity?: number;
  event_id?: string;
  ticket_type_id?: string;
  ticket_quantity?: number;
}

interface VerifyCryptoParams {
  payment_ref: string;
  tx_hash: string;
  user_id: string;
}

export const useFlutterwavePayment = () => {
  return useMutation({
    mutationFn: async (params: FlutterwavePaymentParams) => {
      const { data, error } = await supabase.functions.invoke('process-flutterwave-payment', {
        body: params,
      });

      if (error) {
        // Supabase Functions errors (non-2xx) often include a response body in `context`
        const maybeBody = (error as any)?.context?.body;
        const bodyString =
          typeof maybeBody === 'string'
            ? maybeBody
            : maybeBody
              ? JSON.stringify(maybeBody)
              : '';

        let message = error.message;
        if (bodyString) {
          try {
            const parsed = JSON.parse(bodyString);
            message = parsed?.error || parsed?.message || message;
          } catch {
            // bodyString wasn't JSON
          }
        }

        throw new Error(message);
      }

      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      if (data.payment_link) {
        window.location.href = data.payment_link;
      }
    },
    onError: (error: Error) => {
      toast.error('Payment failed: ' + error.message);
    },
  });
};

export const useCryptoPayment = () => {
  return useMutation({
    mutationFn: async (params: CryptoPaymentParams) => {
      const { data, error } = await supabase.functions.invoke('process-crypto-payment', {
        body: params,
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data;
    },
    onError: (error: Error) => {
      toast.error('Payment initialization failed: ' + error.message);
    },
  });
};

export const useVerifyCryptoPayment = () => {
  return useMutation({
    mutationFn: async (params: VerifyCryptoParams) => {
      const { data, error } = await supabase.functions.invoke('verify-crypto-payment', {
        body: params,
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast.success('Payment submitted for verification');
    },
    onError: (error: Error) => {
      toast.error('Verification failed: ' + error.message);
    },
  });
};

export const useSendAdminNotification = () => {
  return useMutation({
    mutationFn: async (params: {
      type: 'fraud_alert' | 'payout_request' | 'payout_approved' | 'payout_rejected' | 'new_organization' | 'content_moderation';
      data: Record<string, any>;
      adminEmails?: string[];
    }) => {
      const { data, error } = await supabase.functions.invoke('send-admin-notification', {
        body: params,
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data;
    },
    onError: (error: Error) => {
      console.error('Failed to send admin notification:', error);
    },
  });
};
