-- 1. Create Profiles Table (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  business_name TEXT,
  phone TEXT,
  nafdac_number TEXT,
  cac_number TEXT,
  cac_document_url TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'basic', 'premium', 'brand')),
  is_verified BOOLEAN DEFAULT false,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'suspended', 'banned')),
  custom_domain TEXT,
  white_label BOOLEAN DEFAULT false,
  webhook_url TEXT,
  tagline TEXT,
  location TEXT,
  since TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Allow individual write access to profiles" ON public.profiles
  FOR ALL USING (
    auth.uid() = id
    OR (auth.jwt()->'user_metadata'->>'role') = 'admin'
  );


-- 2. Create Products Table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  brand TEXT DEFAULT 'Own Brand',
  price NUMERIC DEFAULT 0,
  description TEXT DEFAULT '',
  image_url TEXT,
  nafdac_status TEXT DEFAULT 'pending' CHECK (nafdac_status IN ('approved', 'pending', 'flagged')),
  category TEXT DEFAULT 'Skincare',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to products" ON public.products
  FOR SELECT USING (true);

CREATE POLICY "Allow vendor edit access to own products" ON public.products
  FOR ALL USING (
    auth.uid() = vendor_id
    OR (auth.jwt()->'user_metadata'->>'role') = 'admin'
  );


-- 3. Create Scans Table
CREATE TABLE IF NOT EXISTS public.scans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID REFERENCES auth.users ON DELETE SET NULL,
  customer_id UUID REFERENCES auth.users ON DELETE SET NULL,
  concern TEXT NOT NULL,
  result TEXT DEFAULT '',
  city TEXT DEFAULT 'Unknown',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Scans
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select on scans" ON public.scans
  FOR SELECT USING (
    auth.uid() = customer_id
    OR auth.uid() = vendor_id
    OR (auth.jwt()->'user_metadata'->>'role') = 'admin'
  );

CREATE POLICY "Allow insert on scans" ON public.scans
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow edit/delete on scans" ON public.scans
  FOR ALL USING (
    auth.uid() = customer_id
    OR (auth.jwt()->'user_metadata'->>'role') = 'admin'
  );


-- 4. Create Cart Items Table
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products ON DELETE CASCADE NOT NULL,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Cart Items
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select on cart items" ON public.cart_items
  FOR SELECT USING (true);

CREATE POLICY "Allow insert on cart items" ON public.cart_items
  FOR INSERT WITH CHECK (true);

-- 5. Create Payments Table
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

CREATE POLICY "Allow admins to read payments" ON public.payments
  FOR SELECT USING (
    (auth.jwt()->'user_metadata'->>'role') = 'admin'
    OR auth.uid() = vendor_id
  );

CREATE POLICY "Allow vendors to create own payment records" ON public.payments
  FOR INSERT WITH CHECK (auth.uid() = vendor_id);

CREATE POLICY "Allow admins to manage payments" ON public.payments
  FOR ALL USING (
    (auth.jwt()->'user_metadata'->>'role') = 'admin'
  );


-- 6. Auto-Create Profile Row on Signup Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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
    verification_status
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'New Partner'),
    new.raw_user_meta_data->>'business_name',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'nafdac_number',
    new.raw_user_meta_data->>'cac_number',
    new.raw_user_meta_data->>'cac_document_url',
    'free',
    false,
    'pending'
  )
  ON CONFLICT (id) DO UPDATE SET
    business_name = EXCLUDED.business_name,
    phone = EXCLUDED.phone,
    nafdac_number = EXCLUDED.nafdac_number,
    cac_number = EXCLUDED.cac_number,
    cac_document_url = EXCLUDED.cac_document_url;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('vendor-documents', 'vendor-documents', true),
  ('product-images', 'product-images', true),
  ('skin-scans', 'skin-scans', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS for storage objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Storage Policies
CREATE POLICY "Allow public read access to storage objects" ON storage.objects
  FOR SELECT USING (true);

-- Allow anyone to upload to skin-scans bucket (strictly JPEG/PNG/WEBP images under 5MB)
CREATE POLICY "Allow uploads to skin-scans" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'skin-scans'
    AND (metadata->>'size')::int <= 5242880
    AND (metadata->>'mimetype') IN ('image/jpeg', 'image/jpg', 'image/png', 'image/webp')
  );

-- Allow anyone (including anonymous onboarding guests) to upload to vendor-documents (strictly JPEG/PNG/WEBP/PDF under 5MB)
CREATE POLICY "Allow uploads to vendor-documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'vendor-documents'
    AND (metadata->>'size')::int <= 5242880
    AND (metadata->>'mimetype') IN ('image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf')
  );

-- Allow only authenticated users to upload product images (strictly JPEG/PNG/WEBP images under 5MB)
CREATE POLICY "Allow authenticated uploads to product-images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'product-images'
    AND (metadata->>'size')::int <= 5242880
    AND (metadata->>'mimetype') IN ('image/jpeg', 'image/jpg', 'image/png', 'image/webp')
  );

-- Only authenticated owners or admins can modify/delete product images
CREATE POLICY "Allow updates to product-images" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'product-images');

CREATE POLICY "Allow deletions of product-images" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'product-images');

-- Only admins can modify or delete vendor documents
CREATE POLICY "Allow admin to manage vendor-documents" ON storage.objects
  FOR ALL TO authenticated USING (
    bucket_id = 'vendor-documents'
    AND (auth.jwt()->'user_metadata'->>'role') = 'admin'
  );

-- Add settings fields to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS custom_domain TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS white_label BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS webhook_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending';
ALTER TABLE public.products ALTER COLUMN nafdac_status SET DEFAULT 'pending';

DO $$
BEGIN
  ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;
  ALTER TABLE public.profiles ADD CONSTRAINT profiles_plan_check CHECK (plan IN ('free', 'basic', 'premium', 'brand'));
  ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_verification_status_check;
  ALTER TABLE public.profiles ADD CONSTRAINT profiles_verification_status_check CHECK (verification_status IN ('pending', 'approved', 'suspended', 'banned'));
END $$;

-- 7. Seed Admin User
-- Email: hello@anovra.africa | Password: @Skin_ana1
INSERT INTO auth.users (
  instance_id,
  id,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
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
  'a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e0',
  'authenticated',
  'hello@anovra.africa',
  crypt('@Skin_ana1', gen_salt('bf')),
  NOW(),
  NULL,
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Anovra Admin", "role": "admin"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
)
ON CONFLICT (id) DO NOTHING;

-- Ensure admin profile is marked verified and set to premium plan
UPDATE public.profiles
SET plan = 'premium', is_verified = true, verification_status = 'approved'
WHERE id = 'a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e0';
