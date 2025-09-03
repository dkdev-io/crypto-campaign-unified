const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client with service role key for admin access
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function verifyAccounts() {
  console.log('🔍 Fetching unverified accounts...\n');
  
  try {
    // Get all unverified users from auth.users table
    const { data: users, error: fetchError } = await supabase.auth.admin.listUsers();
    
    if (fetchError) {
      console.error('Error fetching users:', fetchError);
      return;
    }
    
    // Filter unverified users
    const unverifiedUsers = users.users.filter(user => !user.email_confirmed_at);
    
    if (unverifiedUsers.length === 0) {
      console.log('✅ All accounts are already verified!');
      return;
    }
    
    console.log(`Found ${unverifiedUsers.length} unverified account(s):\n`);
    
    // Display unverified accounts
    unverifiedUsers.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`);
      console.log(`   Metadata:`, user.user_metadata);
      console.log('');
    });
    
    // Verify each account
    console.log('🔧 Verifying accounts...\n');
    
    for (const user of unverifiedUsers) {
      const { data, error } = await supabase.auth.admin.updateUserById(
        user.id,
        {
          email_confirmed_at: new Date().toISOString(),
          user_metadata: {
            ...user.user_metadata,
            manually_verified: true,
            verified_at: new Date().toISOString()
          }
        }
      );
      
      if (error) {
        console.error(`❌ Failed to verify ${user.email}:`, error.message);
      } else {
        console.log(`✅ Verified: ${user.email}`);
        
        // Check if user has a profile and user type
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          console.log(`   Profile exists: ${profile.full_name || 'No name set'}`);
          console.log(`   User type: ${profile.user_type || 'Not set'}`);
        } else {
          console.log(`   ⚠️  No profile found for this user`);
        }
        
        // Check if it's a campaign account
        const { data: campaign } = await supabase
          .from('campaigns')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (campaign) {
          console.log(`   Campaign: ${campaign.title}`);
          console.log(`   Wallet: ${campaign.wallet_address || 'Not set'}`);
        }
        
        // Check if it's a donor account
        const { data: donations } = await supabase
          .from('donations')
          .select('*')
          .eq('donor_email', user.email);
        
        if (donations && donations.length > 0) {
          console.log(`   Donor with ${donations.length} donation(s)`);
        }
        
        console.log('');
      }
    }
    
    console.log('\n✅ Verification complete!\n');
    
    // Show summary
    const { data: verifiedUsers } = await supabase.auth.admin.listUsers();
    const nowVerified = verifiedUsers.users.filter(user => user.email_confirmed_at);
    console.log(`Total verified accounts: ${nowVerified.length}`);
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the verification
verifyAccounts();