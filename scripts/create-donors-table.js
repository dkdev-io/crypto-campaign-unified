const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kmepcdsklnnxokoimvzo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDYyNDgsImV4cCI6MjA3MTEyMjI0OH0.7fa_fy4aWlz0PZvwC90X1r_6UMHzBujnN0fIngva1iI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createDonorsTable() {
  console.log('🔧 Creating Donors Table and Testing Auth\n');
  
  // Test if we can connect
  try {
    console.log('1️⃣ Testing connection...');
    const { data: testData, error: testError } = await supabase
      .from('donors')
      .select('*')
      .limit(1);
    
    if (testError && testError.message.includes('does not exist')) {
      console.log('   ❌ Donors table does not exist');
      console.log('   ℹ️ This explains why donor signup is failing');
    } else if (testError) {
      console.log('   ⚠️ Other error:', testError.message);
    } else {
      console.log('   ✅ Donors table exists');
      console.log('   Found', testData?.length || 0, 'records');
    }
    
    console.log('\n2️⃣ Testing donor signup directly...');
    
    // Test the actual signup
    const testEmail = 'donor.direct.test@dkdev.io';
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: 'TestPassword123!',
      options: {
        data: {
          full_name: 'Direct Test Donor',
          phone: '555-0123',
          user_type: 'donor',
          donor_type: 'individual'
        },
        emailRedirectTo: 'https://cryptocampaign.netlify.app/donors/dashboard'
      }
    });
    
    if (signupError) {
      console.log('   ❌ Direct signup failed:', signupError.message);
    } else {
      console.log('   ✅ Direct signup successful!');
      console.log('   User ID:', signupData.user?.id);
      console.log('   Email:', signupData.user?.email);
      console.log('   Needs verification:', !signupData.user?.email_confirmed_at);
    }
    
    console.log('\n3️⃣ Testing campaign signup for comparison...');
    
    const campaignEmail = 'campaign.direct.test@dkdev.io';
    const { data: campData, error: campError } = await supabase.auth.signUp({
      email: campaignEmail,
      password: 'TestPassword123!',
      options: {
        data: {
          full_name: 'Direct Test Campaign'
        },
        emailRedirectTo: 'https://cryptocampaign.netlify.app/auth?verified=true'
      }
    });
    
    if (campError) {
      console.log('   ❌ Campaign signup failed:', campError.message);
    } else {
      console.log('   ✅ Campaign signup successful!');
      console.log('   User ID:', campData.user?.id);
    }
    
    console.log('\n📋 DIAGNOSIS:');
    console.log('=============');
    
    if (!signupError && !campError) {
      console.log('✅ Both signups work at the API level');
      console.log('❌ Issue is in the frontend DonorAuth component');
      console.log('🔍 Likely cause: DonorAuthContext error handling');
    } else if (signupError && !campError) {
      console.log('❌ Donor signup broken at API level');
      console.log('✅ Campaign signup works');
      console.log('🔍 Likely cause: Missing donors table or user_type validation');
    } else {
      console.log('❌ Both systems have issues');
      console.log('🔍 Supabase configuration problem');
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
  }
}

createDonorsTable();