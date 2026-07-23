ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending';

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_plan_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_plan_check CHECK (plan IN ('free', 'basic', 'premium', 'brand'));

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_verification_status_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_verification_status_check CHECK (verification_status IN ('pending', 'approved', 'suspended', 'banned'));

ALTER TABLE public.products
  ALTER COLUMN nafdac_status SET DEFAULT 'pending';

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID REFERENCES auth.users ON DELETE SET NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'NGN',
  plan TEXT CHECK (plan IN ('basic', 'premium', 'brand')),
  status TEXT DEFAULT 'success' CHECK (status IN ('success', 'pending', 'failed')),
  provider TEXT DEFAULT 'paystack',
  reference TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'payments'
      AND policyname = 'Allow admins to read payments'
  ) THEN
    CREATE POLICY "Allow admins to read payments" ON public.payments
      FOR SELECT USING (
        (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin'
        OR auth.uid() = vendor_id
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'payments'
      AND policyname = 'Allow vendors to create own payment records'
  ) THEN
    CREATE POLICY "Allow vendors to create own payment records" ON public.payments
      FOR INSERT WITH CHECK (auth.uid() = vendor_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'payments'
      AND policyname = 'Allow admins to manage payments'
  ) THEN
    CREATE POLICY "Allow admins to manage payments" ON public.payments
      FOR ALL USING (
        (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin'
      );
  END IF;
END $$;
