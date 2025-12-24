-- Add organization_id to contests and events tables
ALTER TABLE public.contests ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.profiles(id);
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.profiles(id);

-- Create payouts table for organization payouts
CREATE TABLE IF NOT EXISTS public.payouts (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount numeric NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    payment_method text NOT NULL DEFAULT 'bank',
    bank_name text,
    account_number text,
    account_name text,
    usdt_address text,
    reference_id text,
    processed_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations can view their own payouts"
ON public.payouts FOR SELECT
USING (auth.uid() = organization_id);

CREATE POLICY "Organizations can insert their own payouts"
ON public.payouts FOR INSERT
WITH CHECK (auth.uid() = organization_id);

CREATE POLICY "Admins can manage all payouts"
ON public.payouts FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create promo_codes table for marketing
CREATE TABLE IF NOT EXISTS public.promo_codes (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    code text NOT NULL UNIQUE,
    discount_type text NOT NULL DEFAULT 'percentage',
    discount_value numeric NOT NULL,
    max_uses integer,
    current_uses integer NOT NULL DEFAULT 0,
    valid_from timestamp with time zone NOT NULL DEFAULT now(),
    valid_until timestamp with time zone,
    is_active boolean NOT NULL DEFAULT true,
    applicable_to text NOT NULL DEFAULT 'all',
    contest_id uuid REFERENCES public.contests(id),
    event_id uuid REFERENCES public.events(id),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations can manage their own promo codes"
ON public.promo_codes FOR ALL
USING (auth.uid() = organization_id);

CREATE POLICY "Anyone can view active promo codes"
ON public.promo_codes FOR SELECT
USING (is_active = true AND (valid_until IS NULL OR valid_until > now()));

-- Create support_tickets table
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject text NOT NULL,
    description text NOT NULL,
    category text NOT NULL DEFAULT 'general',
    priority text NOT NULL DEFAULT 'medium',
    status text NOT NULL DEFAULT 'open',
    assigned_to uuid REFERENCES public.profiles(id),
    resolved_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tickets"
ON public.support_tickets FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tickets"
ON public.support_tickets FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tickets"
ON public.support_tickets FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all tickets"
ON public.support_tickets FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create support_ticket_messages table
CREATE TABLE IF NOT EXISTS public.support_ticket_messages (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message text NOT NULL,
    is_staff_reply boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages on their tickets"
ON public.support_ticket_messages FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.support_tickets 
    WHERE id = ticket_id AND user_id = auth.uid()
));

CREATE POLICY "Users can add messages to their tickets"
ON public.support_ticket_messages FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM public.support_tickets 
    WHERE id = ticket_id AND user_id = auth.uid()
));

CREATE POLICY "Admins can manage all messages"
ON public.support_ticket_messages FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create organization_settings table for bank/payout details
CREATE TABLE IF NOT EXISTS public.organization_settings (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    company_name text,
    company_email text,
    company_phone text,
    company_address text,
    bank_name text,
    account_number text,
    account_name text,
    usdt_address text,
    preferred_payout_method text DEFAULT 'bank',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations can view their own settings"
ON public.organization_settings FOR SELECT
USING (auth.uid() = organization_id);

CREATE POLICY "Organizations can insert their own settings"
ON public.organization_settings FOR INSERT
WITH CHECK (auth.uid() = organization_id);

CREATE POLICY "Organizations can update their own settings"
ON public.organization_settings FOR UPDATE
USING (auth.uid() = organization_id);

-- Create qr_scan_logs table for event check-ins
CREATE TABLE IF NOT EXISTS public.qr_scan_logs (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    scanned_by uuid REFERENCES public.profiles(id),
    scan_result text NOT NULL DEFAULT 'success',
    scanned_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.qr_scan_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Event organizers can view scan logs"
ON public.qr_scan_logs FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.events 
    WHERE id = event_id AND organization_id = auth.uid()
));

CREATE POLICY "Event organizers can insert scan logs"
ON public.qr_scan_logs FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM public.events 
    WHERE id = event_id AND organization_id = auth.uid()
));

CREATE POLICY "Admins can manage all scan logs"
ON public.qr_scan_logs FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add triggers for updated_at
CREATE TRIGGER update_payouts_updated_at
    BEFORE UPDATE ON public.payouts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_promo_codes_updated_at
    BEFORE UPDATE ON public.promo_codes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at
    BEFORE UPDATE ON public.support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organization_settings_updated_at
    BEFORE UPDATE ON public.organization_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Update RLS on contests to allow organizations to manage their own
CREATE POLICY "Organizations can manage their own contests"
ON public.contests FOR ALL
USING (auth.uid() = organization_id);

-- Update RLS on events to allow organizations to manage their own
CREATE POLICY "Organizations can manage their own events"
ON public.events FOR ALL
USING (auth.uid() = organization_id);

-- Organizations should be able to view contestants for their contests
CREATE POLICY "Organizations can manage contestants for their contests"
ON public.contestants FOR ALL
USING (EXISTS (
    SELECT 1 FROM public.contests 
    WHERE id = contest_id AND organization_id = auth.uid()
));

-- Organizations should be able to manage ticket types for their events
CREATE POLICY "Organizations can manage ticket types for their events"
ON public.ticket_types FOR ALL
USING (EXISTS (
    SELECT 1 FROM public.events 
    WHERE id = event_id AND organization_id = auth.uid()
));

-- Organizations can view tickets for their events
CREATE POLICY "Organizations can view tickets for their events"
ON public.tickets FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.events 
    WHERE id = event_id AND organization_id = auth.uid()
));

-- Organizations can view votes for their contests
CREATE POLICY "Organizations can view votes for their contests"
ON public.votes FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.contests 
    WHERE id = contest_id AND organization_id = auth.uid()
));