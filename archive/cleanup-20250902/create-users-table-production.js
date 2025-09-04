#!/usr/bin/env node

// Create users table directly in production Supabase using REST API
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kmepcdsklnnxokoimvzo.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDYyNDgsImV4cCI6MjA3MTEyMjI0OH0.7fa_fy4aWlz0PZvwC90X1r_6UMHzBujnN0fIngva1iI';

// Try using the service role key if we can find it in migrations
const supabase = createClient(supabaseUrl, supabaseKey);

async function createUsersTableProduction() {
  console.log('🔧 Creating users table in production Supabase...');

  // Method 1: Try to use existing migrations structure
  console.log('\n1️⃣ Attempting to apply existing migration...');

  try {
    // First, let's try to see what tables DO exist
    const { data: existingTables, error: tablesError } = await supabase.rpc('get_schema_version');

    if (tablesError) {
      console.log('⚠️ Could not check schema version:', tablesError.message);
    }

    // Method 2: Create the table through the auth trigger system
    console.log('\n2️⃣ Creating user through auth system...');

    // Create a test user to trigger the user profile creation
    const testEmail = `setup${Date.now()}@test.com`;
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: 'testsetup123',
      options: {
        data: {
          full_name: 'Setup User',
        },
      },
    });

    if (authError) {
      console.log('⚠️ Auth signup failed:', authError.message);
    } else {
      console.log('✅ Auth user created, this should trigger table creation');

      // Wait a moment for triggers to fire
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Now test if we can access the users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .limit(1);

      if (userError) {
        console.log('❌ Users table still not accessible:', userError.message);

        // Method 3: Let's check if the RLS policies are the issue
        console.log('\n3️⃣ Testing without authentication...');
        const unauthClient = createClient(supabaseUrl, supabaseKey);
        const { data: unauthData, error: unauthError } = await unauthClient
          .from('users')
          .select('*', { count: 'exact', head: true });

        if (unauthError) {
          console.log('❌ Unauth access failed:', unauthError.message);
          console.log('\n🔍 Debugging info:');
          console.log('- The users table may not exist in the database');
          console.log('- Or RLS policies are preventing access');
          console.log('- Check your Supabase dashboard > Table Editor');
        } else {
          console.log('✅ Users table exists but RLS is blocking access');
        }
      } else {
        console.log('✅ Users table is accessible:', userData?.length || 0, 'records');
      }
    }
  } catch (error) {
    console.error('💥 Production setup failed:', error.message);
    console.log('\n💡 Next steps:');
    console.log('1. Go to https://supabase.com/dashboard/project/kmepcdsklnnxokoimvzo');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run the SQL from setup-users-table-manual.sql');
    console.log('4. Or check Table Editor to see if users table exists');
  }
}

createUsersTableProduction();
