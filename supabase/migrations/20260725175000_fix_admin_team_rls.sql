-- Fix RLS policy on admin_team table to allow users to fetch their own profile using uid, email or username.
DROP POLICY IF EXISTS "Allow users to view their own admin team profile" ON public.admin_team;

CREATE POLICY "Allow users to view their own admin team profile" ON public.admin_team
  FOR SELECT TO authenticated USING (
    id = auth.uid() OR email = auth.jwt()->>'email' OR username = auth.jwt()->>'email'
  );

-- Drop foreign key constraint on team_targets to support polymorphic referencing (both team_members and admin_team)
ALTER TABLE public.team_targets DROP CONSTRAINT IF EXISTS team_targets_team_member_id_fkey;
