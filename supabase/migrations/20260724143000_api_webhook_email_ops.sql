ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email TEXT;

CREATE TABLE IF NOT EXISTS public.vendor_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT 'Live API key',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.webhook_delivery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  endpoint_url TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  response_status INTEGER,
  response_body TEXT,
  success BOOLEAN NOT NULL DEFAULT FALSE,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.onboarding_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  requested_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  request_type TEXT NOT NULL DEFAULT 'brand_onboarding',
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'scheduled', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.email_delivery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  template TEXT,
  status TEXT NOT NULL DEFAULT 'queued',
  provider_response JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS vendor_api_keys_vendor_idx ON public.vendor_api_keys(vendor_id);
CREATE INDEX IF NOT EXISTS webhook_delivery_logs_vendor_idx ON public.webhook_delivery_logs(vendor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS onboarding_requests_vendor_idx ON public.onboarding_requests(vendor_id, created_at DESC);

ALTER TABLE public.vendor_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_delivery_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_delivery_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors read own API key metadata" ON public.vendor_api_keys
  FOR SELECT TO authenticated
  USING (auth.uid() = vendor_id OR ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'));

CREATE POLICY "Admins manage API keys" ON public.vendor_api_keys
  FOR ALL TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Vendors read own webhook delivery logs" ON public.webhook_delivery_logs
  FOR SELECT TO authenticated
  USING (auth.uid() = vendor_id OR ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'));

CREATE POLICY "Admins manage webhook delivery logs" ON public.webhook_delivery_logs
  FOR ALL TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Vendors create own onboarding requests" ON public.onboarding_requests
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = vendor_id OR auth.uid() = requested_by);

CREATE POLICY "Vendors read own onboarding requests" ON public.onboarding_requests
  FOR SELECT TO authenticated
  USING (auth.uid() = vendor_id OR auth.uid() = requested_by OR ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'));

CREATE POLICY "Admins manage onboarding requests" ON public.onboarding_requests
  FOR ALL TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins read email logs" ON public.email_delivery_logs
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
