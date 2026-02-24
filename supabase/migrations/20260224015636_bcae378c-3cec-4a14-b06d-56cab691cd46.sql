-- Drop the overly permissive guest SELECT policy that leaks PII
DROP POLICY IF EXISTS "Guests can view their own tickets by email lookup" ON public.tickets;