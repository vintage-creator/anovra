ALTER TABLE public.team_members
  ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS team_members_auth_user_id_key
  ON public.team_members (auth_user_id) WHERE auth_user_id IS NOT NULL;

CREATE POLICY "Active branch staff read branch scans" ON public.scans
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.vendor_id = scans.vendor_id
        AND tm.auth_user_id = auth.uid()
        AND tm.status = 'active'
        AND tm.role IN ('Manager', 'Viewer')
    )
  );

CREATE POLICY "Active branch managers manage products" ON public.products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.vendor_id = products.vendor_id
        AND tm.auth_user_id = auth.uid()
        AND tm.status = 'active'
        AND tm.role = 'Manager'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.vendor_id = products.vendor_id
        AND tm.auth_user_id = auth.uid()
        AND tm.status = 'active'
        AND tm.role = 'Manager'
    )
  );
