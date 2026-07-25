-- Create Admin Team Table
CREATE TABLE IF NOT EXISTS public.admin_team (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Marketing', 'Sales', 'Support')),
  id_file_name TEXT,
  headshot_url TEXT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'removed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.admin_team ENABLE ROW LEVEL SECURITY;

-- Allow admins to manage the admin team (read, insert, update, delete)
CREATE POLICY "Allow admins to manage admin_team" ON public.admin_team
  FOR ALL TO authenticated USING (
    (auth.jwt()->'user_metadata'->>'role') = 'admin'
  )
  WITH CHECK (
    (auth.jwt()->'user_metadata'->>'role') = 'admin'
  );

-- Allow users to view their own admin team profile by email matching
CREATE POLICY "Allow users to view their own admin team profile" ON public.admin_team
  FOR SELECT TO authenticated USING (
    email = auth.jwt()->>'email'
  );
