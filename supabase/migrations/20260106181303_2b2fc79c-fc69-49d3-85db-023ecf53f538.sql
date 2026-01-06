-- Security Hardening: Fix critical RLS vulnerabilities

-- 1. Fix donations table - restrict to authenticated users only
DROP POLICY IF EXISTS "Anyone can view donations" ON public.donations;
CREATE POLICY "Authenticated users can view donations" 
ON public.donations FOR SELECT 
TO authenticated
USING (true);

-- 2. Fix influencer_links - add proper ownership checks
DROP POLICY IF EXISTS "Anyone can view active influencer links" ON public.influencer_links;
CREATE POLICY "Public can view active influencer links" 
ON public.influencer_links FOR SELECT 
USING (is_active = true);

CREATE POLICY "Organizations can manage their influencer links" 
ON public.influencer_links FOR ALL 
TO authenticated
USING (organization_id = auth.uid())
WITH CHECK (organization_id = auth.uid());

-- 3. Fix team_members - ensure proper access control
DROP POLICY IF EXISTS "Team members can view their team" ON public.team_members;
CREATE POLICY "Users can view teams they belong to" 
ON public.team_members FOR SELECT 
TO authenticated
USING (user_id = auth.uid() OR organization_id = auth.uid());

-- 4. Fix campaigns - restrict updates/deletes to owners
DROP POLICY IF EXISTS "Anyone can update campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Anyone can delete campaigns" ON public.campaigns;

CREATE POLICY "Owners can update their campaigns" 
ON public.campaigns FOR UPDATE 
TO authenticated
USING (creator_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (creator_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners can delete their campaigns" 
ON public.campaigns FOR DELETE 
TO authenticated
USING (creator_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- 5. Fix contests - restrict updates/deletes to owners
DROP POLICY IF EXISTS "Anyone can update contests" ON public.contests;
DROP POLICY IF EXISTS "Anyone can delete contests" ON public.contests;

CREATE POLICY "Owners can update their contests" 
ON public.contests FOR UPDATE 
TO authenticated
USING (organization_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (organization_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners can delete their contests" 
ON public.contests FOR DELETE 
TO authenticated
USING (organization_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- 6. Fix events - restrict updates/deletes to owners  
DROP POLICY IF EXISTS "Anyone can update events" ON public.events;
DROP POLICY IF EXISTS "Anyone can delete events" ON public.events;

CREATE POLICY "Owners can update their events" 
ON public.events FOR UPDATE 
TO authenticated
USING (organization_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (organization_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners can delete their events" 
ON public.events FOR DELETE 
TO authenticated
USING (organization_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));