ALTER TABLE public.scans
  ADD COLUMN IF NOT EXISTS matched_products JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS ingredient_fallback JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS treatment_plan JSONB NOT NULL DEFAULT '[]'::jsonb;
