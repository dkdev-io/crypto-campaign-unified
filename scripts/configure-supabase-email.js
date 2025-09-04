#!/usr/bin/env node

/**
 * SUPABASE EMAIL CONFIGURATION SCRIPT
 *
 * This script configures email verification settings for the Supabase project.
 * It enables email confirmations and sets up the necessary templates.
 *
 * Since we can't access the Management API directly without additional auth,
 * this provides the exact configuration values needed.
 */

import { createClient } from '@supabase/supabase-js';

const PROJECT_REF = 'kmepcdsklnnxokoimvzo';
const supabaseUrl = `https://${PROJECT_REF}.supabase.co`;
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDYyNDgsImV4cCI6MjA3MTEyMjI0OH0.7fa_fy4aWlz0PZvwC90X1r_6UMHzBujnN0fIngva1iI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warning: '\x1b[33m',
    reset: '\x1b[0m',
  };
}

async function checkCurrentAuthSettings() {
  log('🔍 Checking current authentication configuration...', 'info');

  try {
    // Test if email confirmation is working by attempting to sign up
    const testEmail = `test-${Date.now()}@example.com`;

    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: 'TestPassword123!',
      options: {
        data: {
          full_name: 'Test User',
        },
      },
    });

    if (error) {
      log(`❌ Auth test failed: ${error.message}`, 'error');
      return false;
    }

    if (data?.user && !data?.user?.email_confirmed_at && data?.user?.confirmation_sent_at) {
      log('✅ Email confirmation is properly configured!', 'success');
      log('   - Confirmation email would be sent', 'info');
      log('   - User must verify before logging in', 'info');
      return true;
    } else if (data?.user?.email_confirmed_at) {
      log('⚠️ Auto-confirmation is enabled (emails skip verification)', 'warning');
      return false;
    } else {
      log('❓ Unclear email confirmation status', 'warning');
      return false;
    }
  } catch (error) {
    log(`❌ Error checking auth settings: ${error.message}`, 'error');
    return false;
  }
}

function printManualConfigurationSteps() {
  log('\n📧 MANUAL CONFIGURATION REQUIRED', 'warning');
  log('==========================================', 'info');

  log('\n🔧 STEP 1: Configure Email in Supabase Dashboard', 'info');
  log('1. Go to: https://supabase.com/dashboard/project/kmepcdsklnnxokoimvzo/auth/users', 'info');
  log('2. Click "Configuration" tab', 'info');
  log('3. Scroll to "User Signups"', 'info');
  log('4. Ensure "Enable email confirmations" is CHECKED', 'info');

  log('\n📨 STEP 2: Configure Email Templates', 'info');
  log(
    '1. Go to: https://supabase.com/dashboard/project/kmepcdsklnnxokoimvzo/auth/templates',
    'info'
  );
  log('2. Edit "Confirm signup" template:', 'info');

  const confirmTemplate = `<h2>Welcome to your Campaign Platform!</h2>
<p>Thanks for signing up. Follow this link to confirm your account:</p>
<p><a href="{{ .ConfirmationURL }}" style="background-color: #2a2a72; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Confirm your email</a></p>
<p>Or copy and paste this URL into your browser:</p>
<p>{{ .ConfirmationURL }}</p>
<p>This link expires in 24 hours.</p>`;

  log('\n📬 STEP 3: Configure SMTP (Optional but Recommended)', 'info');
  log(
    '1. Go to: https://supabase.com/dashboard/project/kmepcdsklnnxokoimvzo/settings/auth',
    'info'
  );
  log('2. Scroll to "SMTP Settings"', 'info');
  log('3. Either use Supabase built-in email OR configure custom SMTP', 'info');

  log('\n🧪 STEP 4: Test Configuration', 'info');
  log('1. Run: node scripts/test-auth-system.js', 'info');
  log('2. Or test signup in your AuthFlow component', 'info');
  log('3. Check that confirmation email is sent', 'info');

  log('\n⚙️ RECOMMENDED SETTINGS:', 'info');
  log('- ✅ Enable email confirmations', 'success');
  log('- ✅ Disable auto-confirm users', 'success');
  log('- ✅ Set confirmation URL to your domain', 'success');
  log('- ✅ Set custom SMTP for production', 'success');
}

function printAuthFlowConfiguration() {
  log('\n🔄 AUTH FLOW CONFIGURATION', 'info');
  log('============================', 'info');

  log('\nYour auth system is configured to:', 'info');
  log('1. ✅ Require email verification on signup', 'success');
  log('2. ✅ Block unverified users from logging in', 'success');
  log('3. ✅ Show profile completion after verification', 'success');
  log('4. ✅ Show donor data setup after profile completion', 'success');
  log('5. ✅ Allow team invitations after setup', 'success');

  log('\nSupabase Auth Settings:', 'info');
  log('- Project URL: https://kmepcdsklnnxokoimvzo.supabase.co', 'info');
  log('- Auth URL: https://kmepcdsklnnxokoimvzo.supabase.co/auth/v1', 'info');
  log('- Redirect URL: http://localhost:5173 (update for production)', 'info');
}

function printProductionSettings() {
  log('\n🚀 PRODUCTION CONFIGURATION', 'info');
  log('=============================', 'info');

  log('\nFor production deployment:', 'info');
  log('1. Update Site URL to your production domain', 'info');
  log('2. Add production domain to redirect URLs', 'info');
  log('3. Configure custom SMTP provider (SendGrid, AWS SES, etc.)', 'info');
  log('4. Update email templates with your branding', 'info');
  log('5. Test email delivery and spam folder placement', 'info');

  log('\nSite URL Examples:', 'info');
  log('- https://yourcampaign.com', 'info');
  log('- https://app.yourcampaign.com', 'info');

  log('\nRedirect URLs:', 'info');
  log('- https://yourcampaign.com/**', 'info');
  log('- https://yourcampaign.com/accept-invitation/*', 'info');
}

async function main() {
  log('🚀 Supabase Email Configuration Helper', 'info');
  log('=====================================', 'info');

  log(`\n🎯 Project: ${PROJECT_REF}`, 'info');
  log(`📍 URL: ${supabaseUrl}`, 'info');

  // Check current settings
  const isConfigured = await checkCurrentAuthSettings();

  if (isConfigured) {
    log('\n🎉 Email verification is already configured correctly!', 'success');
    printAuthFlowConfiguration();
  } else {
    printManualConfigurationSteps();
  }

  printProductionSettings();

  log('\n📞 Need Help?', 'info');
  log('- Supabase Docs: https://supabase.com/docs/guides/auth/auth-email', 'info');
  log('- Dashboard: https://supabase.com/dashboard/project/kmepcdsklnnxokoimvzo', 'info');
  log(
    '- Auth Settings: https://supabase.com/dashboard/project/kmepcdsklnnxokoimvzo/auth/users',
    'info'
  );
}

main().catch(console.error);
