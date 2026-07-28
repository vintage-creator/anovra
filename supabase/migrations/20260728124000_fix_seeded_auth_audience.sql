UPDATE auth.users
SET
  aud = 'authenticated',
  updated_at = NOW()
WHERE email IN ('customer@anovra.africa', 'hello@anovra.africa')
  AND COALESCE(aud, '') <> 'authenticated';
