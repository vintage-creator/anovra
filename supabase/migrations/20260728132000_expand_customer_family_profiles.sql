ALTER TABLE public.customer_family_profiles
  ADD COLUMN IF NOT EXISTS relationship TEXT,
  ADD COLUMN IF NOT EXISTS age_band TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT;
