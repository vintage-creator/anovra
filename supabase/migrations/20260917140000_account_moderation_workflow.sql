ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS moderation_reason_code text,
  ADD COLUMN IF NOT EXISTS moderation_reason_details text,
  ADD COLUMN IF NOT EXISTS moderated_at timestamptz,
  ADD COLUMN IF NOT EXISTS moderated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.account_moderation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  account_name text NOT NULL,
  account_email text,
  account_type text NOT NULL,
  action text NOT NULL CHECK (action IN ('suspend', 'ban', 'reactivate', 'unban')),
  previous_status text NOT NULL,
  new_status text NOT NULL,
  reason_code text NOT NULL,
  reason_details text NOT NULL,
  internal_notes text,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS account_moderation_events_account_idx
  ON public.account_moderation_events(account_id, created_at DESC);
CREATE INDEX IF NOT EXISTS account_moderation_events_created_idx
  ON public.account_moderation_events(created_at DESC);

ALTER TABLE public.account_moderation_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Platform admins read moderation events" ON public.account_moderation_events;
CREATE POLICY "Platform admins read moderation events"
  ON public.account_moderation_events FOR SELECT
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR lower(coalesce(auth.jwt() ->> 'email', '')) IN ('admin@anovra.africa', 'hello@anovra.africa')
  );

CREATE OR REPLACE FUNCTION public.protect_profile_moderation_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  jwt_role text := coalesce(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() -> 'user_metadata' ->> 'role', '');
  jwt_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
BEGIN
  IF auth.role() <> 'service_role'
     AND jwt_role <> 'admin'
     AND jwt_email NOT IN ('admin@anovra.africa', 'hello@anovra.africa')
     AND (
       NEW.verification_status IS DISTINCT FROM OLD.verification_status
       OR NEW.is_verified IS DISTINCT FROM OLD.is_verified
       OR NEW.moderation_reason_code IS DISTINCT FROM OLD.moderation_reason_code
       OR NEW.moderation_reason_details IS DISTINCT FROM OLD.moderation_reason_details
       OR NEW.moderated_at IS DISTINCT FROM OLD.moderated_at
       OR NEW.moderated_by IS DISTINCT FROM OLD.moderated_by
     )
  THEN
    RAISE EXCEPTION 'Account moderation fields can only be changed by a platform administrator.'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_moderation_fields_trigger ON public.profiles;
CREATE TRIGGER protect_profile_moderation_fields_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_moderation_fields();

REVOKE INSERT, UPDATE, DELETE ON public.account_moderation_events FROM anon, authenticated;
GRANT SELECT ON public.account_moderation_events TO authenticated;
