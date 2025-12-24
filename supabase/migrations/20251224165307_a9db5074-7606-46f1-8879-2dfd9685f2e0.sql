-- Enable real-time for contestants table to track vote updates
ALTER TABLE public.contestants REPLICA IDENTITY FULL;

-- Enable real-time for contests table to track total votes
ALTER TABLE public.contests REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.contestants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.contests;