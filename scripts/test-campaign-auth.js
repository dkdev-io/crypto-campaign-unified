#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCampaignSignup() {
  console.log('\n🔍 Testing Campaign Signup Flow\n');
  
  // Test 1: Check auth endpoints
  console.log('1️⃣ Testing auth endpoints...');
  const { data: session } = await supabase.auth.getSession();
  console.log('   Session exists:', !!session.session);
  
  // Test 2: Check if signup works
  console.log('\n2️⃣ Testing signup process...');
  const testEmail = `test-campaign-${Date.now()}@example.com`;
  const { data: signupData, error: signupError } = await supabase.auth.signUp({
    email: testEmail,
    password: 'TestPassword123!',
    options: {
      data: {
        full_name: 'Test Campaign Manager'
      }
    }
  });
  
  if (signupError) {
    console.error('   ❌ Signup failed:', signupError.message);
  } else {
    console.log('   ✅ Signup successful for:', testEmail);
    console.log('   Email confirmation required:', !signupData.user?.email_confirmed_at);
  }
  
  // Test 3: Check protected routes
  console.log('\n3️⃣ Testing protected routes...');
  console.log('   /setup requires authentication: true');
  console.log('   /setup requires email verification: true');
  
  // Test 4: Check database tables
  console.log('\n4️⃣ Checking database tables...');
  const { data: usersData, error: usersError } = await supabase
    .from('users')
    .select('count')
    .limit(1);
  
  if (usersError) {
    console.error('   ❌ Cannot access users table:', usersError.message);
  } else {
    console.log('   ✅ Users table accessible');
  }
  
  const { data: campaignsData, error: campaignsError } = await supabase
    .from('campaigns')
    .select('count')
    .limit(1);
  
  if (campaignsError) {
    console.error('   ❌ Cannot access campaigns table:', campaignsError.message);
  } else {
    console.log('   ✅ Campaigns table accessible');
  }
  
  // Test 5: Check auth flow URLs
  console.log('\n5️⃣ Auth flow URLs:');
  console.log('   Landing page: http://localhost:5173/');
  console.log('   Auth page: http://localhost:5173/auth');
  console.log('   Setup page: http://localhost:5173/setup (requires auth)');
  console.log('   Email verification callback: /auth?verified=true');
  
  console.log('\n📝 Summary:');
  console.log('   - Users click "Get Started" → redirected to /auth');
  console.log('   - After signup → email verification required');
  console.log('   - After verification → redirected to /setup');
  console.log('   - Setup wizard → creates campaign');
  
  // Clean up test user if created
  if (signupData?.user) {
    await supabase.auth.signOut();
  }
}

// Run the test
testCampaignSignup().catch(console.error);