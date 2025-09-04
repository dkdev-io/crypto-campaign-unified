#!/usr/bin/env node

/**
 * Test script to verify auth bypass implementation
 */

import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Paths
const frontendEnvPath = join(__dirname, 'frontend', '.env')

console.log('🧪 Testing Authentication Bypass Implementation')
console.log('=' .repeat(60))

// Test 1: Check if environment variable is configured
try {
  const envContent = readFileSync(frontendEnvPath, 'utf8')
  
  if (envContent.includes('VITE_SKIP_AUTH=')) {
    console.log('✅ VITE_SKIP_AUTH environment variable is configured')
    
    const currentValue = envContent.match(/VITE_SKIP_AUTH=(true|false)/)?.[1]
    console.log(`   Current value: ${currentValue}`)
    
    if (currentValue === 'false') {
      console.log('✅ Auth bypass is safely disabled by default')
    } else {
      console.log('⚠️  Auth bypass is currently enabled - good for testing!')
    }
  } else {
    console.log('❌ VITE_SKIP_AUTH not found in frontend/.env')
  }
} catch (error) {
  console.log('❌ Could not read frontend/.env:', error.message)
}

// Test 2: Check AuthContext implementation
try {
  const authContextPath = join(__dirname, 'frontend', 'src', 'contexts', 'AuthContext.jsx')
  const authContent = readFileSync(authContextPath, 'utf8')
  
  const checks = [
    {
      name: 'SKIP_AUTH constant defined',
      test: authContent.includes('const SKIP_AUTH = import.meta.env.VITE_SKIP_AUTH')
    },
    {
      name: 'Production safety check',
      test: authContent.includes('AUTH BYPASS ENABLED IN PRODUCTION - ABORTING')
    },
    {
      name: 'Test user configuration',
      test: authContent.includes('TEST_USER') && authContent.includes('test@dkdev.io')
    },
    {
      name: 'Bypass logic in useEffect',
      test: authContent.includes('DEVELOPMENT AUTH BYPASS ACTIVE')
    },
    {
      name: 'SignIn bypass',
      test: authContent.includes('AUTH BYPASS - Signin bypassed')
    },
    {
      name: 'SignUp bypass',
      test: authContent.includes('AUTH BYPASS - Signup bypassed')
    }
  ]
  
  console.log('\\n📋 AuthContext Implementation Checks:')
  checks.forEach(check => {
    if (check.test) {
      console.log(`✅ ${check.name}`)
    } else {
      console.log(`❌ ${check.name}`)
    }
  })
  
} catch (error) {
  console.log('❌ Could not analyze AuthContext.jsx:', error.message)
}

// Test 3: Instructions for manual testing
console.log('\\n🔧 Manual Testing Instructions:')
console.log('1. Enable bypass: Set VITE_SKIP_AUTH=true in frontend/.env')
console.log('2. Restart dev server: npm run dev')
console.log('3. Open browser to http://localhost:5174')
console.log('4. Check browser console for bypass warnings')
console.log('5. Verify you\'re auto-logged in as test@dkdev.io')
console.log('6. Try accessing protected routes (should work immediately)')

console.log('\\n🚨 Security Test:')
console.log('1. Set NODE_ENV=production in a test environment')
console.log('2. Set VITE_SKIP_AUTH=true') 
console.log('3. Application should throw error and refuse to start')

console.log('\\n✅ Auth bypass implementation test completed!')

// Utility function to toggle bypass for testing
export function enableBypass() {
  try {
    let envContent = readFileSync(frontendEnvPath, 'utf8')
    envContent = envContent.replace(/VITE_SKIP_AUTH=false/, 'VITE_SKIP_AUTH=true')
    writeFileSync(frontendEnvPath, envContent)
    console.log('✅ Auth bypass ENABLED - restart your dev server')
  } catch (error) {
    console.log('❌ Could not enable bypass:', error.message)
  }
}

export function disableBypass() {
  try {
    let envContent = readFileSync(frontendEnvPath, 'utf8')
    envContent = envContent.replace(/VITE_SKIP_AUTH=true/, 'VITE_SKIP_AUTH=false')
    writeFileSync(frontendEnvPath, envContent)
    console.log('✅ Auth bypass DISABLED - restart your dev server')
  } catch (error) {
    console.log('❌ Could not disable bypass:', error.message)
  }
}