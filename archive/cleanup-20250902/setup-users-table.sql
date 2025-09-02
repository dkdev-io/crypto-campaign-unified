-- Create users table for admin authentication
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'viewer' 
    CHECK (role IN ('admin', 'viewer')),
  
  -- Profile information
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  
  -- Account status
  is_active BOOLEAN NOT NULL DEFAULT true,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  last_login TIMESTAMP WITH TIME ZONE,
  login_count INTEGER DEFAULT 0,
  
  -- Security fields
  password_reset_token TEXT,
  password_reset_expires TIMESTAMP WITH TIME ZONE,
  email_verification_token TEXT,
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON public.users(is_active);

-- Create first admin user
INSERT INTO public.users (email, password_hash, role, first_name, last_name, is_active, email_verified) 
VALUES (
  'admin@company.com',
  crypt('admin123', gen_salt('bf')),
  'admin',
  'Admin',
  'User',
  true,
  true
) ON CONFLICT (email) DO NOTHING;

-- Enable Row Level Security (optional)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own data
CREATE POLICY "Users can read own data" ON public.users
  FOR SELECT USING (auth.uid()::text = id::text);

-- Create policy to allow admins to read all users
CREATE POLICY "Admins can read all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users admin_user
      WHERE admin_user.id::text = auth.uid()::text
      AND admin_user.role = 'admin'
      AND admin_user.is_active = true
    )
  );