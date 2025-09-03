-- Manual Account Verification Script for Supabase SQL Editor
-- Run this in your Supabase dashboard SQL editor

-- 1. Show all unverified accounts
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at,
    raw_user_meta_data
FROM auth.users
WHERE email_confirmed_at IS NULL
ORDER BY created_at DESC;

-- 2. Manually verify all unverified accounts
UPDATE auth.users
SET 
    email_confirmed_at = NOW(),
    updated_at = NOW()
WHERE email_confirmed_at IS NULL;

-- 3. Show verification results
SELECT 
    id,
    email,
    email_confirmed_at,
    raw_user_meta_data->'user_type' as user_type
FROM auth.users
ORDER BY email_confirmed_at DESC;

-- 4. Check campaign accounts with their profiles
SELECT 
    u.email,
    u.email_confirmed_at,
    p.full_name,
    p.user_type,
    c.title as campaign_title,
    c.wallet_address
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
LEFT JOIN public.campaigns c ON u.id = c.user_id
WHERE p.user_type = 'campaign' OR c.id IS NOT NULL
ORDER BY u.created_at DESC;

-- 5. Check donor accounts
SELECT 
    u.email,
    u.email_confirmed_at,
    p.full_name,
    p.user_type
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.user_type = 'donor' OR p.user_type IS NULL
ORDER BY u.created_at DESC;