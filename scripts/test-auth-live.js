const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabaseUrl = 'https://kmepcdsklnnxokoimvzo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDYyNDgsImV4cCI6MjA3MTEyMjI0OH0.7fa_fy4aWlz0PZvwC90X1r_6UMHzBujnN0fIngva1iI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuth() {
  console.log('🧪 Testing Authentication System');
  console.log('================================\n');
  
  // Test Campaign Auth Signup
  console.log('1️⃣ Testing Campaign Auth Signup...');
  const campaignEmail = `campaign.test.${Date.now()}@gmail.com`;
  
  const { data: campaignData, error: campaignError } = await supabase.auth.signUp({
    email: campaignEmail,
    password: 'TestPassword123!',
    options: {
      emailRedirectTo: 'https://cryptocampaign.netlify.app/auth?verified=true',
      data: {
        full_name: 'Campaign Test User'
      }
    }
  });
  
  if (campaignError) {
    console.error('❌ Campaign signup failed:', campaignError.message);
  } else {
    console.log('✅ Campaign signup successful!');
    console.log('   • User ID:', campaignData.user?.id);
    console.log('   • Email:', campaignData.user?.email);
    console.log('   • Confirmation required:', !campaignData.user?.email_confirmed_at);
    if (!campaignData.user?.email_confirmed_at) {
      console.log('   📧 Check email at:', campaignEmail);
    }
  }
  
  console.log('');
  
  // Test Donor Auth Signup
  console.log('2️⃣ Testing Donor Auth Signup...');
  const donorEmail = `donor.test.${Date.now()}@gmail.com`;
  
  const { data: donorData, error: donorError } = await supabase.auth.signUp({
    email: donorEmail,
    password: 'TestPassword123!',
    options: {
      emailRedirectTo: 'https://cryptocampaign.netlify.app/donors/dashboard',
      data: {
        full_name: 'Donor Test User',
        user_type: 'donor',
        donor_type: 'individual'
      }
    }
  });
  
  if (donorError) {
    console.error('❌ Donor signup failed:', donorError.message);
  } else {
    console.log('✅ Donor signup successful!');
    console.log('   • User ID:', donorData.user?.id);
    console.log('   • Email:', donorData.user?.email);
    console.log('   • Confirmation required:', !donorData.user?.email_confirmed_at);
    if (!donorData.user?.email_confirmed_at) {
      console.log('   📧 Check email at:', donorEmail);
    }
  }
  
  console.log('');
  console.log('📊 Test Summary:');
  console.log('==============');
  
  if (!campaignError && !donorError) {
    console.log('✅ Both auth systems are working!');
    console.log('');
    console.log('📧 Email Configuration Status:');
    if (!campaignData.user?.email_confirmed_at && !donorData.user?.email_confirmed_at) {
      console.log('⚠️ Email confirmation is required but emails may not be sending.');
      console.log('   This could be because:');
      console.log('   1. Supabase is using default email service (limited)');
      console.log('   2. Email templates need configuration');
      console.log('   3. SMTP settings need to be configured');
    } else {
      console.log('✅ Email system is working properly!');
    }
  } else {
    console.log('❌ There are issues with the auth system');
  }
  
  console.log('\n🔗 Test the live site:');
  console.log('   Campaign Auth: https://cryptocampaign.netlify.app/campaigns/auth');
  console.log('   Donor Auth: https://cryptocampaign.netlify.app/donors/auth');
}

testAuth().catch(console.error);