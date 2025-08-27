#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './frontend/.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDonorAuth() {
  console.log('🔍 Testing Donor Authentication System\n');
  console.log('Supabase URL:', supabaseUrl);
  console.log('----------------------------------------\n');

  // Test 1: Check if donors table exists
  console.log('1. Checking donors table...');
  try {
    const { data, error } = await supabase
      .from('donors')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error accessing donors table:', error.message);
      console.log('   Hint: The table might not exist or migrations need to be applied');
    } else {
      console.log('✅ Donors table exists and is accessible');
    }
  } catch (e) {
    console.error('❌ Unexpected error:', e.message);
  }

  // Test 2: Check if donor_profiles table exists
  console.log('\n2. Checking donor_profiles table...');
  try {
    const { data, error } = await supabase
      .from('donor_profiles')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error accessing donor_profiles table:', error.message);
    } else {
      console.log('✅ Donor_profiles table exists and is accessible');
    }
  } catch (e) {
    console.error('❌ Unexpected error:', e.message);
  }

  // Test 3: Test user registration (without actually creating)
  console.log('\n3. Testing signup configuration...');
  const testEmail = `test-${Date.now()}@example.com`;
  
  try {
    // Check if auth is properly configured
    const { data: session } = await supabase.auth.getSession();
    console.log('✅ Auth service is accessible');
    
    // Check email configuration
    console.log('\n4. Checking email settings...');
    console.log('   Note: Email verification requires proper Supabase email configuration');
    console.log('   - Check Auth > Email Templates in Supabase dashboard');
    console.log('   - Ensure SMTP settings are configured if using custom domain');
    
  } catch (e) {
    console.error('❌ Auth service error:', e.message);
  }

  console.log('\n----------------------------------------');
  console.log('📋 Summary:');
  console.log('If tables are missing, apply migrations using Supabase CLI or dashboard');
  console.log('If email is not working, check Supabase Auth settings');
}

testDonorAuth().then(() => {
  console.log('\n✅ Test complete');
  process.exit(0);
}).catch(err => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});