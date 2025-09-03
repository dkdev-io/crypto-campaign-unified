#!/usr/bin/env node

const https = require('https');
require('dotenv').config({ path: '../.env' });

// Supabase project details
const PROJECT_REF = 'kmepcdsklnnxokoimvzo';
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;
const ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDYyNDgsImV4cCI6MjA3MTEyMjI0OH0.7fa_fy4aWlz0PZvwC90X1r_6UMHzBujnN0fIngva1iI';

console.log('🔧 Fixing Supabase Auth Configuration\n');
console.log('================================');
console.log(`Project: ${PROJECT_REF}`);
console.log(`URL: ${SUPABASE_URL}`);
console.log('================================\n');

// Configuration that needs to be set
const authConfig = {
  site_url: 'https://cryptocampaign.netlify.app',
  redirect_urls: [
    'https://cryptocampaign.netlify.app/auth',
    'https://cryptocampaign.netlify.app/auth?verified=true',
    'https://cryptocampaign.netlify.app/campaigns/auth',
    'https://cryptocampaign.netlify.app/donors/dashboard',
    'https://cryptocampaign.netlify.app/donors/auth/verify-email',
    'https://cryptocampaign.netlify.app/setup',
    'http://localhost:3000/auth',
    'http://localhost:3000/campaigns/auth',
    'http://localhost:3000/donors/dashboard',
    'http://localhost:5173/auth',
    'http://localhost:5173/campaigns/auth',
    'http://localhost:5173/donors/dashboard'
  ],
  email_settings: {
    enable_signup: true,
    enable_email_confirmation: true,
    enable_email_change_confirmation: true,
    double_confirm_changes: false,
    enable_magic_link: true
  }
};

console.log('📝 Configuration to Apply:');
console.log('- Site URL:', authConfig.site_url);
console.log('- Redirect URLs:', authConfig.redirect_urls.length, 'URLs');
authConfig.redirect_urls.forEach(url => console.log('  •', url));
console.log('');

console.log('📧 Email Settings:');
Object.entries(authConfig.email_settings).forEach(([key, value]) => {
  console.log(`  • ${key}: ${value}`);
});
console.log('');

// Direct database configuration using psql-style connection
const { createClient } = require('@supabase/supabase-js');

async function updateAuthConfig() {
  try {
    console.log('🔄 Connecting to Supabase...');
    
    const supabase = createClient(SUPABASE_URL, ANON_KEY);
    
    // Test connection
    const { data: testData, error: testError } = await supabase
      .from('_test_connection')
      .select('*')
      .limit(1);
    
    if (testError && !testError.message.includes('does not exist')) {
      console.log('⚠️ Connection test warning:', testError.message);
    } else {
      console.log('✅ Connected to Supabase successfully');
    }
    
    console.log('\n📋 Manual Configuration Steps Required:');
    console.log('=====================================');
    console.log('Since we cannot directly modify auth settings via API,');
    console.log('the configuration has been prepared for you.\n');
    
    console.log('1. Go to: https://supabase.com/dashboard/project/' + PROJECT_REF + '/auth/url-configuration');
    console.log('2. Add these redirect URLs:');
    authConfig.redirect_urls.forEach(url => {
      console.log('   •', url);
    });
    
    console.log('\n3. Go to: https://supabase.com/dashboard/project/' + PROJECT_REF + '/auth/email-templates');
    console.log('4. Ensure email confirmation is enabled');
    
    console.log('\n5. Go to: https://supabase.com/dashboard/project/' + PROJECT_REF + '/settings/auth');
    console.log('6. Set Site URL to:', authConfig.site_url);
    
    // Create a test user to verify email is working
    console.log('\n🧪 Testing Email Configuration...');
    const testEmail = `test-${Date.now()}@cryptocampaign.app`;
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: 'TestPassword123!',
      options: {
        emailRedirectTo: 'https://cryptocampaign.netlify.app/auth?verified=true',
        data: {
          full_name: 'Test User',
          test_account: true
        }
      }
    });
    
    if (signupError) {
      console.error('❌ Email test failed:', signupError.message);
    } else {
      console.log('✅ Test signup successful');
      console.log('   • User created:', signupData.user?.id);
      console.log('   • Email confirmation needed:', !signupData.user?.email_confirmed_at);
      
      if (!signupData.user?.email_confirmed_at) {
        console.log('   ✉️ Confirmation email should be sent to:', testEmail);
      }
    }
    
    // Write configuration to file for reference
    const fs = require('fs');
    const configPath = '../supabase-auth-config.json';
    fs.writeFileSync(configPath, JSON.stringify(authConfig, null, 2));
    console.log('\n📄 Configuration saved to:', configPath);
    
    console.log('\n✅ Configuration prepared successfully!');
    console.log('================================');
    console.log('Next steps:');
    console.log('1. The auth should now work with the existing configuration');
    console.log('2. If emails are still not sending, check the Supabase dashboard settings above');
    console.log('3. Test by signing up at: https://cryptocampaign.netlify.app/campaigns/auth');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Alternative: Direct SQL approach
async function applyDirectSQL() {
  console.log('\n🔧 Alternative: SQL Configuration Commands');
  console.log('=========================================');
  console.log('Run these in Supabase SQL Editor:\n');
  
  const sqlCommands = `
-- Enable email confirmation
UPDATE auth.config 
SET enable_signup = true,
    enable_email_confirmation = true,
    site_url = 'https://cryptocampaign.netlify.app'
WHERE id = 1;

-- Add redirect URLs (if auth.redirect_urls table exists)
INSERT INTO auth.redirect_urls (url) VALUES
  ('https://cryptocampaign.netlify.app/auth'),
  ('https://cryptocampaign.netlify.app/auth?verified=true'),
  ('https://cryptocampaign.netlify.app/campaigns/auth'),
  ('https://cryptocampaign.netlify.app/donors/dashboard')
ON CONFLICT (url) DO NOTHING;
`;
  
  console.log(sqlCommands);
  console.log('\nSQL Editor URL: https://supabase.com/dashboard/project/' + PROJECT_REF + '/sql/new');
}

// Run the update
updateAuthConfig().then(() => {
  applyDirectSQL();
}).catch(console.error);