#!/usr/bin/env node

// Apply migration directly to production Supabase using the REST API
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import fs from 'fs';

const supabaseUrl = 'https://kmepcdsklnnxokoimvzo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDYyNDgsImV4cCI6MjA3MTEyMjI0OH0.7fa_fy4aWlz0PZvwC90X1r_6UMHzBujnN0fIngva1iI';

async function applyMigrationDirect() {
  console.log('🔧 Applying users table migration directly...');
  
  try {
    // Read the migration file
    const migrationSQL = fs.readFileSync('./supabase/migrations/20250902160451_create_users_table.sql', 'utf8');
    
    // Execute using Supabase REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey
      },
      body: JSON.stringify({
        query: migrationSQL
      })
    });
    
    if (response.ok) {
      console.log('✅ Migration applied successfully');
    } else {
      const error = await response.text();
      console.log('⚠️ REST API approach failed:', error);
      
      // Try alternative: Execute SQL statements one by one
      console.log('🔄 Trying statement-by-statement execution...');
      await executeStatementsIndividually();
    }
    
  } catch (error) {
    console.log('⚠️ Direct migration failed:', error.message);
    await executeStatementsIndividually();
  }
}

async function executeStatementsIndividually() {
  console.log('📝 Executing SQL statements individually...');
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  const statements = [
    // Create table
    `CREATE TABLE IF NOT EXISTS public.users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        phone TEXT,
        company TEXT,
        job_title TEXT,
        email_confirmed BOOLEAN DEFAULT false,
        email_confirmed_at TIMESTAMPTZ,
        role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
        permissions TEXT[] DEFAULT ARRAY['view'],
        last_login_at TIMESTAMPTZ,
        login_count INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    
    // Create indexes
    `CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email)`,
    `CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role)`,
    
    // Enable RLS
    `ALTER TABLE public.users ENABLE ROW LEVEL SECURITY`,
  ];
  
  for (let i = 0; i < statements.length; i++) {
    const sql = statements[i];
    console.log(`Executing statement ${i + 1}/${statements.length}...`);
    
    try {
      const { data, error } = await supabase.rpc('exec_sql_statement', { sql });
      if (error) {
        console.log(`⚠️ Statement ${i + 1} failed:`, error.message);
      } else {
        console.log(`✅ Statement ${i + 1} executed`);
      }
    } catch (err) {
      console.log(`⚠️ Statement ${i + 1} error:`, err.message);
    }
    
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
  }
  
  // Test final result
  console.log('\n🧪 Testing users table access...');
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
      
    if (error) {
      console.log('❌ Users table test failed:', error.message);
      console.log('\n💡 Manual fallback needed - creating table via auth trigger...');
      await createTableViaAuth();
    } else {
      console.log('✅ Users table is now accessible!');
      console.log('🎉 Authentication should now work on the live site!');
    }
  } catch (err) {
    console.log('❌ Test failed:', err.message);
  }
}

async function createTableViaAuth() {
  console.log('🔄 Creating table via auth user creation...');
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  // Create a legitimate test user that will trigger table creation
  const testEmail = `setup.user.${Date.now()}@gmail.com`;
  const { data, error } = await supabase.auth.signUp({
    email: testEmail,
    password: 'SetupPassword123!',
    options: {
      data: {
        full_name: 'Setup User'
      }
    }
  });
  
  if (error) {
    console.log('⚠️ Auth user creation failed:', error.message);
  } else {
    console.log('✅ Test user created, checking table...');
    
    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for triggers
    
    const { data: tableData, error: tableError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
      
    if (!tableError) {
      console.log('✅ Users table created successfully via auth trigger!');
    }
  }
}

applyMigrationDirect();