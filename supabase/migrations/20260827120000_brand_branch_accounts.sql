ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_type TEXT,
  ADD COLUMN IF NOT EXISTS parent_brand_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS branch_status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS branch_location TEXT,
  ADD COLUMN IF NOT EXISTS branch_notes TEXT;

DO $$
BEGIN
  ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_account_type_check;
  ALTER TABLE public.profiles ADD CONSTRAINT profiles_account_type_check
    CHECK (account_type IN ('customer', 'vendor', 'brand', 'branch', 'admin', 'staff'));

  ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_branch_status_check;
  ALTER TABLE public.profiles ADD CONSTRAINT profiles_branch_status_check
    CHECK (branch_status IN ('active', 'inactive', 'suspended'));
END $$;

UPDATE public.profiles
SET account_type = CASE
  WHEN business_name IS NOT NULL THEN COALESCE(account_type, 'vendor')
  ELSE COALESCE(account_type, 'customer')
END
WHERE account_type IS NULL;

ALTER TABLE public.profiles
  ALTER COLUMN account_type SET DEFAULT 'vendor';

UPDATE public.profiles
SET slug = lower(regexp_replace(COALESCE(business_name, name, id::text), '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL;

UPDATE public.profiles
SET slug = trim(both '-' from slug)
WHERE slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS profiles_slug_idx
  ON public.profiles (slug)
  WHERE slug IS NOT NULL AND slug <> '';

CREATE INDEX IF NOT EXISTS profiles_parent_brand_idx
  ON public.profiles (parent_brand_id);

CREATE TABLE IF NOT EXISTS public.brand_branches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  branch_name TEXT NOT NULL,
  branch_email TEXT NOT NULL,
  branch_slug TEXT NOT NULL,
  location TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (brand_id, branch_id),
  UNIQUE (branch_slug)
);

ALTER TABLE public.brand_branches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Brands manage own branches" ON public.brand_branches;
CREATE POLICY "Brands manage own branches" ON public.brand_branches
  FOR ALL USING (
    auth.uid() = brand_id
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    auth.uid() = brand_id
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

DROP POLICY IF EXISTS "Branches read own brand membership" ON public.brand_branches;
CREATE POLICY "Branches read own brand membership" ON public.brand_branches
  FOR SELECT USING (auth.uid() = branch_id);

DROP POLICY IF EXISTS "Brand admins update branch profiles" ON public.profiles;
CREATE POLICY "Brand admins update branch profiles" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1
      FROM public.brand_branches bb
      WHERE bb.branch_id = profiles.id
        AND bb.brand_id = auth.uid()
    )
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.brand_branches bb
      WHERE bb.branch_id = profiles.id
        AND bb.brand_id = auth.uid()
    )
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

DROP POLICY IF EXISTS "Brands read branch scans" ON public.scans;
CREATE POLICY "Brands read branch scans" ON public.scans
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.brand_branches bb
      WHERE bb.branch_id = scans.vendor_id
        AND bb.brand_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Brands read branch payments" ON public.payments;
CREATE POLICY "Brands read branch payments" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.brand_branches bb
      WHERE bb.branch_id = payments.vendor_id
        AND bb.brand_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Brands manage branch products" ON public.products;
CREATE POLICY "Brands manage branch products" ON public.products
  FOR ALL USING (
    EXISTS (
      SELECT 1
      FROM public.brand_branches bb
      WHERE bb.branch_id = products.vendor_id
        AND bb.brand_id = auth.uid()
    )
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.brand_branches bb
      WHERE bb.branch_id = products.vendor_id
        AND bb.brand_id = auth.uid()
    )
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  raw_role TEXT := COALESCE(new.raw_user_meta_data->>'role', 'customer');
  raw_business TEXT := new.raw_user_meta_data->>'business_name';
  raw_slug TEXT := new.raw_user_meta_data->>'slug';
BEGIN
  INSERT INTO public.profiles (
    id,
    name,
    business_name,
    phone,
    nafdac_number,
    cac_number,
    cac_document_url,
    plan,
    is_verified,
    verification_status,
    account_type,
    parent_brand_id,
    slug,
    branch_status,
    location
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'New Partner'),
    raw_business,
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'nafdac_number',
    new.raw_user_meta_data->>'cac_number',
    new.raw_user_meta_data->>'cac_document_url',
    CASE WHEN raw_role = 'brand' THEN 'brand' ELSE 'free' END,
    false,
    'pending',
    CASE WHEN raw_role IN ('brand', 'branch') THEN raw_role WHEN raw_business IS NOT NULL THEN 'vendor' ELSE raw_role END,
    NULLIF(new.raw_user_meta_data->>'parent_brand_id', '')::uuid,
    trim(both '-' from lower(regexp_replace(COALESCE(raw_slug, raw_business, new.raw_user_meta_data->>'full_name', new.id::text), '[^a-zA-Z0-9]+', '-', 'g'))),
    COALESCE(new.raw_user_meta_data->>'branch_status', 'active'),
    new.raw_user_meta_data->>'location'
  )
  ON CONFLICT (id) DO UPDATE SET
    business_name = EXCLUDED.business_name,
    phone = EXCLUDED.phone,
    nafdac_number = EXCLUDED.nafdac_number,
    cac_number = EXCLUDED.cac_number,
    cac_document_url = EXCLUDED.cac_document_url,
    account_type = EXCLUDED.account_type,
    parent_brand_id = EXCLUDED.parent_brand_id,
    slug = EXCLUDED.slug,
    branch_status = EXCLUDED.branch_status,
    location = EXCLUDED.location;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
