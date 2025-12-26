import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PromoCode {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  applicable_to: string;
  event_id: string | null;
  contest_id: string | null;
  ticket_type_id: string | null;
  max_uses: number | null;
  current_uses: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
}

interface ValidateResult {
  isValid: boolean;
  promoCode: PromoCode | null;
  discountAmount: number;
  errorMessage: string | null;
}

interface PromoUsageDetails {
  userId: string;
  email?: string;
  orderType: 'ticket' | 'vote';
  orderAmount: number;
  discountAmount: number;
  finalAmount: number;
  eventId?: string;
  contestId?: string;
  ticketTypeId?: string;
  transactionReference?: string;
}

export const usePromoCodeValidation = () => {
  const [isValidating, setIsValidating] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  const validatePromoCode = async (
    code: string,
    type: 'vote' | 'ticket',
    amount: number,
    eventId?: string,
    contestId?: string,
    ticketTypeId?: string
  ): Promise<ValidateResult> => {
    if (!code.trim()) {
      return { isValid: false, promoCode: null, discountAmount: 0, errorMessage: 'Please enter a promo code' };
    }

    setIsValidating(true);

    try {
      // Fetch the promo code
      const { data: promoCode, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (error || !promoCode) {
        return { isValid: false, promoCode: null, discountAmount: 0, errorMessage: 'Invalid promo code' };
      }

      // Check if expired
      if (promoCode.valid_until && new Date(promoCode.valid_until) < new Date()) {
        return { isValid: false, promoCode: null, discountAmount: 0, errorMessage: 'This promo code has expired' };
      }

      // Check if not yet valid
      if (new Date(promoCode.valid_from) > new Date()) {
        return { isValid: false, promoCode: null, discountAmount: 0, errorMessage: 'This promo code is not yet active' };
      }

      // Check max uses
      if (promoCode.max_uses && promoCode.current_uses >= promoCode.max_uses) {
        return { isValid: false, promoCode: null, discountAmount: 0, errorMessage: 'This promo code has reached its usage limit' };
      }

      // Check applicability
      const applicableTo = promoCode.applicable_to;

      // For ticket purchases
      if (type === 'ticket') {
        // Check if it's for specific ticket type
        if (promoCode.ticket_type_id && promoCode.ticket_type_id !== ticketTypeId) {
          return { isValid: false, promoCode: null, discountAmount: 0, errorMessage: 'This promo code is not valid for this ticket type' };
        }

        // Check if it's for specific event
        if (promoCode.event_id && promoCode.event_id !== eventId) {
          return { isValid: false, promoCode: null, discountAmount: 0, errorMessage: 'This promo code is not valid for this event' };
        }

        // Check applicable_to category
        if (applicableTo === 'contests') {
          return { isValid: false, promoCode: null, discountAmount: 0, errorMessage: 'This promo code is only valid for contests' };
        }
      }

      // For vote purchases
      if (type === 'vote') {
        if (applicableTo === 'events') {
          return { isValid: false, promoCode: null, discountAmount: 0, errorMessage: 'This promo code is only valid for events' };
        }

        if (promoCode.contest_id && promoCode.contest_id !== contestId) {
          return { isValid: false, promoCode: null, discountAmount: 0, errorMessage: 'This promo code is not valid for this contest' };
        }
      }

      // Calculate discount
      let discount = 0;
      if (promoCode.discount_type === 'percentage') {
        discount = (amount * promoCode.discount_value) / 100;
      } else {
        discount = Math.min(promoCode.discount_value, amount);
      }

      setAppliedPromo(promoCode);
      setDiscountAmount(discount);

      return { isValid: true, promoCode, discountAmount: discount, errorMessage: null };
    } catch (err) {
      console.error('Error validating promo code:', err);
      return { isValid: false, promoCode: null, discountAmount: 0, errorMessage: 'Failed to validate promo code' };
    } finally {
      setIsValidating(false);
    }
  };

  const recordPromoCodeUsage = async (promoId: string, details: PromoUsageDetails) => {
    try {
      // Insert usage record
      const { error: usageError } = await supabase
        .from('promo_code_usage')
        .insert({
          promo_code_id: promoId,
          user_id: details.userId,
          email: details.email,
          order_type: details.orderType,
          order_amount: details.orderAmount,
          discount_amount: details.discountAmount,
          final_amount: details.finalAmount,
          event_id: details.eventId || null,
          contest_id: details.contestId || null,
          ticket_type_id: details.ticketTypeId || null,
          transaction_reference: details.transactionReference || null,
        });

      if (usageError) {
        console.error('Error recording promo code usage:', usageError);
      }

      // Increment the current_uses counter
      const { data: promo, error: fetchError } = await supabase
        .from('promo_codes')
        .select('current_uses')
        .eq('id', promoId)
        .single();
      
      if (!fetchError && promo) {
        await supabase
          .from('promo_codes')
          .update({ current_uses: promo.current_uses + 1 })
          .eq('id', promoId);
      }
    } catch (err) {
      console.error('Error in promo code usage tracking:', err);
    }
  };

  const clearAppliedPromo = () => {
    setAppliedPromo(null);
    setDiscountAmount(0);
  };

  return {
    isValidating,
    appliedPromo,
    discountAmount,
    validatePromoCode,
    recordPromoCodeUsage,
    clearAppliedPromo,
  };
};
