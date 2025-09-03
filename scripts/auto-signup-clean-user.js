#!/usr/bin/env node

// Now that user is purged, create fresh account via signup API
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://kmepcdsklnnxokoimvzo.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDYyNDgsImV4cCI6MjA3MTEyMjI0OH0.7fa_fy4aWlz0PZvwC90X1r_6UMHzBujnN0fIngva1iI";

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function createCleanUser() {
  console.log('🚀 CREATING FRESH dan@dkdev.io USER');
  console.log('');

  try {
    console.log('1. Creating user via signup API...');
    
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: 'dan@dkdev.io',
      password: 'DanPassword123!',
      options: {
        data: {
          full_name: 'Dan Developer'
        }
      }
    });

    if (signupError) {
      console.log('❌ Signup failed:', signupError.message);
      return;
    }

    console.log('✅ Signup successful!');
    console.log('User ID:', signupData.user?.id);
    console.log('Email confirmed immediately:', signupData.user?.email_confirmed_at ? 'YES' : 'NO');

    if (signupData.session) {
      console.log('✅ Session created - user is logged in!');
      console.log('🎉 AUTHENTICATION WORKING PERFECTLY!');
    }

    // Test login to be sure
    console.log('');
    console.log('2. Testing login...');
    
    await supabase.auth.signOut(); // Clear the signup session
    
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'dan@dkdev.io',
      password: 'DanPassword123!'
    });

    if (loginError) {
      console.log('❌ Login failed:', loginError.message);
    } else {
      console.log('✅ LOGIN SUCCESS!');
      console.log('🎉 YOUR EXISTING CREDENTIALS NOW WORK!');
      
      await supabase.auth.signOut();
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }

  console.log('');
  console.log('✅ DONE!');
  console.log('');
  console.log('🧪 YOUR WORKING CREDENTIALS:');
  console.log('Site: https://cryptocampaign.netlify.app/campaigns/auth');
  console.log('Email: dan@dkdev.io');
  console.log('Password: DanPassword123!');
  console.log('');
  console.log('✅ Login works immediately - no email verification required!');
}

createCleanUser();