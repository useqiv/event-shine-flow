-- Create promo code usage tracking table
CREATE TABLE public.promo_code_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  promo_code_id UUID NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  email TEXT,
  order_type TEXT NOT NULL, -- 'ticket' or 'vote'
  order_amount NUMERIC NOT NULL,
  discount_amount NUMERIC NOT NULL,
  final_amount NUMERIC NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  contest_id UUID REFERENCES public.contests(id) ON DELETE SET NULL,
  ticket_type_id UUID REFERENCES public.ticket_types(id) ON DELETE SET NULL,
  transaction_reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.promo_code_usage ENABLE ROW LEVEL SECURITY;

-- Organizations can view usage of their promo codes
CREATE POLICY "Organizations can view their promo code usage"
ON public.promo_code_usage
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.promo_codes
    WHERE promo_codes.id = promo_code_usage.promo_code_id
    AND promo_codes.organization_id = auth.uid()
  )
);

-- Anyone can insert usage records (for guest checkouts too)
CREATE POLICY "Anyone can insert promo code usage"
ON public.promo_code_usage
FOR INSERT
WITH CHECK (true);

-- Admins can view all usage
CREATE POLICY "Admins can view all promo code usage"
ON public.promo_code_usage
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create indexes for faster queries
CREATE INDEX idx_promo_code_usage_promo_code_id ON public.promo_code_usage(promo_code_id);
CREATE INDEX idx_promo_code_usage_created_at ON public.promo_code_usage(created_at);
CREATE INDEX idx_promo_code_usage_user_id ON public.promo_code_usage(user_id);