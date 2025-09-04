import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kmepcdsklnnxokoimvzo.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDYyNDgsImV4cCI6MjA3MTEyMjI0OH0.7fa_fy4aWlz0PZvwC90X1r_6UMHzBujnN0fIngva1iI'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debugUser() {
  console.log('🔍 Checking what user is currently logged in...\n')
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (user) {
      console.log('✅ User is authenticated:')
      console.log('  Email:', user.email)
      console.log('  ID:', user.id)
      console.log('  User metadata:', JSON.stringify(user.user_metadata, null, 2))
      console.log('  User type from metadata:', user.user_metadata?.user_type)
      
      if (user.user_metadata?.user_type === 'donor') {
        console.log('\n🔍 This explains the redirect!')
        console.log('   User has user_type="donor" so DonorAuthContext sets donor state')
        console.log('   DonorAuth component sees donor exists and redirects to dashboard')
        console.log('\n✅ SOLUTION: Sign this user out first')
      } else {
        console.log('\n⚠️  User exists but not a donor type')
        console.log('   This should not cause redirect, investigating further...')
      }
    } else {
      console.log('❌ No user authenticated')
      console.log('   This should not cause redirect')
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

debugUser()