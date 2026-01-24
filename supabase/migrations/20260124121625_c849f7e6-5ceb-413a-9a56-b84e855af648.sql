-- Grant INSERT permission to anon role for free ticket claims
GRANT INSERT ON public.tickets TO anon;

-- Also grant SELECT so guests can check their existing tickets
GRANT SELECT ON public.tickets TO anon;