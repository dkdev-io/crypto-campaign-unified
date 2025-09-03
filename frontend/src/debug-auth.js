// Debug authentication in the actual frontend environment
import { supabase } from './lib/supabase.js'

console.log('🔍 DEBUG - Checking Supabase client in frontend')
console.log('URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('Key available:', !!import.meta.env.VITE_SUPABASE_ANON_KEY)
console.log('Key length:', import.meta.env.VITE_SUPABASE_ANON_KEY?.length)

// Test the exact same credentials in frontend environment
async function testFrontendAuth() {
  console.log('🔍 Testing auth in frontend environment...')
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'test@dkdev.io',
      password: 'TestDonor123!'
    })

    if (error) {
      console.error('❌ Frontend auth failed:', error)
      return { success: false, error }
    }

    console.log('✅ Frontend auth successful!')
    console.log('User:', data.user)
    return { success: true, data }
  } catch (err) {
    console.error('❌ Frontend auth exception:', err)
    return { success: false, error: err }
  }
}

// Expose to window for browser testing
window.testFrontendAuth = testFrontendAuth
window.supabaseDebug = { supabase }

export { testFrontendAuth }