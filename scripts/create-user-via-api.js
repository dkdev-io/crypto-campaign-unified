#!/usr/bin/env node

// Create user using Supabase Auth API directly
const SUPABASE_URL = "https://kmepcdsklnnxokoimvzo.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDYyNDgsImV4cCI6MjA3MTEyMjI0OH0.7fa_fy4aWlz0PZvwC90X1r_6UMHzBujnN0fIngva1iI";

async function createUser() {
  console.log('🚀 CREATING USER VIA SUPABASE AUTH API');
  console.log('');

  try {
    console.log('1. Creating user: dan@dkdev.io');
    
    const signupResponse = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'apikey': ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'dan@dkdev.io',
        password: 'DanPassword123!',
        data: {
          full_name: 'Dan Developer'
        }
      })
    });

    const signupData = await signupResponse.json();
    
    if (!signupResponse.ok) {
      console.log('❌ Signup failed:', signupData.error_description || signupData.msg);
      
      if (signupData.msg && signupData.msg.includes('already')) {
        console.log('✅ User already exists - trying login...');
      } else {
        return;
      }
    } else {
      console.log('✅ Signup successful!');
      console.log('User ID:', signupData.user?.id);
      console.log('Email confirmed:', signupData.user?.email_confirmed_at ? 'YES' : 'NO');
    }

    console.log('');
    console.log('2. Testing login...');
    
    const loginResponse = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'dan@dkdev.io',
        password: 'DanPassword123!'
      })
    });

    const loginData = await loginResponse.json();
    
    if (!loginResponse.ok) {
      console.log('❌ Login failed:', loginData.error_description || loginData.msg);
      
      if (loginData.msg && loginData.msg.includes('confirm')) {
        console.log('❌ EMAIL VERIFICATION STILL REQUIRED - Dashboard setting may not have taken effect yet');
        console.log('Wait a few minutes for Supabase to propagate the setting change');
      }
    } else {
      console.log('✅ LOGIN SUCCESS!');
      console.log('🎉 EMAIL VERIFICATION BYPASS WORKING!');
      console.log('Access token received:', loginData.access_token ? 'YES' : 'NO');
    }

  } catch (error) {
    console.log('❌ API Error:', error.message);
  }

  console.log('');
  console.log('🧪 TEST IN BROWSER NOW:');
  console.log('Go to: https://cryptocampaign.netlify.app/campaigns/auth');
  console.log('Email: dan@dkdev.io');
  console.log('Password: DanPassword123!');
  console.log('');
  console.log('Should work without email verification!');
}

createUser();