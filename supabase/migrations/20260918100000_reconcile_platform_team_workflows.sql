ALTER TABLE public.admin_team
  DROP CONSTRAINT IF EXISTS admin_team_role_check;

ALTER TABLE public.admin_team
  ADD CONSTRAINT admin_team_role_check
  CHECK (role IN ('Marketing', 'Sales', 'Support', 'Representative', 'Operations', 'Manager'));

ALTER TABLE public.admin_team
  ALTER COLUMN password DROP NOT NULL;

-- Passwords belong in Supabase Auth only. Existing plaintext copies are removed.
UPDATE public.admin_team SET password = NULL WHERE password IS NOT NULL;

ALTER TABLE public.team_referral_events
  DROP CONSTRAINT IF EXISTS team_referral_events_team_member_id_fkey;

DROP POLICY IF EXISTS "Team members read own referral events" ON public.team_referral_events;
CREATE POLICY "Team members read own referral events"
  ON public.team_referral_events FOR SELECT TO authenticated
  USING (team_member_id = auth.uid());

DROP POLICY IF EXISTS "Team members read own targets" ON public.team_targets;
CREATE POLICY "Team members read own targets"
  ON public.team_targets FOR SELECT TO authenticated
  USING (team_member_id = auth.uid());

CREATE OR REPLACE FUNCTION public.get_platform_team_leaderboard()
RETURNS TABLE (
  rank bigint,
  member_id uuid,
  member_name text,
  member_role text,
  headshot_url text,
  scans bigint,
  vendors bigint,
  revenue numeric
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH authorised AS (
    SELECT 1
    FROM public.admin_team
    WHERE id = auth.uid() AND status = 'active'
  ), totals AS (
    SELECT
      at.id,
      at.name,
      at.role,
      at.headshot_url,
      count(tre.id) FILTER (WHERE tre.event_type = 'scan_completed') AS scans,
      count(tre.id) FILTER (WHERE tre.event_type = 'vendor_signup') AS vendors,
      coalesce(sum(tre.amount) FILTER (WHERE tre.event_type = 'purchase'), 0) AS revenue
    FROM public.admin_team at
    LEFT JOIN public.team_referral_events tre ON tre.team_member_id = at.id
    WHERE at.status = 'active' AND EXISTS (SELECT 1 FROM authorised)
    GROUP BY at.id, at.name, at.role, at.headshot_url
  )
  SELECT
    dense_rank() OVER (ORDER BY (scans + vendors * 3) DESC, revenue DESC, name ASC),
    id,
    name,
    role,
    headshot_url,
    scans,
    vendors,
    revenue
  FROM totals
  ORDER BY 1, name;
$$;

REVOKE ALL ON FUNCTION public.get_platform_team_leaderboard() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_platform_team_leaderboard() TO authenticated;
