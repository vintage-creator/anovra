CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.customer_family_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  skin_type TEXT,
  concern TEXT,
  last_scan_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.customer_family_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers manage own family profiles" ON public.customer_family_profiles
  FOR ALL TO authenticated
  USING (auth.uid() = customer_id OR ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'))
  WITH CHECK (auth.uid() = customer_id OR ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'));

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'c0c0c0c0-c0c0-c0c0-c0c0-c0c0c0c0c0c0',
  'authenticated',
  'authenticated',
  'customer@anovra.africa',
  crypt('@Skin_customer1', gen_salt('bf')),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Shula Vera", "role": "customer", "email": "customer@anovra.africa"}',
  NOW() - INTERVAL '3 days',
  NOW(),
  '',
  '',
  '',
  ''
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, name, email, plan, is_verified, verification_status)
VALUES (
  'c0c0c0c0-c0c0-c0c0-c0c0-c0c0c0c0c0c0',
  'Shula Vera',
  'customer@anovra.africa',
  'free',
  true,
  'approved'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  plan = EXCLUDED.plan,
  is_verified = EXCLUDED.is_verified,
  verification_status = EXCLUDED.verification_status;
