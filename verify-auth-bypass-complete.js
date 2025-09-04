#!/usr/bin/env node

/**
 * Complete verification script for auth bypass implementation
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 COMPLETE AUTH BYPASS VERIFICATION');
console.log('='.repeat(60));

// Test all auth contexts
const authContexts = [
  {
    name: 'Main AuthContext',
    path: join(__dirname, 'frontend', 'src', 'contexts', 'AuthContext.jsx'),
    testUser: 'test@dkdev.io',
    expectedMessages: [
      'DEVELOPMENT AUTH BYPASS ACTIVE',
      'AUTH BYPASS - Signin bypassed',
      'AUTH BYPASS - Signup bypassed',
    ],
  },
  {
    name: 'DonorAuthContext',
    path: join(__dirname, 'frontend', 'src', 'contexts', 'DonorAuthContext.jsx'),
    testUser: 'test@dkdev.io',
    expectedMessages: ['DONOR AUTH BYPASS ACTIVE'],
  },
  {
    name: 'AdminContext',
    path: join(__dirname, 'frontend', 'src', 'contexts', 'AdminContext.jsx'),
    testUser: 'test@dkdev.io',
    expectedMessages: ['ADMIN AUTH BYPASS ACTIVE'],
  },
];

let allTestsPassed = true;

authContexts.forEach((context) => {
  console.log(`\\n📋 Testing ${context.name}:`);

  try {
    const content = readFileSync(context.path, 'utf8');

    const checks = [
      {
        name: 'SKIP_AUTH constant defined',
        test: content.includes('const SKIP_AUTH = import.meta.env.VITE_SKIP_AUTH'),
      },
      {
        name: 'Development environment check',
        test: content.includes('IS_DEVELOPMENT = import.meta.env.DEV'),
      },
      {
        name: 'Test user configured',
        test: content.includes(context.testUser),
      },
      {
        name: 'Bypass logic in useEffect',
        test: content.includes('SKIP_AUTH && IS_DEVELOPMENT'),
      },
      {
        name: 'Expected warning messages',
        test: context.expectedMessages.every((msg) => content.includes(msg)),
      },
    ];

    checks.forEach((check) => {
      if (check.test) {
        console.log(`  ✅ ${check.name}`);
      } else {
        console.log(`  ❌ ${check.name}`);
        allTestsPassed = false;
      }
    });
  } catch (error) {
    console.log(`  ❌ Could not read ${context.path}:`, error.message);
    allTestsPassed = false;
  }
});

// Test environment configuration
console.log('\\n🔧 Environment Configuration:');
try {
  const frontendEnvPath = join(__dirname, 'frontend', '.env');
  const envContent = readFileSync(frontendEnvPath, 'utf8');

  const skipAuthMatch = envContent.match(/VITE_SKIP_AUTH=(true|false)/);
  if (skipAuthMatch) {
    const value = skipAuthMatch[1];
    console.log(`  ✅ VITE_SKIP_AUTH = ${value}`);

    if (value === 'true') {
      console.log('  🚨 AUTH BYPASS IS CURRENTLY ENABLED');
    } else {
      console.log('  ✅ Auth bypass is safely disabled');
    }
  } else {
    console.log('  ❌ VITE_SKIP_AUTH not found');
    allTestsPassed = false;
  }
} catch (error) {
  console.log('  ❌ Could not read frontend/.env:', error.message);
  allTestsPassed = false;
}

// Production safety checks
console.log('\\n🛡️ Production Safety Verification:');
const authContextPath = join(__dirname, 'frontend', 'src', 'contexts', 'AuthContext.jsx');
try {
  const authContent = readFileSync(authContextPath, 'utf8');

  const safetyChecks = [
    {
      name: 'Production error throwing',
      test: authContent.includes('AUTH BYPASS ENABLED IN PRODUCTION - ABORTING'),
    },
    {
      name: 'Environment validation',
      test: authContent.includes('!IS_DEVELOPMENT'),
    },
    {
      name: 'Console warnings',
      test:
        authContent.includes('console.warn') &&
        authContent.includes('DEVELOPMENT AUTH BYPASS IS ACTIVE'),
    },
  ];

  safetyChecks.forEach((check) => {
    if (check.test) {
      console.log(`  ✅ ${check.name}`);
    } else {
      console.log(`  ❌ ${check.name}`);
      allTestsPassed = false;
    }
  });
} catch (error) {
  console.log('  ❌ Could not verify production safety:', error.message);
  allTestsPassed = false;
}

// Final status
console.log('\\n' + '='.repeat(60));
if (allTestsPassed) {
  console.log('🎉 ALL TESTS PASSED - Auth bypass implementation is complete!');
  console.log('\\n📱 Ready to use:');
  console.log('1. Navigate to http://localhost:5173');
  console.log('2. Check browser console for bypass warnings');
  console.log('3. You should be auto-logged in as test@dkdev.io');
  console.log('4. All protected routes should work immediately');
  console.log('5. Admin, donor, and main auth contexts all bypassed');
} else {
  console.log('❌ SOME TESTS FAILED - Please review the errors above');
  allTestsPassed = false;
}

console.log('\\n🎯 Current Test User Details:');
console.log('  Email: test@dkdev.io');
console.log('  Main Auth: Test User (Bypass) - admin role');
console.log('  Donor Auth: Test Donor (Bypass) - full donor profile');
console.log('  Admin Auth: Test Admin (Bypass) - super_admin permissions');

process.exit(allTestsPassed ? 0 : 1);
