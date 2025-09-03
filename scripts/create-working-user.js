#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Using service role key to create users
const SUPABASE_URL = "https://kmepcdsklnnxokoimvzo.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTU0NjI0OCwiZXhwIjoyMDcxMTIyMjQ4fQ.ILZgJNM0h6KuChk7zBFMOUZe_VftQjVOWk_BFYT7VqE";

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createWorkingUser() {
  console.log('🚀 CREATING WORKING USER WITH ADMIN CLIENT');
  console.log('');

  try {
    // First delete existing user if any
    console.log('1. Checking/deleting existing user...');
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (!listError && users?.users) {
      const existingUser = users.users.find(u => u.email === 'dan@dkdev.io');
      if (existingUser) {
        console.log('   Found existing user, deleting...');
        await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
        console.log('   ✅ Existing user deleted');
      }
    }

    // Create new user
    console.log('2. Creating new confirmed user...');
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: 'dan@dkdev.io',
      password: 'DanPassword123!',
      email_confirm: true // This bypasses email verification
    });

    if (error) {
      console.log('   ❌ Error creating user:', error.message);
      return;
    }

    console.log('   ✅ User created successfully!');
    console.log('   User ID:', data.user.id);
    console.log('   Email confirmed:', data.user.email_confirmed_at ? 'YES' : 'NO');

    // Test login immediately
    console.log('3. Testing login...');
    const supabaseClient = createClient(SUPABASE_URL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDYyNDgsImV4cCI6MjA3MTEyMjI0OH0.7fa_fy4aWlz0PZvwC90X1r_6UMHzBujnN0fIngva1iI');
    
    const { data: loginData, error: loginError } = await supabaseClient.auth.signInWithPassword({
      email: 'dan@dkdev.io',
      password: 'DanPassword123!'
    });

    if (loginError) {
      console.log('   ❌ Login test failed:', loginError.message);
    } else {
      console.log('   ✅ LOGIN TEST SUCCESS!');
      console.log('   🎉 Authentication is now working!');
      
      // Clean up the test session
      await supabaseClient.auth.signOut();
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }

  console.log('');
  console.log('🧪 YOUR WORKING CREDENTIALS:');
  console.log('Site: https://cryptocampaign.netlify.app/campaigns/auth');
  console.log('Email: dan@dkdev.io');
  console.log('Password: DanPassword123!');
  console.log('');
  console.log('✅ Should work immediately without email verification!');
}

createWorkingUser();