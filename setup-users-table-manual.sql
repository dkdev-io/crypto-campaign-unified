-- ============================================================================
-- MANUAL SETUP: USERS TABLE FOR CAMPAIGN AUTHENTICATION
-- Run this in the Supabase SQL Editor to fix authentication issues
-- ============================================================================

-- First, let's see what tables currently exist
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- ============================================================================
-- CREATE USERS TABLE
-- ============================================================================

-- Drop existing users table if it has issues
DROP TABLE IF EXISTS public.users CASCADE;

-- Create users table
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic Info (required for auth)
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    
    -- Contact Information (completed after signup)
    phone TEXT,
    company TEXT,
    job_title TEXT,
    
    -- Auth Info (synced with Supabase auth.users)
    email_confirmed BOOLEAN DEFAULT false,
    email_confirmed_at TIMESTAMPTZ,
    
    -- Role & Permissions
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
    permissions TEXT[] DEFAULT ARRAY['view'],
    
    -- Security
    last_login_at TIMESTAMPTZ,
    login_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_created_at ON public.users(created_at);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE RLS POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can create own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid()::text = id::text);

-- Policy: Users can create their own profile (during signup)
CREATE POLICY "Users can create own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- ============================================================================
-- CREATE TRIGGER FOR UPDATED_AT
-- ============================================================================

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for users table
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- CREATE FUNCTION TO HANDLE AUTH USER CREATION
-- ============================================================================

-- Function to automatically create user profile when auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, email_confirmed, email_confirmed_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
        NEW.email_confirmed_at IS NOT NULL,
        NEW.email_confirmed_at
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- CREATE TEST USER FOR VERIFICATION
-- ============================================================================

-- Note: This will fail if no auth.users record exists with this ID
-- You should create users through the signup process instead

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if the table was created successfully
-- SELECT 'Users table exists' as status, count(*) as user_count FROM public.users;

-- Check RLS policies
-- SELECT * FROM pg_policies WHERE tablename = 'users';

-- Check if the trigger was created
-- SELECT * FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created';

-- ============================================================================
-- INSTRUCTIONS FOR NEXT STEPS
-- ============================================================================

/*
After running this SQL:

1. Go to your frontend application: http://localhost:5173/auth
2. Try to sign up with a new email and password
3. Check your email for verification if required
4. Try to sign in

If you still have issues:
1. Check the Network tab in browser dev tools for specific error messages
2. Check Supabase dashboard > Authentication > Users to see if users are being created
3. Check Supabase dashboard > Table Editor > Users to see if profiles are being created

Common issues:
- Email confirmation required: Check Supabase > Authentication > Settings
- RLS policies blocking access: May need to adjust policies above
- CORS issues: Check allowed origins in Supabase dashboard
*/