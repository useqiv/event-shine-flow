-- Add unique constraint on qr_code to guarantee no two tickets ever have the same QR code
ALTER TABLE public.tickets ADD CONSTRAINT tickets_qr_code_unique UNIQUE (qr_code);