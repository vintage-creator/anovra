INSERT INTO auth.identities (
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at,
  id
)
VALUES (
  'customer@anovra.africa',
  'c0c0c0c0-c0c0-c0c0-c0c0-c0c0c0c0c0c0',
  jsonb_build_object(
    'sub', 'c0c0c0c0-c0c0-c0c0-c0c0-c0c0c0c0c0c0',
    'email', 'customer@anovra.africa',
    'email_verified', true,
    'phone_verified', false
  ),
  'email',
  NOW(),
  NOW(),
  NOW(),
  'c0c0c0c0-c0c0-c0c0-c0c0-c0c0c0c0c0c1'
)
ON CONFLICT (provider, provider_id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  identity_data = EXCLUDED.identity_data,
  updated_at = NOW();
