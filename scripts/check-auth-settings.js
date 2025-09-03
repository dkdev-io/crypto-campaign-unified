const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabaseUrl = process.env.SUPABASE_URL || 'https://kmepcdsklnnxokoimvzo.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkAuthSettings() {
  console.log('🔍 Checking Supabase Auth Configuration...\n');
  
  console.log('📧 Email Settings:');
  console.log('- Supabase URL:', supabaseUrl);
  console.log('- Email confirmation should be enabled in Supabase Dashboard');
  console.log('- Check https://supabase.com/dashboard/project/kmepcdsklnnxokoimvzo/auth/templates');
  console.log('');
  
  console.log('🔗 Redirect URLs (must be configured in Supabase Auth settings):');
  console.log('- https://cryptocampaign.netlify.app/auth');
  console.log('- https://cryptocampaign.netlify.app/donors/dashboard');
  console.log('- https://cryptocampaign.netlify.app/campaigns/auth');
  console.log('');
  
  console.log('📝 To fix email issues:');
  console.log('1. Go to https://supabase.com/dashboard/project/kmepcdsklnnxokoimvzo/auth/url-configuration');
  console.log('2. Add the redirect URLs listed above to "Redirect URLs"');
  console.log('3. Go to https://supabase.com/dashboard/project/kmepcdsklnnxokoimvzo/auth/email-templates');
  console.log('4. Ensure email templates are enabled and configured');
  console.log('5. Check SMTP settings if using custom SMTP');
  console.log('');
  
  console.log('✉️ Testing signup with confirmation email...');
  
  try {
    // Create a test signup to see if emails are working
    const testEmail = `test-${Date.now()}@example.com`;
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: 'TestPassword123!',
      options: {
        emailRedirectTo: 'https://cryptocampaign.netlify.app/auth?verified=true'
      }
    });
    
    if (error) {
      console.error('❌ Signup test failed:', error.message);
    } else {
      console.log('✅ Signup test successful!');
      console.log('- User ID:', data.user?.id);
      console.log('- Email confirmation required:', !data.user?.email_confirmed_at);
      
      // Clean up test user
      if (data.user?.id) {
        await supabase.auth.admin.deleteUser(data.user.id);
        console.log('🧹 Test user cleaned up');
      }
    }
  } catch (error) {
    console.error('❌ Error during test:', error.message);
  }
}

checkAuthSettings();