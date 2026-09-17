DROP POLICY IF EXISTS "Allow admins to manage admin_team" ON public.admin_team;

CREATE POLICY "Allow admins to manage admin_team" ON public.admin_team
  FOR ALL TO authenticated USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    OR lower(coalesce(auth.jwt() ->> 'email', '')) IN ('admin@anovra.africa', 'hello@anovra.africa')
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    OR lower(coalesce(auth.jwt() ->> 'email', '')) IN ('admin@anovra.africa', 'hello@anovra.africa')
  );
