-- Purge all orphaned records across database tables and enforce CASCADE deletion on user delete.

-- 1. Purge existing orphaned payments (where vendor does not exist in auth.users or profiles)
DELETE FROM public.payments
WHERE vendor_id IS NULL
   OR vendor_id NOT IN (SELECT id FROM auth.users)
   OR vendor_id NOT IN (SELECT id FROM public.profiles);

-- 2. Purge existing orphaned products
DELETE FROM public.products
WHERE vendor_id IS NULL
   OR vendor_id NOT IN (SELECT id FROM auth.users)
   OR vendor_id NOT IN (SELECT id FROM public.profiles);

-- 3. Purge existing orphaned scans
DELETE FROM public.scans
WHERE (vendor_id IS NOT NULL AND vendor_id NOT IN (SELECT id FROM auth.users))
   OR (customer_id IS NOT NULL AND customer_id NOT IN (SELECT id FROM auth.users));

-- 4. Purge existing orphaned storefront reviews
DELETE FROM public.storefront_reviews
WHERE (vendor_id IS NOT NULL AND vendor_id NOT IN (SELECT id FROM auth.users))
   OR (customer_id IS NOT NULL AND customer_id NOT IN (SELECT id FROM auth.users));

-- 5. Purge existing orphaned brand branches
DELETE FROM public.brand_branches
WHERE brand_id NOT IN (SELECT id FROM auth.users)
   OR branch_id NOT IN (SELECT id FROM auth.users);

-- 6. Purge existing orphaned onboarding requests
DELETE FROM public.onboarding_requests
WHERE (vendor_id IS NOT NULL AND vendor_id NOT IN (SELECT id FROM auth.users))
   OR (requested_by IS NOT NULL AND requested_by NOT IN (SELECT id FROM auth.users));

-- 7. Ensure foreign key constraints CASCADE when user accounts are deleted in the future
ALTER TABLE public.payments
  DROP CONSTRAINT IF EXISTS payments_vendor_id_fkey,
  ADD CONSTRAINT payments_vendor_id_fkey
    FOREIGN KEY (vendor_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_vendor_id_fkey,
  ADD CONSTRAINT products_vendor_id_fkey
    FOREIGN KEY (vendor_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.scans
  DROP CONSTRAINT IF EXISTS scans_vendor_id_fkey,
  DROP CONSTRAINT IF EXISTS scans_customer_id_fkey;

ALTER TABLE public.scans
  ADD CONSTRAINT scans_vendor_id_fkey
    FOREIGN KEY (vendor_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD CONSTRAINT scans_customer_id_fkey
    FOREIGN KEY (customer_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.storefront_reviews
  DROP CONSTRAINT IF EXISTS storefront_reviews_vendor_id_fkey,
  DROP CONSTRAINT IF EXISTS storefront_reviews_customer_id_fkey;

ALTER TABLE public.storefront_reviews
  ADD CONSTRAINT storefront_reviews_vendor_id_fkey
    FOREIGN KEY (vendor_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD CONSTRAINT storefront_reviews_customer_id_fkey
    FOREIGN KEY (customer_id) REFERENCES auth.users(id) ON DELETE CASCADE;
