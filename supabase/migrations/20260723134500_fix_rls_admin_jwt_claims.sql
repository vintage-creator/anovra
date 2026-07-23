DROP POLICY IF EXISTS "Allow individual write access to profiles" ON public.profiles;
CREATE POLICY "Allow individual write access to profiles" ON public.profiles
  FOR ALL USING (
    auth.uid() = id
    OR (auth.jwt()->'user_metadata'->>'role') = 'admin'
  );

DROP POLICY IF EXISTS "Allow vendor edit access to own products" ON public.products;
CREATE POLICY "Allow vendor edit access to own products" ON public.products
  FOR ALL USING (
    auth.uid() = vendor_id
    OR (auth.jwt()->'user_metadata'->>'role') = 'admin'
  );

DROP POLICY IF EXISTS "Allow select on scans" ON public.scans;
CREATE POLICY "Allow select on scans" ON public.scans
  FOR SELECT USING (
    auth.uid() = customer_id
    OR auth.uid() = vendor_id
    OR (auth.jwt()->'user_metadata'->>'role') = 'admin'
  );

DROP POLICY IF EXISTS "Allow edit/delete on scans" ON public.scans;
CREATE POLICY "Allow edit/delete on scans" ON public.scans
  FOR ALL USING (
    auth.uid() = customer_id
    OR (auth.jwt()->'user_metadata'->>'role') = 'admin'
  );

DROP POLICY IF EXISTS "Allow admins to read payments" ON public.payments;
CREATE POLICY "Allow admins to read payments" ON public.payments
  FOR SELECT USING (
    (auth.jwt()->'user_metadata'->>'role') = 'admin'
    OR auth.uid() = vendor_id
  );

DROP POLICY IF EXISTS "Allow vendors to create own payment records" ON public.payments;
CREATE POLICY "Allow vendors to create own payment records" ON public.payments
  FOR INSERT WITH CHECK (auth.uid() = vendor_id);

DROP POLICY IF EXISTS "Allow admins to manage payments" ON public.payments;
CREATE POLICY "Allow admins to manage payments" ON public.payments
  FOR ALL USING (
    (auth.jwt()->'user_metadata'->>'role') = 'admin'
  );

DROP POLICY IF EXISTS "Allow admin to manage vendor-documents" ON storage.objects;
CREATE POLICY "Allow admin to manage vendor-documents" ON storage.objects
  FOR ALL TO authenticated USING (
    bucket_id = 'vendor-documents'
    AND (auth.jwt()->'user_metadata'->>'role') = 'admin'
  );
