CREATE OR REPLACE FUNCTION public.get_public_brand_directory(brand_slug TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  brand_record RECORD;
  branch_records JSONB := '[]'::jsonb;
BEGIN
  SELECT
    id,
    name,
    business_name,
    tagline,
    location,
    slug,
    is_verified,
    verification_status,
    created_at
  INTO brand_record
  FROM public.profiles
  WHERE account_type = 'brand'
    AND is_verified = true
    AND verification_status = 'approved'
    AND (
      slug = brand_slug
      OR trim(both '-' from lower(regexp_replace(COALESCE(business_name, name, id::text), '[^a-zA-Z0-9]+', '-', 'g'))) = brand_slug
    )
  LIMIT 1;

  IF brand_record.id IS NULL THEN
    RETURN jsonb_build_object('brand', NULL, 'branches', '[]'::jsonb);
  END IF;

  SELECT COALESCE(jsonb_agg(branch_data ORDER BY branch_data->>'branch_name'), '[]'::jsonb)
  INTO branch_records
  FROM (
    SELECT jsonb_build_object(
      'id', bb.id,
      'branch_id', bb.branch_id,
      'branch_name', bb.branch_name,
      'branch_slug', bb.branch_slug,
      'location', bb.location,
      'created_at', bb.created_at,
      'products', COALESCE(products.product_list, '[]'::jsonb),
      'product_count', COALESCE(products.product_count, 0)
    ) AS branch_data
    FROM public.brand_branches bb
    LEFT JOIN LATERAL (
      SELECT
        COUNT(*)::int AS product_count,
        COALESCE(jsonb_agg(jsonb_build_object(
          'id', p.id,
          'vendor_id', p.vendor_id,
          'name', p.name,
          'price', p.price,
          'category', p.category,
          'image_url', p.image_url,
          'nafdac_status', p.nafdac_status
        ) ORDER BY p.name), '[]'::jsonb) AS product_list
      FROM public.products p
      WHERE p.vendor_id = bb.branch_id
        AND p.nafdac_status = 'approved'
    ) products ON true
    WHERE bb.brand_id = brand_record.id
      AND bb.status = 'active'
  ) rows;

  RETURN jsonb_build_object(
    'brand', jsonb_build_object(
      'id', brand_record.id,
      'name', brand_record.name,
      'business_name', brand_record.business_name,
      'tagline', brand_record.tagline,
      'location', brand_record.location,
      'slug', brand_record.slug,
      'is_verified', brand_record.is_verified,
      'verification_status', brand_record.verification_status,
      'created_at', brand_record.created_at
    ),
    'branches', branch_records
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_public_brand_directory(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_brand_directory(TEXT) TO anon, authenticated;
