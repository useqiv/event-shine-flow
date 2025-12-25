-- Create team_members table for organization staff
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'staff',
  permissions JSONB DEFAULT '{"can_view_contests": true, "can_edit_contests": false, "can_view_events": true, "can_edit_events": false, "can_scan_tickets": true, "can_view_analytics": false, "can_manage_payouts": false}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, email)
);

-- Enable RLS
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- RLS policies for team_members
CREATE POLICY "Organizations can manage their team members"
ON public.team_members
FOR ALL
USING (auth.uid() = organization_id);

CREATE POLICY "Team members can view their own membership"
ON public.team_members
FOR SELECT
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_team_members_updated_at
BEFORE UPDATE ON public.team_members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create contest_analytics table for deeper analytics
CREATE TABLE public.contest_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contest_id UUID NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  hour INTEGER,
  votes_count INTEGER NOT NULL DEFAULT 0,
  votes_revenue NUMERIC NOT NULL DEFAULT 0,
  unique_voters INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(contest_id, date, hour)
);

-- Enable RLS
ALTER TABLE public.contest_analytics ENABLE ROW LEVEL SECURITY;

-- RLS policies for contest_analytics
CREATE POLICY "Organizations can view their contest analytics"
ON public.contest_analytics
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.contests 
  WHERE contests.id = contest_analytics.contest_id 
  AND contests.organization_id = auth.uid()
));

-- Create function to track vote analytics
CREATE OR REPLACE FUNCTION public.track_vote_analytics()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.contest_analytics (contest_id, date, hour, votes_count, votes_revenue, unique_voters)
  VALUES (
    NEW.contest_id,
    CURRENT_DATE,
    EXTRACT(HOUR FROM NOW())::INTEGER,
    NEW.quantity,
    NEW.amount_paid,
    1
  )
  ON CONFLICT (contest_id, date, hour)
  DO UPDATE SET
    votes_count = contest_analytics.votes_count + NEW.quantity,
    votes_revenue = contest_analytics.votes_revenue + NEW.amount_paid,
    unique_voters = contest_analytics.unique_voters + 1;
  
  RETURN NEW;
END;
$$;

-- Create trigger to track vote analytics
CREATE TRIGGER track_vote_analytics_trigger
AFTER INSERT ON public.votes
FOR EACH ROW
EXECUTE FUNCTION public.track_vote_analytics();