#!/usr/bin/env node

// Create users table directly via SQL
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kmepcdsklnnxokoimvzo.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDYyNDgsImV4cCI6MjA3MTEyMjI0OH0.7fa_fy4aWlz0PZvwC90X1r_6UMHzBujnN0fIngva1iI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createUsersTable() {
  console.log('🔧 Creating users table...');

  // Basic users table SQL
  const createTableSQL = `
    -- Create users table if it doesn't exist
    CREATE TABLE IF NOT EXISTS public.users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        
        -- Basic Info
        email TEXT UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        
        -- Contact Information
        phone TEXT,
        company TEXT,
        job_title TEXT,
        
        -- Auth Info
        email_confirmed BOOLEAN DEFAULT false,
        email_confirmed_at TIMESTAMPTZ,
        
        -- Role & Permissions
        role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
        
        -- Security
        last_login_at TIMESTAMPTZ,
        login_count INTEGER DEFAULT 0,
        
        -- Timestamps
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Create index on email for faster lookups
    CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
    
    -- Enable RLS
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
    
    -- Create basic RLS policies
    DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
    DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
    DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
    
    CREATE POLICY "Users can view own profile" ON public.users
        FOR SELECT USING (auth.uid()::text = id::text);
    
    CREATE POLICY "Users can insert own profile" ON public.users
        FOR INSERT WITH CHECK (auth.uid()::text = id::text);
    
    CREATE POLICY "Users can update own profile" ON public.users
        FOR UPDATE USING (auth.uid()::text = id::text);
  `;

  try {
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: createTableSQL,
    });

    if (error) {
      console.error('❌ Error creating table:', error);

      // Try alternative approach - create a test record directly
      console.log('🔄 Trying alternative approach...');
      const { data: insertData, error: insertError } = await supabase.from('users').insert([
        {
          email: 'test@example.com',
          full_name: 'Test User',
          role: 'user',
        },
      ]);

      if (insertError) {
        console.error('❌ Insert test failed:', insertError);
      } else {
        console.log('✅ Insert successful - table exists!');
      }
    } else {
      console.log('✅ Table creation successful');
    }
  } catch (error) {
    console.error('💥 Failed to create table:', error);
  }
}

createUsersTable();
