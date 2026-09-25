-- Keep only a keyed, non-reversible email digest and the original trial date after erasure.
CREATE SCHEMA IF NOT EXISTS private;

CREATE TABLE IF NOT EXISTS private.account_fingerprint_secret (
  id integer PRIMARY KEY CHECK (id = 1),
  secret bytea NOT NULL
);
INSERT INTO private.account_fingerprint_secret (id, secret)
VALUES (1, extensions.gen_random_bytes(32))
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS private.account_trial_history (
  email_fingerprint text PRIMARY KEY,
  first_registered_at timestamptz NOT NULL
);
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
REVOKE ALL ON private.account_fingerprint_secret, private.account_trial_history FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION private.preserve_trial_start()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  earlier_start timestamptz;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.email IS NOT NULL
     AND lower(trim(OLD.email)) IS DISTINCT FROM lower(trim(NEW.email)) THEN
    INSERT INTO private.account_trial_history (email_fingerprint, first_registered_at)
    SELECT encode(extensions.hmac(convert_to(lower(trim(OLD.email)), 'UTF8'), s.secret, 'sha256'), 'hex'),
           COALESCE(OLD.created_at, now())
    FROM private.account_fingerprint_secret s WHERE s.id = 1
    ON CONFLICT (email_fingerprint) DO UPDATE SET
      first_registered_at = LEAST(private.account_trial_history.first_registered_at, EXCLUDED.first_registered_at);
  END IF;
  SELECT h.first_registered_at INTO earlier_start
  FROM private.account_trial_history h
  CROSS JOIN private.account_fingerprint_secret s
  WHERE s.id = 1
    AND h.email_fingerprint = encode(extensions.hmac(convert_to(lower(trim(NEW.email)), 'UTF8'), s.secret, 'sha256'), 'hex');
  IF earlier_start IS NOT NULL THEN
    NEW.created_at := LEAST(COALESCE(NEW.created_at, now()), earlier_start);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS preserve_trial_start_on_profile ON public.profiles;
CREATE TRIGGER preserve_trial_start_on_profile
BEFORE INSERT OR UPDATE OF email ON public.profiles
FOR EACH ROW EXECUTE FUNCTION private.preserve_trial_start();

-- Called only by the service-role edge function after password re-authentication.
CREATE OR REPLACE FUNCTION public.erase_account_and_owned_data(target_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  account_kind text;
  owned_ids uuid[];
  staff_ids uuid[];
  all_ids uuid[];
BEGIN
  SELECT account_type INTO account_kind FROM public.profiles WHERE id = target_id FOR UPDATE;
  IF account_kind NOT IN ('brand', 'vendor', 'customer') OR account_kind IS NULL THEN
    RAISE EXCEPTION 'This account cannot be self-deleted.';
  END IF;

  SELECT array_agg(DISTINCT id) INTO owned_ids FROM (
    SELECT target_id AS id
    UNION
    SELECT p.id FROM public.profiles p
      WHERE account_kind = 'brand' AND p.parent_brand_id = target_id
    UNION
    SELECT b.branch_id FROM public.brand_branches b
      WHERE account_kind = 'brand' AND b.brand_id = target_id
  ) owners;

  SELECT array_agg(DISTINCT tm.auth_user_id) INTO staff_ids
  FROM public.team_members tm
  WHERE tm.vendor_id = ANY(owned_ids)
    AND tm.auth_user_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.team_members other
      WHERE other.auth_user_id = tm.auth_user_id
        AND other.vendor_id <> ALL(owned_ids)
    );
  all_ids := owned_ids || COALESCE(staff_ids, ARRAY[]::uuid[]);

  INSERT INTO private.account_trial_history (email_fingerprint, first_registered_at)
  SELECT encode(extensions.hmac(convert_to(lower(trim(u.email)), 'UTF8'), s.secret, 'sha256'), 'hex'),
         MIN(COALESCE(p.created_at, u.created_at))
  FROM auth.users u
  JOIN public.profiles p ON p.id = u.id
  CROSS JOIN private.account_fingerprint_secret s
  WHERE u.id = ANY(owned_ids) AND u.email IS NOT NULL AND s.id = 1
  GROUP BY u.email, s.secret
  ON CONFLICT (email_fingerprint) DO UPDATE SET
    first_registered_at = LEAST(private.account_trial_history.first_registered_at, EXCLUDED.first_registered_at);

  DELETE FROM public.email_delivery_logs l WHERE lower(l.recipient) IN
    (SELECT lower(u.email) FROM auth.users u WHERE u.id = ANY(all_ids) AND u.email IS NOT NULL);
  DELETE FROM public.account_moderation_events e
    WHERE e.account_id = ANY(all_ids) OR e.actor_id = ANY(all_ids)
       OR lower(e.account_email) IN (SELECT lower(u.email) FROM auth.users u WHERE u.id = ANY(all_ids))
       OR lower(e.actor_email) IN (SELECT lower(u.email) FROM auth.users u WHERE u.id = ANY(all_ids));
  DELETE FROM public.webhook_delivery_logs WHERE vendor_id = ANY(owned_ids);
  DELETE FROM public.team_referral_events
    WHERE customer_id = ANY(all_ids) OR vendor_id = ANY(owned_ids)
       OR referred_vendor_id = ANY(owned_ids);
  DELETE FROM public.storefront_reviews
    WHERE customer_id = ANY(all_ids) OR vendor_id = ANY(owned_ids);
  DELETE FROM public.onboarding_requests
    WHERE requested_by = ANY(all_ids) OR vendor_id = ANY(owned_ids);
  DELETE FROM public.scans
    WHERE customer_id = ANY(all_ids) OR vendor_id = ANY(owned_ids);
  DELETE FROM public.payments WHERE vendor_id = ANY(owned_ids);
  DELETE FROM public.products WHERE vendor_id = ANY(owned_ids);
  DELETE FROM auth.users WHERE id = ANY(all_ids);
END;
$$;

REVOKE ALL ON FUNCTION public.erase_account_and_owned_data(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.erase_account_and_owned_data(uuid) TO service_role;
