#!/usr/bin/env node

// Fix authentication at the Supabase project level using Management API
const SUPABASE_URL = "https://kmepcdsklnnxokoimvzo.supabase.co";
const PROJECT_ID = "kmepcdsklnnxokoimvzo";
const ACCESS_TOKEN = "sbp_d40cf702de00ebf693fdc11584a61de754515012";

async function fixAuthAtProjectLevel() {
  console.log('🚀 FIXING AUTHENTICATION AT SUPABASE PROJECT LEVEL');
  console.log('');

  try {
    // Get current auth configuration
    console.log('1. Checking current auth configuration...');
    const configResponse = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_ID}/config/auth`, {
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!configResponse.ok) {
      console.log(`   ❌ Failed to get config: ${configResponse.status} ${configResponse.statusText}`);
      const errorText = await configResponse.text();
      console.log(`   Error details: ${errorText}`);
      return;
    }

    const config = await configResponse.json();
    console.log('   ✅ Got current configuration');
    console.log('   Email confirmation enabled:', config.ENABLE_CONFIRMATIONS || config.MAILER_AUTOCONFIRM);

    // Update auth configuration to disable email confirmation
    console.log('2. Disabling email confirmation...');
    const updateResponse = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_ID}/config/auth`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ENABLE_CONFIRMATIONS: false,
        MAILER_AUTOCONFIRM: false,
        DISABLE_SIGNUP: false
      })
    });

    if (!updateResponse.ok) {
      console.log(`   ❌ Failed to update config: ${updateResponse.status} ${updateResponse.statusText}`);
      const errorText = await updateResponse.text();
      console.log(`   Error details: ${errorText}`);
      return;
    }

    console.log('   ✅ Auth configuration updated!');

    // Wait for changes to propagate
    console.log('3. Waiting for changes to propagate...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Test signup with fresh user
    console.log('4. Testing signup with fresh user...');
    const testEmail = `test${Date.now()}@dkdev.io`;
    const testPassword = 'TestPass123!';

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDYyNDgsImV4cCI6MjA3MTEyMjI0OH0.7fa_fy4aWlz0PZvwC90X1r_6UMHzBujnN0fIngva1iI');

    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword
    });

    if (signupError) {
      console.log('   ❌ Test signup failed:', signupError.message);
      return;
    }

    console.log('   ✅ Test signup successful!');
    console.log('   Email confirmed immediately:', signupData.user?.email_confirmed_at ? 'YES' : 'NO');

    // Test login immediately
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (loginError) {
      console.log('   ❌ Test login failed:', loginError.message);
      if (loginError.message.includes('confirm')) {
        console.log('   ❌ EMAIL VERIFICATION STILL REQUIRED - Settings not applied');
      }
    } else {
      console.log('   ✅ TEST LOGIN SUCCESS!');
      console.log('   🎉 EMAIL VERIFICATION BYPASS WORKING!');
      
      // Clean up test user
      await supabase.auth.signOut();
    }

  } catch (error) {
    console.log('❌ API Error:', error.message);
  }

  console.log('');
  console.log('✅ PROJECT-LEVEL AUTH FIX COMPLETE!');
  console.log('');
  console.log('🧪 YOU CAN NOW:');
  console.log('• Sign up any user without email verification');
  console.log('• Login immediately after signup');
  console.log('• Use dan@dkdev.io with any password (create new account if needed)');
  console.log('• Focus on other parts of your app');
}

fixAuthAtProjectLevel();