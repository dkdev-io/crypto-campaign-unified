#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: './frontend/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔧 Configuring Supabase Email Settings');
console.log('====================================');

// Try to enable email confirmation via API
async function enableEmailConfirmation() {
  try {
    console.log('📧 Current settings show mailer_autoconfirm: false');
    console.log('🔄 Attempting to enable email confirmation...');

    // Use management API to update auth settings
    const response = await fetch(`${supabaseUrl}/auth/v1/admin/settings`, {
      method: 'PUT',
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        MAILER_AUTOCONFIRM: false, // This should be false to REQUIRE email confirmation
        ENABLE_SIGNUP: true,
        SITE_URL: 'https://cryptocampaign.netlify.app',
        ADDITIONAL_REDIRECT_URLS:
          'http://localhost:3000,http://localhost:5173,https://cryptocampaign.netlify.app',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.log('❌ API call failed - need service role key for admin operations');
      console.log('⚠️  Response:', error);

      console.log('\n🎯 MANUAL FIX REQUIRED:');
      console.log('1. Go to https://supabase.com/dashboard/project/kmepcdsklnnxokoimvzo');
      console.log('2. Navigate to Authentication > Settings');
      console.log('3. Enable "Email confirmations" (currently disabled)');
      console.log('4. Save settings');

      return false;
    }

    const result = await response.json();
    console.log('✅ Settings updated:', result);
    return true;
  } catch (error) {
    console.error('❌ Error updating settings:', error.message);
    return false;
  }
}

// Test email confirmation after settings change
async function testEmailAfterFix() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const testEmail = `test.${Date.now()}@gmail.com`;

  try {
    console.log('\n🧪 Testing signup after email fix...');

    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: 'TestPassword123!',
      options: {
        data: { full_name: 'Test User' },
        emailRedirectTo: `${process.env.VITE_APP_URL || 'https://cryptocampaign.netlify.app'}/auth?verified=true`,
      },
    });

    if (error) {
      console.error('❌ Signup test failed:', error.message);
      return false;
    }

    console.log('✅ Signup successful');
    console.log(`📧 User should receive verification email at: ${testEmail}`);
    console.log(
      `🔗 Email will link to: ${process.env.VITE_APP_URL || 'https://cryptocampaign.netlify.app'}/auth?verified=true`
    );

    return true;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Main execution
async function main() {
  const emailEnabled = await enableEmailConfirmation();

  if (emailEnabled) {
    console.log('\n⏳ Waiting 5 seconds for settings to propagate...');
    await new Promise((resolve) => setTimeout(resolve, 5000));
    await testEmailAfterFix();
  }

  console.log('\n🎯 NEXT STEPS:');
  console.log('1. Signup should now send verification emails');
  console.log('2. Test the auth flow at https://cryptocampaign.netlify.app');
  console.log('3. Check spam folder if email not received');
}

main().catch(console.error);
