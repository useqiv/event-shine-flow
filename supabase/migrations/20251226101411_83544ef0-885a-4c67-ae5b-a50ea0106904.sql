-- Add ticket_type_id column to promo_codes to allow discounts for specific ticket types
ALTER TABLE public.promo_codes
ADD COLUMN ticket_type_id uuid REFERENCES public.ticket_types(id) ON DELETE SET NULL;

-- Add index for faster lookups
CREATE INDEX idx_promo_codes_ticket_type_id ON public.promo_codes(ticket_type_id);

-- Add comment for documentation
COMMENT ON COLUMN public.promo_codes.ticket_type_id IS 'Optional: If set, this promo code only applies to this specific ticket type';