CREATE OR REPLACE FUNCTION public.guard_customer_plan_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.account_type = 'customer'
    AND NEW.plan IS DISTINCT FROM OLD.plan
    AND auth.role() = 'authenticated' THEN
    RAISE EXCEPTION 'Customer plans can only be changed after verified payment';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_customer_plan_change ON public.profiles;
CREATE TRIGGER guard_customer_plan_change
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.guard_customer_plan_change();
