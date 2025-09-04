#!/usr/bin/env node

/**
 * Configure Custom SMTP Provider for Supabase
 * This script helps set up a custom SMTP provider to reduce email bounces
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://kmepcdsklnnxokoimvzo.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * SMTP Provider Configuration Templates
 */
const SMTP_PROVIDERS = {
  sendgrid: {
    host: 'smtp.sendgrid.net',
    port: 587,
    user: 'apikey',
    description: 'SendGrid - Reliable email delivery',
    setup_url: 'https://sendgrid.com/pricing/',
    env_vars: ['SENDGRID_API_KEY'],
  },
  mailgun: {
    host: 'smtp.mailgun.org',
    port: 587,
    user: 'postmaster@your-domain.mailgun.org',
    description: 'Mailgun - Developer-friendly',
    setup_url: 'https://www.mailgun.com/pricing/',
    env_vars: ['MAILGUN_API_KEY', 'MAILGUN_DOMAIN'],
  },
  postmark: {
    host: 'smtp.postmarkapp.com',
    port: 587,
    user: 'your-server-token',
    description: 'Postmark - High deliverability',
    setup_url: 'https://postmarkapp.com/pricing',
    env_vars: ['POSTMARK_SERVER_TOKEN'],
  },
  ses: {
    host: 'email-smtp.us-east-1.amazonaws.com',
    port: 587,
    user: 'your-ses-access-key',
    description: 'Amazon SES - Cost-effective',
    setup_url: 'https://aws.amazon.com/ses/pricing/',
    env_vars: ['AWS_SES_ACCESS_KEY', 'AWS_SES_SECRET_KEY'],
  },
};

async function checkCurrentEmailSettings() {
  console.log('🔍 Checking current email configuration...\n');

  try {
    // Test with a safe email to check if sending works
    const testEmail = 'admin@dkdev.io';

    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: 'test-password-123',
      options: {
        emailRedirectTo: `${supabaseUrl}/auth/callback`,
      },
    });

    if (error) {
      console.log('📧 Current email system status:', error.message);
      if (error.message.includes('rate_limit') || error.message.includes('email')) {
        console.log('⚠️  Email sending may be restricted due to bounces');
      }
    } else if (data.user && !data.user.email_confirmed_at) {
      console.log('✅ Email system is working - verification email would be sent');
    }
  } catch (err) {
    console.log('⚠️  Error testing email system:', err.message);
  }
}

function displaySMTPOptions() {
  console.log('📮 Available SMTP Provider Options:\n');

  Object.entries(SMTP_PROVIDERS).forEach(([key, config]) => {
    console.log(`${key.toUpperCase()}:`);
    console.log(`  Description: ${config.description}`);
    console.log(`  Host: ${config.host}:${config.port}`);
    console.log(`  Setup URL: ${config.setup_url}`);
    console.log(`  Required ENV: ${config.env_vars.join(', ')}`);
    console.log('');
  });
}

function generateSupabaseConfig(provider) {
  const config = SMTP_PROVIDERS[provider];
  if (!config) return null;

  return `
# Add this to your supabase/config.toml
[auth.email.smtp]
enabled = true
host = "${config.host}"
port = ${config.port}
user = "${config.user}"
pass = "env(${config.env_vars[0]})"
admin_email = "noreply@dkdev.io"
sender_name = "Crypto Campaign"
`;
}

function generateEnvTemplate(provider) {
  const config = SMTP_PROVIDERS[provider];
  if (!config) return null;

  const envVars = config.env_vars
    .map((varName) => `${varName}=your_${varName.toLowerCase()}_here`)
    .join('\n');

  return `
# Add these to your .env file
${envVars}
SMTP_HOST=${config.host}
SMTP_PORT=${config.port}
SMTP_USER=${config.user}
`;
}

async function main() {
  console.log('🔧 SMTP Provider Configuration Tool\n');

  await checkCurrentEmailSettings();

  displaySMTPOptions();

  console.log('📋 Next Steps:');
  console.log('1. Choose an SMTP provider and sign up');
  console.log('2. Get your API credentials');
  console.log('3. Update your .env file with the credentials');
  console.log('4. Update supabase/config.toml with SMTP settings');
  console.log('5. Test with a small batch of valid emails\n');

  console.log('💡 For SendGrid setup:');
  console.log(generateSupabaseConfig('sendgrid'));
  console.log('💡 Environment variables needed:');
  console.log(generateEnvTemplate('sendgrid'));

  console.log('🚨 Important Notes:');
  console.log('- Start with a low sending volume');
  console.log('- Monitor bounce rates in provider dashboard');
  console.log('- Use email validation before sending');
  console.log('- Never use @example.com or @test.com domains');

  console.log('\n✅ Once configured, your email bounce issues should be resolved!');
}

if (require.main === module) {
  main();
}
