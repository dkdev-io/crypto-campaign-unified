import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://kmepcdsklnnxokoimvzo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDYyNDgsImV4cCI6MjA3MTEyMjI0OH0.7fa_fy4aWlz0PZvwC90X1r_6UMHzBujnN0fIngva1iI'
);

async function setupTestAccount() {
  console.log('🔧 Setting up test@dkdev.io account...');

  try {
    // Try to sign in first
    console.log('1. Checking if account exists...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'test@dkdev.io', 
      password: 'TestDonor123!'
    });

    if (signInData.user && !signInError) {
      console.log('✅ Account exists and login works!');
      console.log('User ID:', signInData.user.id);
      console.log('Email confirmed:', signInData.user.email_confirmed_at ? 'Yes' : 'No');
      return true;
    }

    // Account doesn't exist or password wrong, try to create it
    console.log('2. Creating account...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: 'test@dkdev.io',
      password: 'TestDonor123!',
      options: {
        data: {
          full_name: 'Test User'
        }
      }
    });

    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        console.log('Account exists but password might be wrong');
        console.log('Try using the signup form in browser to reset password');
        return false;
      }
      throw signUpError;
    }

    console.log('✅ Account created successfully!');
    console.log('User ID:', signUpData.user?.id);
    console.log('Needs email confirmation:', !signUpData.user?.email_confirmed_at);

    if (signUpData.user && !signUpData.user.email_confirmed_at) {
      console.log('\n📧 Email confirmation required');
      console.log('Since this is a test environment, we can proceed anyway');
    }

    return true;

  } catch (error) {
    console.error('❌ Error setting up account:', error.message);
    return false;
  }
}

async function createTestyCampaignDirectly() {
  console.log('\n🚀 Creating Testy campaign directly in database...');
  
  try {
    // Get or create the user first via auth
    const { data: user } = await supabase.auth.getUser();
    let userId;
    
    if (!user.user) {
      // Sign in to get user context
      const { data: signInData } = await supabase.auth.signInWithPassword({
        email: 'test@dkdev.io',
        password: 'TestDonor123!'
      });
      userId = signInData.user?.id;
    } else {
      userId = user.user.id;
    }

    if (!userId) {
      console.log('❌ No user ID available');
      return;
    }

    // Create campaign directly in database
    const { data: campaign, error } = await supabase
      .from('campaigns')
      .insert([{
        email: 'test@dkdev.io',
        campaign_name: 'Testy',
        website: 'https://testy-pink-chancellor.lovable.app/',
        wallet_address: 'demo-wallet-' + Date.now(),
        max_donation_limit: 3300,
        suggested_amounts: [25, 50, 100, 250],
        theme_color: '#2a2a72',
        status: 'active',
        setup_completed: true
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ Failed to create campaign:', error.message);
      return;
    }

    console.log('✅ Testy campaign created!');
    console.log('Campaign ID:', campaign.id);
    console.log('Campaign URL: http://localhost:5174/testy');
    
    // Generate basic embed code
    const embedCode = `<!-- Testy Campaign Embed Code -->
<div id="testy-campaign-form"></div>
<script>
(function() {
    var iframe = document.createElement("iframe");
    iframe.src = "http://localhost:5174/embed-form?campaign=${campaign.id}";
    iframe.width = "100%";
    iframe.height = "600";
    iframe.frameBorder = "0";
    iframe.style.border = "1px solid #ddd";
    iframe.style.borderRadius = "8px";
    document.getElementById("testy-campaign-form").appendChild(iframe);
})();
</script>`;

    console.log('\n📝 EMBED CODE:');
    console.log('─'.repeat(60));
    console.log(embedCode);
    console.log('─'.repeat(60));

    console.log('\n🎉 TESTY CAMPAIGN COMPLETE!');
    console.log('📧 Email: test@dkdev.io');
    console.log('🏷️ Campaign: Testy'); 
    console.log('🎨 Style URL: https://testy-pink-chancellor.lovable.app/');
    console.log('🌐 Campaign Page: http://localhost:5174/testy');
    console.log('📱 Embed ready for any website');

    return campaign;

  } catch (error) {
    console.error('❌ Error creating campaign:', error.message);
  }
}

// Main execution
async function main() {
  const accountReady = await setupTestAccount();
  
  if (accountReady) {
    await createTestyCampaignDirectly();
  } else {
    console.log('\n⚠️ Account setup failed');
    console.log('Try manually creating account at: http://localhost:5174/campaigns/auth');
  }
}

main();