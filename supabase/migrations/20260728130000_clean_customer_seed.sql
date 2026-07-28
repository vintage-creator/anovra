UPDATE auth.users
SET
  aud = 'authenticated',
  raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{full_name}',
    '"Shula Vera"'::jsonb,
    true
  ),
  updated_at = NOW()
WHERE email = 'customer@anovra.africa';

UPDATE public.profiles
SET
  name = 'Shula Vera',
  plan = 'free',
  is_verified = true,
  verification_status = 'approved'
WHERE id = 'c0c0c0c0-c0c0-c0c0-c0c0-c0c0c0c0c0c0';

DELETE FROM public.scans
WHERE id IN (
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222'
)
  AND customer_id = 'c0c0c0c0-c0c0-c0c0-c0c0-c0c0c0c0c0c0';

DELETE FROM public.customer_family_profiles
WHERE customer_id = 'c0c0c0c0-c0c0-c0c0-c0c0-c0c0c0c0c0c0'
  AND name IN ('Ada Customer', 'Shula Vera');
