-- Create refunds table
CREATE TABLE public.refunds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_transaction_type TEXT NOT NULL, -- 'vote' or 'ticket'
  original_transaction_id UUID NOT NULL,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'processed'
  processed_by UUID,
  processed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage all refunds"
ON public.refunds
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own refunds"
ON public.refunds
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can request refunds"
ON public.refunds
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Update trigger for updated_at
CREATE TRIGGER update_refunds_updated_at
BEFORE UPDATE ON public.refunds
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();