-- Create table for multi-currency wallet balances
CREATE TABLE public.wallet_currency_balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  currency TEXT NOT NULL,
  balance NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(wallet_id, currency)
);

-- Enable RLS
ALTER TABLE public.wallet_currency_balances ENABLE ROW LEVEL SECURITY;

-- Users can view their own currency balances
CREATE POLICY "Users can view their own currency balances"
ON public.wallet_currency_balances
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.wallets
    WHERE wallets.id = wallet_currency_balances.wallet_id
    AND wallets.user_id = auth.uid()
  )
);

-- Users can insert their own currency balances (for initial funding)
CREATE POLICY "Users can insert their own currency balances"
ON public.wallet_currency_balances
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.wallets
    WHERE wallets.id = wallet_currency_balances.wallet_id
    AND wallets.user_id = auth.uid()
  )
);

-- Users can update their own currency balances
CREATE POLICY "Users can update their own currency balances"
ON public.wallet_currency_balances
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.wallets
    WHERE wallets.id = wallet_currency_balances.wallet_id
    AND wallets.user_id = auth.uid()
  )
);

-- Admins can manage all currency balances
CREATE POLICY "Admins can manage all currency balances"
ON public.wallet_currency_balances
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_wallet_currency_balances_updated_at
BEFORE UPDATE ON public.wallet_currency_balances
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_wallet_currency_balances_wallet_id ON public.wallet_currency_balances(wallet_id);

-- Migrate existing balances to the new table
INSERT INTO public.wallet_currency_balances (wallet_id, currency, balance)
SELECT id, balance_currency, balance
FROM public.wallets
WHERE balance > 0;