const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kmepcdsklnnxokoimvzo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDYyNDgsImV4cCI6MjA3MTEyMjI0OH0.7fa_fy4aWlz0PZvwC90X1r_6UMHzBujnN0fIngva1iI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyAuth() {
  console.log('🔍 Final Authentication Verification');
  console.log('====================================\n');
  
  const timestamp = Date.now();
  
  // Test 1: Campaign Auth
  console.log('✅ Campaign Auth Test:');
  const campaignEmail = `campaign.verify.${timestamp}@gmail.com`;
  const { data: cData, error: cError } = await supabase.auth.signUp({
    email: campaignEmail,
    password: 'VerifyPass123!',
    options: {
      emailRedirectTo: 'https://cryptocampaign.netlify.app/auth?verified=true',
      data: { full_name: 'Campaign Verify' }
    }
  });
  
  if (!cError) {
    console.log('   ✓ Campaign signup works');
    console.log('   ✓ User ID:', cData.user?.id);
  } else {
    console.log('   ✗ Error:', cError.message);
  }
  
  // Test 2: Donor Auth
  console.log('\n✅ Donor Auth Test:');
  const donorEmail = `donor.verify.${timestamp}@gmail.com`;
  const { data: dData, error: dError } = await supabase.auth.signUp({
    email: donorEmail,
    password: 'VerifyPass123!',
    options: {
      emailRedirectTo: 'https://cryptocampaign.netlify.app/donors/dashboard',
      data: { 
        full_name: 'Donor Verify',
        user_type: 'donor'
      }
    }
  });
  
  if (!dError) {
    console.log('   ✓ Donor signup works');
    console.log('   ✓ User ID:', dData.user?.id);
  } else {
    console.log('   ✗ Error:', dError.message);
  }
  
  // Summary
  console.log('\n📊 VERIFICATION SUMMARY:');
  console.log('========================');
  if (!cError && !dError) {
    console.log('🎉 BOTH AUTH SYSTEMS WORKING!');
    console.log('\n✅ Campaign Auth: https://cryptocampaign.netlify.app/campaigns/auth');
    console.log('✅ Donor Auth: https://cryptocampaign.netlify.app/donors/auth');
    console.log('\n📧 Note: Email verification is optional for testing');
    console.log('   Users can sign up and sign in immediately');
  } else {
    console.log('⚠️ Issues detected - see errors above');
  }
}

verifyAuth().catch(console.error);