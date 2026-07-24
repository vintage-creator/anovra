CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Viewer' CHECK (role IN ('Vendor', 'Manager', 'Viewer', 'Marketing', 'Sales', 'Support')),
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'active', 'suspended')),
  referral_code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (vendor_id, email)
);

CREATE TABLE IF NOT EXISTS public.team_referral_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id UUID REFERENCES public.team_members(id) ON DELETE SET NULL,
  vendor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('link_click', 'scan_started', 'scan_completed', 'vendor_signup', 'product_click', 'purchase')),
  customer_id UUID,
  referred_vendor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  amount NUMERIC DEFAULT 0,
  city TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.team_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  file_type TEXT,
  file_size TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.team_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.team_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id UUID REFERENCES public.team_members(id) ON DELETE CASCADE,
  metric TEXT NOT NULL CHECK (metric IN ('vendors_onboarded', 'scans_via_link', 'revenue_generated')),
  target NUMERIC NOT NULL DEFAULT 0,
  period_start DATE NOT NULL DEFAULT date_trunc('month', now())::date,
  period_end DATE NOT NULL DEFAULT (date_trunc('month', now()) + interval '1 month - 1 day')::date,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (team_member_id, metric, period_start)
);

CREATE TABLE IF NOT EXISTS public.storefront_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_referral_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storefront_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors manage own team members" ON public.team_members
  FOR ALL USING (
    auth.uid() = vendor_id OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    auth.uid() = vendor_id OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Team members read own membership" ON public.team_members
  FOR SELECT USING (lower(email) = lower(auth.jwt() ->> 'email'));

CREATE POLICY "Vendors and admins read referral events" ON public.team_referral_events
  FOR SELECT USING (
    auth.uid() = vendor_id OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admins manage referral events" ON public.team_referral_events
  FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Authenticated users read active team resources" ON public.team_resources
  FOR SELECT USING (is_active = true AND auth.role() = 'authenticated');

CREATE POLICY "Admins manage team resources" ON public.team_resources
  FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Authenticated users read active team announcements" ON public.team_announcements
  FOR SELECT USING (is_active = true AND auth.role() = 'authenticated');

CREATE POLICY "Admins manage team announcements" ON public.team_announcements
  FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Vendors and admins read team targets" ON public.team_targets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.id = team_targets.team_member_id
      AND (tm.vendor_id = auth.uid() OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
    )
  );

CREATE POLICY "Admins manage team targets" ON public.team_targets
  FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Public reads approved storefront reviews" ON public.storefront_reviews
  FOR SELECT USING (status = 'approved');

CREATE POLICY "Authenticated users create storefront reviews" ON public.storefront_reviews
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Vendors read own storefront reviews" ON public.storefront_reviews
  FOR SELECT USING (
    auth.uid() = vendor_id OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admins manage storefront reviews" ON public.storefront_reviews
  FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
