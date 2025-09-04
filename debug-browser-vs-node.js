import { createClient } from '@supabase/supabase-js'

// Compare Node.js vs Browser Supabase behavior
const supabaseUrl = 'https://kmepcdsklnnxokoimvzo.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDYyNDgsImV4cCI6MjA3MTEyMjI0NH0.7fa_fy4aWlz0PZvwC90X1r_6UMHzBujnN0fIngva1iI'

console.log('🔍 NODE.JS SUPABASE TEST (Working Environment)')
console.log('=' * 60)

async function testNodeSupabase() {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    console.log('1. Testing signInWithPassword in Node.js...')
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'test@dkdev.io',
      password: 'TestDonor123!'
    })
    
    if (error) {
      console.log('❌ Node.js login failed:', error.message)
    } else {
      console.log('✅ Node.js login SUCCESS:', data.user?.email)
      await supabase.auth.signOut()
    }
    
    console.log('\n2. Key differences between Node.js and Browser:')
    console.log('   - Node.js: Direct HTTP requests, no CORS')
    console.log('   - Browser: CORS restrictions, different networking stack')
    console.log('   - Browser: localStorage/sessionStorage for token persistence')
    console.log('   - Browser: Different User-Agent, security policies')
    
    console.log('\n3. Potential browser-specific issues:')
    console.log('   - CORS configuration in Supabase project')
    console.log('   - Browser blocking third-party cookies') 
    console.log('   - Ad blockers interfering with requests')
    console.log('   - Network proxy/firewall issues')
    console.log('   - Supabase client initialization differences')
    console.log('   - Environment variable loading in Vite')
    
    console.log('\n4. Most likely causes of browser 400 errors:')
    console.log('   A) Supabase project CORS settings changed')
    console.log('   B) Browser security policies blocking requests')  
    console.log('   C) Supabase client library version issues')
    console.log('   D) Environment variables not loaded correctly in browser')
    
  } catch (error) {
    console.error('Node.js test failed:', error)
  }
}

testNodeSupabase()