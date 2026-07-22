-- 1. Create Profiles Table (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  business_name TEXT,
  phone TEXT,
  nafdac_number TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'basic', 'premium')),
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Allow individual write access to profiles" ON public.profiles
  FOR ALL USING (auth.uid() = id);


-- 2. Create Products Table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  brand TEXT DEFAULT 'Own Brand',
  price NUMERIC DEFAULT 0,
  description TEXT DEFAULT '',
  image_url TEXT,
  nafdac_status TEXT DEFAULT 'approved' CHECK (nafdac_status IN ('approved', 'pending', 'flagged')),
  category TEXT DEFAULT 'Skincare',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to products" ON public.products
  FOR SELECT USING (true);

CREATE POLICY "Allow vendor edit access to own products" ON public.products
  FOR ALL USING (auth.uid() = vendor_id);


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
  FOR SELECT USING (true);

CREATE POLICY "Allow insert on scans" ON public.scans
  FOR INSERT WITH CHECK (true);


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


-- 5. Auto-Create Profile Row on Signup Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, plan, is_verified)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'New Partner'),
    'free',
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 6. Setup Public Storage Buckets if missing (Insert entries)
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('vendor-documents', 'vendor-documents', true),
  ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;
