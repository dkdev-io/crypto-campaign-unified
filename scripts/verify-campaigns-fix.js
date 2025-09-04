import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kmepcdsklnnxokoimvzo.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDYyNDgsImV4cCI6MjA3MTEyMjI0OH0.7fa_fy4aWlz0PZvwC90X1r_6UMHzBujnN0fIngva1iI';

async function verifyCampaignsFix() {
  console.log('🔍 Verifying campaigns table structure...\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  try {
    // Fetch a campaign to see what columns exist
    const { data, error } = await supabase.from('campaigns').select('*').limit(1);

    if (error) {
      console.error('❌ Error fetching campaigns:', error.message);
      return;
    }

    // List of required columns for the setup wizard
    const requiredColumns = [
      'user_id',
      'user_full_name',
      'fec_committee_id',
      'committee_name',
      'committee_confirmed',
      'bank_account_verified',
      'bank_account_name',
      'bank_last_four',
      'plaid_account_id',
      'terms_accepted',
      'terms_accepted_at',
      'terms_ip_address',
      'setup_step',
      'setup_completed',
      'setup_completed_at',
      'website_analyzed',
      'style_analysis',
      'applied_styles',
      'styles_applied',
      'embed_code',
      'embed_generated_at',
      'description',
    ];

    // Check which columns exist
    const existingColumns = data && data.length > 0 ? Object.keys(data[0]) : [];

    console.log(`📊 Found ${existingColumns.length} columns in campaigns table\n`);

    // Check for missing columns
    const missingColumns = requiredColumns.filter((col) => !existingColumns.includes(col));
    const foundColumns = requiredColumns.filter((col) => existingColumns.includes(col));

    if (foundColumns.length > 0) {
      console.log(`✅ Found ${foundColumns.length} required columns:`);
      foundColumns.forEach((col) => console.log(`   ✓ ${col}`));
    }

    if (missingColumns.length > 0) {
      console.log(`\n❌ Still missing ${missingColumns.length} columns:`);
      missingColumns.forEach((col) => console.log(`   ✗ ${col}`));
      console.log('\n⚠️ The fix may not have been applied yet. Try running the fix script again.');
    } else {
      console.log('\n🎉 SUCCESS! All required columns are present!');
      console.log('✅ The campaign setup wizard should work properly now.');
      console.log('\n📍 Next steps:');
      console.log('1. Go to /setup to test the campaign setup wizard');
      console.log('2. Sign in with a campaign account');
      console.log('3. Complete all 7 steps of the setup process');
    }

    // Also check if we can create a campaign with the new fields
    console.log('\n🧪 Testing column functionality...');
    const testData = {
      name: 'Test Campaign Verification',
      email: 'test@verify.com',
      setup_step: 1,
      setup_completed: false,
      terms_accepted: false,
    };

    const { data: testCampaign, error: testError } = await supabase
      .from('campaigns')
      .insert([testData])
      .select()
      .single();

    if (testError) {
      console.log('⚠️ Could not create test campaign:', testError.message);
    } else {
      console.log('✅ Successfully created test campaign with new fields');

      // Clean up test campaign
      await supabase.from('campaigns').delete().eq('id', testCampaign.id);

      console.log('✅ Test campaign cleaned up');
    }
  } catch (err) {
    console.error('❌ Verification failed:', err.message);
  }
}

verifyCampaignsFix();
