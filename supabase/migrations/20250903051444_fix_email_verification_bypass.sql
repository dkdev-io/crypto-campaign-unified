-- Fix email verification for test@dkdev.io user
-- This migration bypasses email verification for the test account

-- Update existing test user to confirmed status
UPDATE auth.users 
SET email_confirmed_at = NOW(),
    updated_at = NOW()
WHERE email = 'test@dkdev.io' 
  AND email_confirmed_at IS NULL;

-- If no existing user, create one with confirmed email
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) 
SELECT 
    '00000000-0000-0000-0000-000000000000'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'authenticated',
    'authenticated',
    'test@dkdev.io',
    crypt('admin123', gen_salt('bf')),
    NOW(),
    NULL,
    NULL,
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"admin","test_account":true}'::jsonb,
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
WHERE NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'test@dkdev.io'
);

-- Create corresponding profile if needed
INSERT INTO public.profiles (id, full_name, email, created_at, updated_at)
SELECT 
    u.id,
    'Test Admin User',
    u.email,
    NOW(),
    NOW()
FROM auth.users u 
WHERE u.email = 'test@dkdev.io'
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = u.id
  );

-- Verify the fix
SELECT 
    email,
    email_confirmed_at IS NOT NULL as email_confirmed,
    created_at
FROM auth.users 
WHERE email = 'test@dkdev.io';