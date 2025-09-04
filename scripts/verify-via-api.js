const fetch = require('node-fetch');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

async function checkAccounts() {
  console.log('🔍 Checking accounts via public API...\n');
  console.log('Supabase URL:', SUPABASE_URL);

  try {
    // Get all profiles (this is accessible via public API)
    const profilesResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!profilesResponse.ok) {
      console.error(
        'Failed to fetch profiles:',
        profilesResponse.status,
        profilesResponse.statusText
      );
      return;
    }

    const profiles = await profilesResponse.json();
    console.log(`Found ${profiles.length} profile(s):\n`);

    profiles.forEach((profile, index) => {
      console.log(`${index + 1}. Profile ID: ${profile.id}`);
      console.log(`   Name: ${profile.full_name || 'Not set'}`);
      console.log(`   User Type: ${profile.user_type || 'Not set'}`);
      console.log(`   Created: ${profile.created_at}`);
      console.log('');
    });

    // Get campaigns
    const campaignsResponse = await fetch(`${SUPABASE_URL}/rest/v1/campaigns`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (campaignsResponse.ok) {
      const campaigns = await campaignsResponse.json();
      console.log(`\n📊 Found ${campaigns.length} campaign(s):\n`);

      campaigns.forEach((campaign, index) => {
        console.log(`${index + 1}. Campaign: ${campaign.title}`);
        console.log(`   User ID: ${campaign.user_id}`);
        console.log(`   Goal: $${campaign.goal_amount}`);
        console.log(`   Wallet: ${campaign.wallet_address || 'Not set'}`);
        console.log(`   Status: ${campaign.status}`);
        console.log('');
      });
    }

    console.log('\n📝 SQL Commands to run in Supabase Dashboard:\n');
    console.log('1. Go to your Supabase Dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run these commands:\n');
    console.log(`-- Verify all unverified accounts
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- Check results
SELECT email, email_confirmed_at FROM auth.users;`);
  } catch (error) {
    console.error('Error:', error);
  }
}

checkAccounts();
