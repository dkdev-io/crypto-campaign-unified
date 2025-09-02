#!/usr/bin/env node

// Create users table directly on production using HTTP requests
import fetch from 'node-fetch';

async function createTableProductionDirect() {
  console.log('🔧 Creating users table directly in production database...');
  
  const supabaseUrl = 'https://kmepcdsklnnxokoimvzo.supabase.co';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDYyNDgsImV4cCI6MjA3MTEyMjI0OH0.7fa_fy4aWlz0PZvwC90X1r_6UMHzBujnN0fIngva1iI';
  
  // SQL to create the users table
  const createTableSQL = `
    -- Create users table if it doesn't exist
    CREATE TABLE IF NOT EXISTS public.users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        phone TEXT,
        company TEXT,
        job_title TEXT,
        email_confirmed BOOLEAN DEFAULT false,
        email_confirmed_at TIMESTAMPTZ,
        role TEXT NOT NULL DEFAULT 'user',
        permissions TEXT[] DEFAULT ARRAY['view'],
        last_login_at TIMESTAMPTZ,
        login_count INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
    
    -- Enable RLS
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
    
    -- Create policies
    DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
    CREATE POLICY "Users can view own profile" ON public.users
        FOR SELECT USING (auth.uid()::text = id::text);
        
    DROP POLICY IF EXISTS "Users can create own profile" ON public.users;
    CREATE POLICY "Users can create own profile" ON public.users
        FOR INSERT WITH CHECK (auth.uid()::text = id::text);
  `;

  try {
    // Method 1: Try using a direct SQL execution endpoint
    console.log('1️⃣ Attempting direct SQL execution...');
    
    // Use PostgREST's RPC endpoint to try executing SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/sql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        'apikey': anonKey
      },
      body: JSON.stringify({
        query: createTableSQL
      })
    });

    if (response.ok) {
      console.log('✅ Direct SQL execution successful');
    } else {
      const error = await response.text();
      console.log('⚠️ Direct SQL failed:', error);
      
      // Method 2: Create through auth user creation
      await createThroughAuthTrigger();
    }

  } catch (error) {
    console.log('⚠️ Error:', error.message);
    await createThroughAuthTrigger();
  }
}

async function createThroughAuthTrigger() {
  console.log('2️⃣ Creating table through auth user creation...');
  
  const supabaseUrl = 'https://kmepcdsklnnxokoimvzo.supabase.co';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDYyNDgsImV4cCI6MjA3MTEyMjI0OH0.7fa_fy4aWlz0PZvwC90X1r_6UMHzBujnN0fIngva1iI';
  
  // Create an actual user to trigger table creation
  const signupResponse = await fetch(`${supabaseUrl}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
      'apikey': anonKey
    },
    body: JSON.stringify({
      email: `tablesetup${Date.now()}@example.com`,
      password: 'TableSetup123!',
      data: {
        full_name: 'Table Setup User'
      }
    })
  });

  if (signupResponse.ok) {
    const signupData = await signupResponse.json();
    console.log('✅ User created:', signupData.user?.email);
    
    // Now manually create the user profile in the users table
    console.log('3️⃣ Creating user profile in users table...');
    
    const insertResponse = await fetch(`${supabaseUrl}/rest/v1/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        'apikey': anonKey,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        id: signupData.user?.id,
        email: signupData.user?.email,
        full_name: 'Table Setup User',
        email_confirmed: false
      })
    });

    if (insertResponse.ok) {
      console.log('✅ User profile created in users table!');
      console.log('🎉 Users table is now working!');
      
      // Test access
      await testTableAccess();
    } else {
      const insertError = await insertResponse.text();
      console.log('❌ Profile creation failed:', insertError);
    }
  } else {
    const signupError = await signupResponse.text();
    console.log('❌ User creation failed:', signupError);
  }
}

async function testTableAccess() {
  console.log('🧪 Testing users table access...');
  
  const supabaseUrl = 'https://kmepcdsklnnxokoimvzo.supabase.co';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDYyNDgsImV4cCI6MjA3MTEyMjI0OH0.7fa_fy4aWlz0PZvwC90X1r_6UMHzBujnN0fIngva1iI';
  
  const testResponse = await fetch(`${supabaseUrl}/rest/v1/users?select=*&limit=1`, {
    headers: {
      'Authorization': `Bearer ${anonKey}`,
      'apikey': anonKey
    }
  });

  if (testResponse.ok) {
    const data = await testResponse.json();
    console.log('✅ Users table accessible! Records:', data.length);
    console.log('🎉 Authentication should now work on https://cryptocampaign.netlify.app/auth');
  } else {
    const error = await testResponse.text();
    console.log('❌ Table access test failed:', error);
  }
}

createTableProductionDirect();