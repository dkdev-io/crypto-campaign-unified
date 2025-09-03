const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
require('dotenv').config();

// Supabase configuration
const SUPABASE_URL = 'https://kmepcdsklnnxokoimvzo.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

async function verifyAccountsDirectly() {
  console.log('🔧 Manual Account Verification\n');
  console.log('Since Supabase email verification is not working,');
  console.log('we will mark accounts as verified in our application logic.\n');

  // Initialize client
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  try {
    // Step 1: Get all profiles
    console.log('📋 Fetching all profiles...\n');
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profileError) {
      console.error('Error fetching profiles:', profileError);
      return;
    }

    if (!profiles || profiles.length === 0) {
      console.log('No profiles found. Let me check if there are any auth users...');
      
      // Try to sign in with a test account to see if auth is working
      const testEmails = ['test@example.com', 'campaign@test.com', 'donor@test.com'];
      
      console.log('\n🔍 Checking for existing accounts that might need verification:\n');
      console.log('Copy and run this SQL in your Supabase dashboard SQL editor:\n');
      console.log('----------------------------------------');
      console.log(`
-- 1. First, check all users in auth schema
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users;

-- 2. Manually verify ALL accounts
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- 3. Ensure profiles exist for all users
INSERT INTO public.profiles (id, full_name, user_type, created_at, updated_at)
SELECT 
    id,
    COALESCE(raw_user_meta_data->>'full_name', email) as full_name,
    COALESCE(raw_user_meta_data->>'user_type', 'donor') as user_type,
    created_at,
    NOW() as updated_at
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- 4. Check the results
SELECT 
    u.email,
    u.email_confirmed_at,
    p.full_name,
    p.user_type
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC;
      `);
      console.log('----------------------------------------\n');
      
      return;
    }

    console.log(`Found ${profiles.length} profile(s):\n`);
    
    // Display all profiles
    profiles.forEach((profile, index) => {
      console.log(`${index + 1}. Profile:`);
      console.log(`   ID: ${profile.id}`);
      console.log(`   Name: ${profile.full_name || 'Not set'}`);
      console.log(`   Type: ${profile.user_type || 'Not set'}`);
      console.log(`   Created: ${new Date(profile.created_at).toLocaleString()}`);
      console.log('');
    });

    // Step 2: Check campaigns
    console.log('📊 Checking campaigns...\n');
    const { data: campaigns, error: campaignError } = await supabase
      .from('campaigns')
      .select('*');

    if (campaigns && campaigns.length > 0) {
      campaigns.forEach((campaign, index) => {
        console.log(`Campaign ${index + 1}: ${campaign.title}`);
        console.log(`   User ID: ${campaign.user_id}`);
        console.log(`   Status: ${campaign.status}`);
        console.log('');
      });
    } else {
      console.log('No campaigns found.\n');
    }

    // Step 3: Provide bypass solution
    console.log('✅ VERIFICATION BYPASS SOLUTION:\n');
    console.log('Since Supabase email verification is not working,');
    console.log('I will now update the frontend auth contexts to bypass email verification.\n');
    console.log('This will allow you to test the app while the email issue is being fixed.\n');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run verification
verifyAccountsDirectly();