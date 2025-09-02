#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables from frontend .env
config({ path: './frontend/.env' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Required: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

console.log('🧪 Testing Supabase Authentication Email Configuration')
console.log('==================================================')
console.log(`📡 Supabase URL: ${supabaseUrl}`)
console.log(`🔑 Using anon key: ${supabaseAnonKey.substring(0, 20)}...`)
console.log('')

async function testEmailConfiguration() {
  try {
    // Test signup with a test email to see if emails are sent
    const testEmail = `test.${Date.now()}@gmail.com`
    const testPassword = 'TestPassword123!'
    
    console.log(`📧 Testing signup with: ${testEmail}`)
    console.log(`📍 Redirect URL will be: ${process.env.VITE_APP_URL || window?.location?.origin || 'http://localhost:3000'}/auth?verified=true`)
    
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Test User'
        },
        emailRedirectTo: `${process.env.VITE_APP_URL || 'http://localhost:3000'}/auth?verified=true`
      }
    })
    
    if (error) {
      console.error('❌ Signup failed:', error.message)
      
      // Check for specific email configuration issues
      if (error.message.includes('rate limit')) {
        console.log('⚠️  Rate limited - this is normal for testing')
      } else if (error.message.includes('email')) {
        console.log('⚠️  Email-related error detected')
      }
    } else {
      console.log('✅ Signup API call successful')
      console.log(`👤 User created: ${data.user?.id}`)
      console.log(`📧 Email confirmed: ${data.user?.email_confirmed_at ? 'YES' : 'NO (verification email should be sent)'}`)
      
      if (!data.user?.email_confirmed_at) {
        console.log('')
        console.log('📧 VERIFICATION EMAIL STATUS:')
        console.log('   Expected: Verification email should be sent to user')
        console.log('   Check: User\'s email inbox (including spam folder)')
        console.log('   If no email received, check Supabase project email settings:')
        console.log('   1. Go to Supabase Dashboard > Settings > Authentication')
        console.log('   2. Check "Enable email confirmations" is ON')
        console.log('   3. Check SMTP settings or email provider configuration')
        console.log('   4. Verify redirect URLs are configured correctly')
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Check auth settings
async function checkAuthSettings() {
  try {
    console.log('🔧 Checking authentication settings...')
    
    // This will help identify if auth is configured correctly
    const { data: { session } } = await supabase.auth.getSession()
    console.log(`🔑 Current session: ${session ? 'Active' : 'None'}`)
    
  } catch (error) {
    console.error('❌ Could not check auth settings:', error.message)
  }
}

// Run tests
await checkAuthSettings()
await testEmailConfiguration()

console.log('')
console.log('🎯 NEXT STEPS:')
console.log('1. Check user\'s email (including spam) for verification link')
console.log('2. If no email received, check Supabase project email configuration')
console.log('3. Verify SMTP settings in Supabase Dashboard')
console.log('4. Confirm "Enable email confirmations" is enabled')