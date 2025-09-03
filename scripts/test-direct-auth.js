#!/usr/bin/env node

/**
 * Direct test of auth endpoints to verify email verification bypass
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://kmepcdsklnnxokoimvzo.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDYyNDgsImV4cCI6MjA3MTEyMjI0OH0.7fa_fy4aWlz0PZvwC90X1r_6UMHzBujnN0fIngva1iI";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testDirectAuth() {
  console.log('🚀 TESTING DIRECT AUTH - EMAIL VERIFICATION BYPASS');
  console.log('');

  try {
    // Test 1: Try to sign up with test account
    console.log('1. Testing signup with test@dkdev.io...');
    
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: 'test@dkdev.io',
      password: 'TestDonor123!'
    });

    if (signupError) {
      console.log(`   ⚠️ Signup error: ${signupError.message}`);
      
      // If user already exists, that's actually good - let's try to login
      if (signupError.message.includes('already') || signupError.message.includes('exists')) {
        console.log('   ✅ User already exists, will try login instead');
      }
    } else {
      console.log('   ✅ Signup successful');
      console.log('   User ID:', signupData?.user?.id);
      console.log('   Email confirmed:', signupData?.user?.email_confirmed_at ? 'YES' : 'NO');
      
      if (signupData?.user?.email_confirmed_at) {
        console.log('   🎉 EMAIL VERIFICATION BYPASSED SUCCESSFULLY!');
      }
    }

    // Test 2: Try to login with test account
    console.log('');
    console.log('2. Testing login with test@dkdev.io...');
    
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'test@dkdev.io',
      password: 'TestDonor123!'
    });

    if (loginError) {
      console.log(`   ❌ Login error: ${loginError.message}`);
      
      if (loginError.message.includes('confirm') || loginError.message.includes('verify')) {
        console.log('   ❌ EMAIL VERIFICATION FIX DID NOT WORK - Still asking for confirmation');
      } else if (loginError.message.includes('credentials')) {
        console.log('   ⚠️ Credential error - user might not exist yet');
      }
    } else {
      console.log('   ✅ Login successful!');
      console.log('   User ID:', loginData?.user?.id);
      console.log('   Email confirmed:', loginData?.user?.email_confirmed_at ? 'YES' : 'NO');
      console.log('   Session exists:', !!loginData?.session);
      
      if (loginData?.session) {
        console.log('   🎉 SUCCESS! User can login without email verification!');
        console.log('   🎉 EMAIL VERIFICATION BYPASS WORKED PERFECTLY!');
      }
      
      // Sign out to clean up
      await supabase.auth.signOut();
    }

    // Test 3: Check user in database
    console.log('');
    console.log('3. Checking user in database...');
    
    const { data: users, error: queryError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'test@dkdev.io')
      .limit(1);

    if (queryError) {
      console.log(`   ⚠️ Query error: ${queryError.message}`);
    } else {
      if (users && users.length > 0) {
        const user = users[0];
        console.log('   ✅ User found in database');
        console.log('   Email confirmed:', user.email_confirmed);
        console.log('   Email confirmed at:', user.email_confirmed_at);
        
        if (user.email_confirmed) {
          console.log('   ✅ Database shows user is email confirmed');
        }
      } else {
        console.log('   ⚠️ User not found in custom users table');
      }
    }

  } catch (error) {
    console.error('❌ Test error:', error);
  }

  console.log('');
  console.log('📝 SUMMARY:');
  console.log('');
  console.log('If you see "SUCCESS! User can login without email verification!" above,');
  console.log('then the email verification fix worked perfectly!');
  console.log('');
  console.log('You can now:');
  console.log('• Visit http://localhost:5173/campaigns/auth');
  console.log('• Sign up with test@dkdev.io / TestDonor123!');
  console.log('• Login immediately without waiting for email verification');
  console.log('• Focus on fixing other parts of your app');
}

testDirectAuth().catch(console.error);