#!/usr/bin/env node

/**
 * Fix Email Bounce Issues for Supabase Project
 * 
 * This script addresses the high email bounce rate by:
 * 1. Replacing invalid test emails with valid development emails
 * 2. Implementing proper email validation
 * 3. Configuring development-safe email practices
 */

const fs = require('fs');
const path = require('path');

// Valid development email domains that won't bounce
const VALID_DEV_DOMAINS = [
  'gmail.com',
  'dkdev.io',
  'localhost.local',
  'dev.local'
];

// Problematic domains causing bounces
const PROBLEMATIC_DOMAINS = [
  'example.com',
  'test.com', 
  'livetest.com'
];

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Replace problematic test emails with valid ones
 */
function fixEmailsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Replace @example.com emails
    content = content.replace(/[\w.-]+@example\.com/g, (match) => {
      modified = true;
      const localPart = match.split('@')[0];
      return `${localPart}@dkdev.io`;
    });

    // Replace @test.com emails
    content = content.replace(/[\w.-]+@test\.com/g, (match) => {
      modified = true;
      const localPart = match.split('@')[0];
      return `${localPart}@dev.local`;
    });

    // Replace @livetest.com emails
    content = content.replace(/[\w.-]+@livetest\.com/g, (match) => {
      modified = true;
      const localPart = match.split('@')[0];
      return `${localPart}@localhost.local`;
    });

    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed emails in: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Create email validation utility
 */
function createEmailValidator() {
  const validatorPath = '/Users/Danallovertheplace/crypto-campaign-unified/src/utils/emailValidator.js';
  
  const validatorContent = `/**
 * Email Validation Utility
 * Prevents invalid emails from being sent to Supabase
 */

const EMAIL_REGEX = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;

// Domains that should not receive actual emails in development
const BLOCKED_DEV_DOMAINS = [
  'example.com',
  'test.com',
  'livetest.com',
  'tempmail.com',
  'guerrillamail.com'
];

/**
 * Validates email format and domain
 * @param {string} email 
 * @returns {boolean}
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  
  // Basic format validation
  if (!EMAIL_REGEX.test(email)) return false;
  
  // Check for blocked domains in development
  if (process.env.NODE_ENV === 'development') {
    const domain = email.split('@')[1]?.toLowerCase();
    if (BLOCKED_DEV_DOMAINS.includes(domain)) {
      console.warn(\`⚠️ Blocked email domain in development: \${domain}\`);
      return false;
    }
  }
  
  return true;
}

/**
 * Sanitizes email for development use
 * @param {string} email 
 * @returns {string}
 */
export function sanitizeEmailForDev(email) {
  if (!email) return '';
  
  const [localPart, domain] = email.split('@');
  
  // Replace problematic domains with safe ones
  if (BLOCKED_DEV_DOMAINS.includes(domain?.toLowerCase())) {
    return \`\${localPart}@dev.local\`;
  }
  
  return email;
}

/**
 * Checks if email domain is likely to bounce
 * @param {string} email 
 * @returns {boolean}
 */
export function isLikelyToBounce(email) {
  if (!email) return true;
  
  const domain = email.split('@')[1]?.toLowerCase();
  return BLOCKED_DEV_DOMAINS.includes(domain);
}
`;

  fs.writeFileSync(validatorPath, validatorContent);
  console.log(`✅ Created email validator: ${validatorPath}`);
}

/**
 * Main execution
 */
function main() {
  console.log('🔧 Fixing email bounce issues...\n');
  
  // Files that need email fixes
  const filesToFix = [
    '/Users/Danallovertheplace/crypto-campaign-unified/src/utils/logger.example.js',
    '/Users/Danallovertheplace/crypto-campaign-unified/tests/e2e/e2e/live-site-monitoring.spec.js',
    '/Users/Danallovertheplace/crypto-campaign-unified/tests/e2e/fixtures/test-data.js',
    '/Users/Danallovertheplace/crypto-campaign-unified/tests/e2e/fixtures/test-helpers.js',
    '/Users/Danallovertheplace/crypto-campaign-unified/backend/src/test/utils/testHelpers.js',
    '/Users/Danallovertheplace/crypto-campaign-unified/scripts/configure-supabase-email.js'
  ];

  let fixedCount = 0;
  filesToFix.forEach(file => {
    if (fs.existsSync(file) && fixEmailsInFile(file)) {
      fixedCount++;
    }
  });

  // Create email validator utility
  createEmailValidator();

  console.log(`\n📊 Summary:`);
  console.log(`   Fixed emails in ${fixedCount} files`);
  console.log(`   Created email validation utility`);
  console.log(`   Replaced bouncing domains with development-safe alternatives`);
  
  console.log(`\n✅ Email bounce issues should be resolved!`);
  console.log(`\n🚧 Next steps:`);
  console.log(`   1. Update tests to use the new email validator`);
  console.log(`   2. Configure custom SMTP provider for production`);
  console.log(`   3. Set environment variables for proper email handling`);
}

if (require.main === module) {
  main();
}

module.exports = { fixEmailsInFile, createEmailValidator };