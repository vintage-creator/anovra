CREATE TABLE IF NOT EXISTS public.skin_scan_rate_limits (
  key_hash TEXT PRIMARY KEY,
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  request_count INTEGER NOT NULL DEFAULT 1
);

REVOKE ALL ON public.skin_scan_rate_limits FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.acquire_skin_scan_slot(p_key_hash TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  accepted TEXT;
BEGIN
  INSERT INTO public.skin_scan_rate_limits (key_hash, window_started_at, request_count)
  VALUES (p_key_hash, now(), 1)
  ON CONFLICT (key_hash) DO UPDATE
    SET window_started_at = CASE
          WHEN skin_scan_rate_limits.window_started_at < now() - interval '1 hour' THEN now()
          ELSE skin_scan_rate_limits.window_started_at
        END,
        request_count = CASE
          WHEN skin_scan_rate_limits.window_started_at < now() - interval '1 hour' THEN 1
          ELSE skin_scan_rate_limits.request_count + 1
        END
    WHERE skin_scan_rate_limits.window_started_at < now() - interval '1 hour'
       OR skin_scan_rate_limits.request_count < 5
  RETURNING key_hash INTO accepted;
  RETURN accepted IS NOT NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.acquire_skin_scan_slot(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.acquire_skin_scan_slot(TEXT) TO service_role;
