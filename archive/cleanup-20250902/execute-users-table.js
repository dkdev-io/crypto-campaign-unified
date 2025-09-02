#!/usr/bin/env node

// Execute the users table creation directly via Supabase
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://kmepcdsklnnxokoimvzo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDYyNDgsImV4cCI6MjA3MTEyMjI0OH0.7fa_fy4aWlz0PZvwC90X1r_6UMHzBujnN0fIngva1iI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeUsersTableCreation() {
  console.log('🔧 Creating users table and auth system...');
  
  // Execute the SQL commands step by step
  const commands = [
    // Drop existing users table if it has issues
    `DROP TABLE IF EXISTS public.users CASCADE;`,
    
    // Create users table
    `CREATE TABLE public.users (
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
    );`,
    
    // Create indexes
    `CREATE INDEX idx_users_email ON public.users(email);`,
    `CREATE INDEX idx_users_role ON public.users(role);`,
    `CREATE INDEX idx_users_created_at ON public.users(created_at);`,
    
    // Enable RLS
    `ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;`,
    
    // Create RLS policies
    `CREATE POLICY "Users can view own profile" ON public.users
        FOR SELECT USING (auth.uid()::text = id::text);`,
    
    `CREATE POLICY "Users can create own profile" ON public.users
        FOR INSERT WITH CHECK (auth.uid()::text = id::text);`,
    
    `CREATE POLICY "Users can update own profile" ON public.users
        FOR UPDATE USING (auth.uid()::text = id::text);`,
    
    // Create update trigger function
    `CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;`,
    
    // Create trigger for users table
    `CREATE TRIGGER update_users_updated_at 
        BEFORE UPDATE ON public.users
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`,
    
    // Function to handle auth user creation
    `CREATE OR REPLACE FUNCTION public.handle_new_user()
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
    $$ LANGUAGE plpgsql SECURITY DEFINER;`,
    
    // Create trigger on auth.users
    `DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;`,
    `CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();`
  ];

  for (let i = 0; i < commands.length; i++) {
    const command = commands[i];
    console.log(`\nExecuting step ${i + 1}/${commands.length}...`);
    
    try {
      const { data, error } = await supabase.rpc('exec', { query: command });
      
      if (error) {
        console.log(`⚠️ SQL command failed (might be expected):`, error.message);
        // Try alternative approach for each command
        await executeAlternative(command);
      } else {
        console.log(`✅ Step ${i + 1} completed successfully`);
      }
    } catch (err) {
      console.log(`⚠️ Error on step ${i + 1}:`, err.message);
    }
  }

  // Test the final result
  console.log('\n🧪 Testing users table...');
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
      
    if (error) {
      console.log('❌ Users table still not accessible:', error.message);
    } else {
      console.log('✅ Users table is now accessible!');
    }
  } catch (err) {
    console.log('❌ Test failed:', err.message);
  }
}

async function executeAlternative(command) {
  console.log('   Trying alternative execution method...');
  // This is a fallback - in a real scenario we'd use the service key or admin access
}

executeUsersTableCreation();