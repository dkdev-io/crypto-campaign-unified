-- Fix Auth Configuration for Email Verification
-- This migration updates auth settings to enable email verification

-- Note: These settings are typically managed through the Supabase Dashboard
-- but we're documenting the required configuration here

-- Required Dashboard Settings:
-- 1. Go to Authentication > URL Configuration
-- 2. Add these redirect URLs:
--    - https://cryptocampaign.netlify.app/auth
--    - https://cryptocampaign.netlify.app/auth?verified=true
--    - https://cryptocampaign.netlify.app/campaigns/auth
--    - https://cryptocampaign.netlify.app/donors/dashboard
--    - https://cryptocampaign.netlify.app/donors/auth/verify-email
--    - http://localhost:3000/auth
--    - http://localhost:3000/campaigns/auth
--    - http://localhost:3000/donors/dashboard
--    - http://localhost:5173/auth
--    - http://localhost:5173/campaigns/auth
--    - http://localhost:5173/donors/dashboard

-- 3. Go to Authentication > Email Templates
-- 4. Ensure "Enable email confirmations" is ON
-- 5. Set Site URL to: https://cryptocampaign.netlify.app

-- Create auth schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS auth;

-- Ensure RLS is enabled on auth tables
ALTER TABLE IF EXISTS auth.users ENABLE ROW LEVEL SECURITY;

-- Create a function to handle user creation with proper metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- For campaign users
  IF NEW.raw_user_meta_data->>'user_type' IS NULL OR NEW.raw_user_meta_data->>'user_type' = 'campaign' THEN
    INSERT INTO public.users (id, email, full_name, created_at, updated_at)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET 
      email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, users.full_name),
      updated_at = NOW();
  END IF;
  
  -- For donor users
  IF NEW.raw_user_meta_data->>'user_type' = 'donor' THEN
    INSERT INTO public.donors (
      id, 
      email, 
      full_name, 
      phone,
      donor_type,
      created_at, 
      updated_at
    )
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'Donor'),
      NEW.raw_user_meta_data->>'phone',
      COALESCE(NEW.raw_user_meta_data->>'donor_type', 'individual'),
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET 
      email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, donors.full_name),
      phone = COALESCE(EXCLUDED.phone, donors.phone),
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO postgres, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA auth TO anon, authenticated;

-- Create users table if it doesn't exist (for campaign users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  email_confirmed BOOLEAN DEFAULT false,
  email_confirmed_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  login_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create donors table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.donors (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  donor_type TEXT DEFAULT 'individual',
  total_donated DECIMAL(10,2) DEFAULT 0,
  donation_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donors ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Create policies for donors table
CREATE POLICY "Donors can view own profile" ON public.donors
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Donors can update own profile" ON public.donors
  FOR UPDATE USING (auth.uid() = id);

-- Public read for campaigns (if needed)
CREATE POLICY "Public can view campaign info" ON public.users
  FOR SELECT USING (true);

-- Log the migration
INSERT INTO public.migrations_log (name, executed_at, notes)
VALUES ('20250903_fix_auth_config', NOW(), 'Fixed auth configuration and email verification setup')
ON CONFLICT DO NOTHING;