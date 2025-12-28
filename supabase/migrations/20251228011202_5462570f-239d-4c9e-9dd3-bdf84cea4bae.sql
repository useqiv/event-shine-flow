-- Create fraud_rules table for automated fraud detection configuration
CREATE TABLE public.fraud_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL, -- 'rapid_votes', 'bulk_votes', 'suspicious_pattern', 'ip_duplicate', 'time_based'
  description TEXT,
  threshold_value NUMERIC NOT NULL,
  threshold_unit TEXT, -- 'votes', 'minutes', 'count', 'multiplier'
  severity TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  is_active BOOLEAN NOT NULL DEFAULT true,
  auto_flag BOOLEAN NOT NULL DEFAULT false, -- automatically flag transactions
  auto_block BOOLEAN NOT NULL DEFAULT false, -- automatically block transactions
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fraud_rules ENABLE ROW LEVEL SECURITY;

-- Only admins can manage fraud rules
CREATE POLICY "Admins can manage fraud rules"
ON public.fraud_rules
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_fraud_rules_updated_at
BEFORE UPDATE ON public.fraud_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default fraud rules
INSERT INTO public.fraud_rules (rule_name, rule_type, description, threshold_value, threshold_unit, severity, is_active, auto_flag) VALUES
('Rapid Voting Detection', 'rapid_votes', 'Detect when a user casts more than X votes within 10 minutes', 5, 'votes', 'medium', true, true),
('Bulk Vote Detection', 'bulk_votes', 'Flag single transactions with unusually high vote counts', 50, 'votes', 'high', true, true),
('Suspicious Vote Pattern', 'suspicious_pattern', 'Flag contestants receiving X times more votes than average', 3, 'multiplier', 'medium', true, false),
('Duplicate IP Detection', 'ip_duplicate', 'Flag multiple accounts voting from the same IP', 3, 'count', 'high', true, true),
('Off-Hours Activity', 'time_based', 'Flag high activity during unusual hours (2AM-5AM)', 10, 'votes', 'low', false, false);