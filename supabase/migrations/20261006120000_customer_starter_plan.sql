ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_plan_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_plan_check CHECK (plan IN ('free', 'starter', 'basic', 'premium', 'brand'));

ALTER TABLE public.payments
  DROP CONSTRAINT IF EXISTS payments_plan_check;

ALTER TABLE public.payments
  ADD CONSTRAINT payments_plan_check CHECK (plan IN ('starter', 'basic', 'premium', 'brand'));

CREATE OR REPLACE FUNCTION public.start_brand_trial()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.account_type = 'brand' AND NEW.plan = 'brand' THEN
    NEW.plan := 'free';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS start_brand_trial_on_profile ON public.profiles;
CREATE TRIGGER start_brand_trial_on_profile
BEFORE INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.start_brand_trial();
