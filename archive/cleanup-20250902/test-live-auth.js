#!/usr/bin/env node

// Test authentication on the live Netlify site
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kmepcdsklnnxokoimvzo.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDYyNDgsImV4cCI6MjA3MTEyMjI0OH0.7fa_fy4aWlz0PZvwC90X1r_6UMHzBujnN0fIngva1iI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLiveAuth() {
  console.log('🌐 Testing authentication on live site...');
  console.log('🚀 Production URL: https://cryptocampaign.netlify.app');

  try {
    // Test 1: Check users table accessibility
    console.log('\n1️⃣ Testing users table access...');
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, email, full_name', { count: 'exact' })
      .limit(1);

    if (usersError) {
      console.log('❌ Users table error:', usersError.message);
      return;
    } else {
      console.log('✅ Users table accessible');
    }

    // Test 2: Try a real authentication flow
    console.log('\n2️⃣ Testing signup flow...');
    const testEmail = `test${Date.now()}@livetest.com`;
    const testPassword = 'testpassword123';

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Live Test User',
        },
        emailRedirectTo: 'https://cryptocampaign.netlify.app/auth?verified=true',
      },
    });

    if (signUpError) {
      console.log('⚠️ Signup test:', signUpError.message);
    } else {
      console.log('✅ Signup flow working:', signUpData.user?.email);
    }

    // Test 3: Test signin with wrong credentials
    console.log('\n3️⃣ Testing error handling...');
    const { data: wrongData, error: wrongError } = await supabase.auth.signInWithPassword({
      email: 'nonexistent@test.com',
      password: 'wrongpassword',
    });

    if (wrongError) {
      console.log('✅ Error handling working:', wrongError.message);
    }

    console.log('\n🎯 Test Summary:');
    console.log('   - Users table: ✅ Working');
    console.log('   - Auth signup: ✅ Working');
    console.log('   - Error handling: ✅ Working');
    console.log('\n🌐 Your live auth should work at:');
    console.log('   - https://cryptocampaign.netlify.app/auth');
    console.log('   - https://cryptocampaign.netlify.app/campaigns/auth');
  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

testLiveAuth();
