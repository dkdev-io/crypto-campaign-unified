#!/usr/bin/env node

// Test script to debug authentication issues
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kmepcdsklnnxokoimvzo.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDYyNDgsImV4cCI6MjA3MTEyMjI0OH0.7fa_fy4aWlz0PZvwC90X1r_6UMHzBujnN0fIngva1iI'

console.log('🔍 Testing Supabase Authentication')
console.log(`URL: ${supabaseUrl}`)
console.log(`Key: ${supabaseAnonKey.substring(0, 20)}...`)

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testAuth() {
  console.log('\n1. Testing connection...')
  try {
    const { data, error } = await supabase
      .from('campaigns')
      .select('id')
      .limit(1)
    
    if (error) {
      console.error('❌ Connection error:', error)
    } else {
      console.log('✅ Connection successful')
    }
  } catch (err) {
    console.error('❌ Connection failed:', err.message)
  }

  console.log('\n2. Testing signup with test user...')
  try {
    const testEmail = `test-${Date.now()}@example.com`
    const testPassword = 'testpassword123'
    
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Test User'
        }
      }
    })

    if (error) {
      console.error('❌ Signup error:', error.message)
    } else {
      console.log('✅ Signup successful')
      console.log('User ID:', data.user?.id)
      console.log('Email confirmed:', data.user?.email_confirmed_at)
    }
  } catch (err) {
    console.error('❌ Signup failed:', err.message)
  }

  console.log('\n3. Testing signin with known credentials...')
  try {
    // Try to sign in with a test account
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'testpassword123'
    })

    if (error) {
      console.error('❌ Signin error:', error.message)
    } else {
      console.log('✅ Signin successful')
      console.log('User ID:', data.user?.id)
      console.log('Session:', !!data.session)
    }
  } catch (err) {
    console.error('❌ Signin failed:', err.message)
  }

  console.log('\n4. Checking current session...')
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('❌ Session error:', error.message)
    } else if (session) {
      console.log('✅ Active session found')
      console.log('User:', session.user?.email)
    } else {
      console.log('⚠️ No active session')
    }
  } catch (err) {
    console.error('❌ Session check failed:', err.message)
  }
}

testAuth().then(() => {
  console.log('\n🏁 Auth test completed')
  process.exit(0)
}).catch(err => {
  console.error('❌ Test failed:', err)
  process.exit(1)
})