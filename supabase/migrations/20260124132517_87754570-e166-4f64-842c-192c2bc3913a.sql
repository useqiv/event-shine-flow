-- Re-enable RLS on tickets table since guest ticket claiming works
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;