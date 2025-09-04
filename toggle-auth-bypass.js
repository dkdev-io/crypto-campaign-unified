#!/usr/bin/env node

/**
 * Utility script to quickly enable/disable auth bypass
 * Usage: node toggle-auth-bypass.js [on|off]
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const frontendEnvPath = join(__dirname, 'frontend', '.env');
const command = process.argv[2];

if (!command || !['on', 'off', 'status'].includes(command)) {
  console.log('❌ Usage: node toggle-auth-bypass.js [on|off|status]');
  console.log('  on     - Enable auth bypass (VITE_SKIP_AUTH=true)');
  console.log('  off    - Disable auth bypass (VITE_SKIP_AUTH=false)');
  console.log('  status - Show current bypass status');
  process.exit(1);
}

try {
  let envContent = readFileSync(frontendEnvPath, 'utf8');
  const currentMatch = envContent.match(/VITE_SKIP_AUTH=(true|false)/);
  const currentValue = currentMatch?.[1] || 'not found';

  if (command === 'status') {
    console.log(`🔍 Current bypass status: VITE_SKIP_AUTH=${currentValue}`);
    if (currentValue === 'true') {
      console.log('🚨 Auth bypass is ENABLED');
      console.log('   - All authentication is bypassed');
      console.log('   - Auto-login as test@dkdev.io');
      console.log('   - Admin, donor, and main auth all bypassed');
    } else if (currentValue === 'false') {
      console.log('✅ Auth bypass is DISABLED (normal auth flow)');
    } else {
      console.log('❌ VITE_SKIP_AUTH not found in frontend/.env');
    }
    process.exit(0);
  }

  if (command === 'on') {
    if (currentValue === 'true') {
      console.log('ℹ️  Auth bypass is already enabled');
    } else {
      envContent = envContent.replace(/VITE_SKIP_AUTH=(true|false)/, 'VITE_SKIP_AUTH=true');
      writeFileSync(frontendEnvPath, envContent);
      console.log('✅ Auth bypass ENABLED');
      console.log('🚨 You are now authenticated as test@dkdev.io');
      console.log('🔄 Restart your dev server to apply changes');
    }
  }

  if (command === 'off') {
    if (currentValue === 'false') {
      console.log('ℹ️  Auth bypass is already disabled');
    } else {
      envContent = envContent.replace(/VITE_SKIP_AUTH=(true|false)/, 'VITE_SKIP_AUTH=false');
      writeFileSync(frontendEnvPath, envContent);
      console.log('✅ Auth bypass DISABLED');
      console.log('🔒 Normal authentication flow restored');
      console.log('🔄 Restart your dev server to apply changes');
    }
  }
} catch (error) {
  console.log('❌ Error:', error.message);
  process.exit(1);
}
