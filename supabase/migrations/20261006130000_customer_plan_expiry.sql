ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS customer_plan_expires_at timestamptz;

CREATE OR REPLACE FUNCTION public.guard_customer_plan_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.account_type = 'customer'
    AND (NEW.plan IS DISTINCT FROM OLD.plan
      OR NEW.customer_plan_expires_at IS DISTINCT FROM OLD.customer_plan_expires_at)
    AND auth.role() = 'authenticated' THEN
    RAISE EXCEPTION 'Customer plans can only be changed after verified payment';
  END IF;
  RETURN NEW;
END;
$$;
