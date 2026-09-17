-- Keep Brand HQ identity separate from branch identity during registration.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  raw_role TEXT := COALESCE(new.raw_user_meta_data->>'role', 'customer');
  raw_business TEXT := NULLIF(trim(new.raw_user_meta_data->>'business_name'), '');
  raw_slug TEXT := NULLIF(trim(new.raw_user_meta_data->>'slug'), '');
BEGIN
  INSERT INTO public.profiles (
    id,
    name,
    email,
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
    location,
    tagline
  )
  VALUES (
    new.id,
    COALESCE(NULLIF(trim(new.raw_user_meta_data->>'full_name'), ''), 'New Partner'),
    new.email,
    raw_business,
    NULLIF(trim(new.raw_user_meta_data->>'phone'), ''),
    NULLIF(trim(new.raw_user_meta_data->>'nafdac_number'), ''),
    NULLIF(trim(new.raw_user_meta_data->>'cac_number'), ''),
    NULLIF(trim(new.raw_user_meta_data->>'cac_document_url'), ''),
    CASE WHEN raw_role = 'brand' THEN 'brand' ELSE 'free' END,
    false,
    'pending',
    CASE WHEN raw_role IN ('brand', 'branch') THEN raw_role WHEN raw_business IS NOT NULL THEN 'vendor' ELSE raw_role END,
    NULLIF(new.raw_user_meta_data->>'parent_brand_id', '')::uuid,
    trim(both '-' from lower(regexp_replace(COALESCE(raw_slug, raw_business, new.raw_user_meta_data->>'full_name', new.id::text), '[^a-zA-Z0-9]+', '-', 'g'))),
    COALESCE(NULLIF(trim(new.raw_user_meta_data->>'branch_status'), ''), 'active'),
    NULLIF(trim(new.raw_user_meta_data->>'location'), ''),
    CASE WHEN raw_role = 'brand' THEN NULLIF(trim(new.raw_user_meta_data->>'tagline'), '') ELSE NULL END
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    business_name = EXCLUDED.business_name,
    phone = EXCLUDED.phone,
    nafdac_number = EXCLUDED.nafdac_number,
    cac_number = EXCLUDED.cac_number,
    cac_document_url = EXCLUDED.cac_document_url,
    account_type = EXCLUDED.account_type,
    parent_brand_id = EXCLUDED.parent_brand_id,
    slug = EXCLUDED.slug,
    branch_status = EXCLUDED.branch_status,
    location = EXCLUDED.location,
    tagline = CASE WHEN EXCLUDED.account_type = 'brand' THEN EXCLUDED.tagline ELSE public.profiles.tagline END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
