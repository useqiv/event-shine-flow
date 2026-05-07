import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FlutterwavePaymentParams {
  type: 'vote' | 'ticket' | 'wallet' | 'donation';
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
  // Donation specific
  campaign_id?: string;
  is_anonymous?: boolean;
  donor_message?: string;
  redirect_url?: string;
  // Influencer tracking
  influencer_link_id?: string;
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

// Trusted domains for payment redirects (Open Redirect Protection)
const TRUSTED_PAYMENT_DOMAINS = [
  'flutterwave.com',
  'rave.flutterwave.com',
  'checkout.flutterwave.com',
  'api.flutterwave.com',
  'standard.paystack.co',
];

const isValidPaymentUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    // Must be HTTPS
    if (parsed.protocol !== 'https:') return false;
    // Must be from a trusted domain
    return TRUSTED_PAYMENT_DOMAINS.some(domain => 
      parsed.hostname === domain || parsed.hostname.endsWith('.' + domain)
    );
  } catch {
    return false;
  }
};

export const useFlutterwavePayment = () => {
  return useMutation({
    mutationFn: async (params: FlutterwavePaymentParams) => {
      const { data, error } = await supabase.functions.invoke('process-flutterwave-payment', {
        body: params,
      });

      if (error) {
        let message = error.message;
        const response = (error as any)?.context;

        // Supabase FunctionsHttpError exposes the original Response via `context`.
        if (response && typeof response.text === 'function') {
          try {
            const bodyText = await response.text();
            if (bodyText) {
              try {
                const parsed = JSON.parse(bodyText);
                message = parsed?.error || parsed?.message || bodyText || message;
              } catch {
                message = bodyText;
              }
            }
          } catch {
            // Keep original message if parsing the response fails.
          }
        }

        throw new Error(message);
      }

      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      if (data.payment_link) {
        // Validate the payment URL before redirecting (Open Redirect Protection)
        if (!isValidPaymentUrl(data.payment_link)) {
          console.error('Blocked redirect to untrusted URL:', data.payment_link);
          toast.error('Invalid payment link received. Please try again.');
          return;
        }
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
