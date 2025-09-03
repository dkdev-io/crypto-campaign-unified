-- Create users table for admin dashboard
CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  permissions TEXT[] DEFAULT '{}',
  email_confirmed BOOLEAN DEFAULT false,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);

-- Insert admin user
INSERT INTO public.users (id, email, full_name, role, permissions, email_confirmed, last_login_at)
VALUES (
  'admin-user-id',
  'dan@dkdev.io',
  'Dan Kovacs',
  'super_admin',
  ARRAY['admin', 'export', 'view', 'manage', 'super_admin'],
  true,
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  permissions = EXCLUDED.permissions,
  last_login_at = EXCLUDED.last_login_at;

-- Grant necessary permissions
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow anon access to read users for admin dashboard (you might want to restrict this later)
CREATE POLICY IF NOT EXISTS "Allow anon read access" ON public.users
    FOR SELECT USING (true);

-- Allow authenticated users to read users
CREATE POLICY IF NOT EXISTS "Allow authenticated read access" ON public.users
    FOR SELECT USING (auth.role() = 'authenticated');