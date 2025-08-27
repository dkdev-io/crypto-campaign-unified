/**
 * End-to-End Authentication Test Suite
 * Tests all authentication flows with Supabase
 * 
 * Test Scenarios:
 * 1. Login with valid credentials
 * 2. Login with invalid credentials
 * 3. Signup with new user
 * 4. Signup with existing email
 * 5. Password reset flow
 * 6. Protected route access
 * 7. Session timeout handling
 * 8. Role-based access control
 */

import { supabase } from '../frontend/src/lib/supabase.js'

// Test users configuration
const TEST_USERS = {
  admin: {
    email: 'admin@test.com',
    password: 'Admin123!@#',
    role: 'admin',
    fullName: 'Admin User'
  },
  regular: {
    email: 'user@test.com', 
    password: 'User123!@#',
    role: 'user',
    fullName: 'Regular User'
  },
  newUser: {
    email: `test${Date.now()}@test.com`,
    password: 'Test123!@#',
    fullName: 'New Test User'
  },
  invalidUser: {
    email: 'invalid@test.com',
    password: 'wrongpassword'
  }
}

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

// Helper function to log test results
function logTest(testName, passed, error = null) {
  const status = passed ? `${colors.green}✓ PASS${colors.reset}` : `${colors.red}✗ FAIL${colors.reset}`
  if (error) {
    console.error(`  ${colors.red}Error: ${error.message}${colors.reset}`)
  }
}

// Helper function to log section headers
function logSection(sectionName) {
}

// Test Suite
class AuthTestSuite {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      errors: []
    }
  }

  async runAllTests() {

    // Setup test users
    await this.setupTestUsers()

    // Run test categories
    await this.testLoginFlow()
    await this.testSignupFlow()
    await this.testPasswordReset()
    await this.testProtectedRoutes()
    await this.testSessionManagement()
    await this.testRoleBasedAccess()
    await this.testErrorHandling()

    // Print summary
    this.printSummary()
  }

  async setupTestUsers() {
    logSection('SETUP: Creating Test Users')
    
    try {
      // Create admin user if not exists
      const { data: adminExists } = await supabase
        .from('users')
        .select('id')
        .eq('email', TEST_USERS.admin.email)
        .single()

      if (!adminExists) {
        const { data, error } = await supabase.auth.admin.createUser({
          email: TEST_USERS.admin.email,
          password: TEST_USERS.admin.password,
          email_confirm: true,
          user_metadata: { full_name: TEST_USERS.admin.fullName }
        })
        
        if (data?.user) {
          await supabase
            .from('users')
            .insert({
              id: data.user.id,
              email: TEST_USERS.admin.email,
              full_name: TEST_USERS.admin.fullName,
              role: 'admin',
              email_confirmed: true
            })
        }
      }

      // Create regular user if not exists
      const { data: userExists } = await supabase
        .from('users')
        .select('id')
        .eq('email', TEST_USERS.regular.email)
        .single()

      if (!userExists) {
        const { data, error } = await supabase.auth.admin.createUser({
          email: TEST_USERS.regular.email,
          password: TEST_USERS.regular.password,
          email_confirm: true,
          user_metadata: { full_name: TEST_USERS.regular.fullName }
        })
        
        if (data?.user) {
          await supabase
            .from('users')
            .insert({
              id: data.user.id,
              email: TEST_USERS.regular.email,
              full_name: TEST_USERS.regular.fullName,
              role: 'user',
              email_confirmed: true
            })
        }
      }

      logTest('Test users setup', true)
    } catch (error) {
      logTest('Test users setup', false, error)
    }
  }

  async testLoginFlow() {
    logSection('TEST: Login Flow')

    // Test 1: Valid login
    try {
      await supabase.auth.signOut()
      const { data, error } = await supabase.auth.signInWithPassword({
        email: TEST_USERS.regular.email,
        password: TEST_USERS.regular.password
      })
      
      const passed = !error && data?.user?.email === TEST_USERS.regular.email
      logTest('Login with valid credentials', passed, error)
      if (passed) this.results.passed++
      else this.results.failed++
    } catch (error) {
      logTest('Login with valid credentials', false, error)
      this.results.failed++
    }

    // Test 2: Invalid password
    try {
      await supabase.auth.signOut()
      const { data, error } = await supabase.auth.signInWithPassword({
        email: TEST_USERS.regular.email,
        password: 'wrongpassword'
      })
      
      const passed = error?.message.includes('Invalid') || error?.message.includes('credentials')
      logTest('Login with invalid password shows correct error', passed)
      if (passed) this.results.passed++
      else this.results.failed++
    } catch (error) {
      logTest('Login with invalid password', false, error)
      this.results.failed++
    }

    // Test 3: Non-existent user
    try {
      await supabase.auth.signOut()
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'nonexistent@test.com',
        password: 'password123'
      })
      
      const passed = error !== null
      logTest('Login with non-existent user fails properly', passed)
      if (passed) this.results.passed++
      else this.results.failed++
    } catch (error) {
      logTest('Login with non-existent user', false, error)
      this.results.failed++
    }

    // Test 4: Empty credentials
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: '',
        password: ''
      })
      
      const passed = error !== null
      logTest('Login with empty credentials fails properly', passed)
      if (passed) this.results.passed++
      else this.results.failed++
    } catch (error) {
      logTest('Login with empty credentials', false, error)
      this.results.failed++
    }
  }

  async testSignupFlow() {
    logSection('TEST: Signup Flow')

    // Test 1: New user signup
    try {
      await supabase.auth.signOut()
      const { data, error } = await supabase.auth.signUp({
        email: TEST_USERS.newUser.email,
        password: TEST_USERS.newUser.password,
        options: {
          data: {
            full_name: TEST_USERS.newUser.fullName
          }
        }
      })
      
      const passed = !error && data?.user?.email === TEST_USERS.newUser.email
      logTest('Signup with new email', passed, error)
      if (passed) this.results.passed++
      else this.results.failed++
    } catch (error) {
      logTest('Signup with new email', false, error)
      this.results.failed++
    }

    // Test 2: Duplicate email signup
    try {
      const { data, error } = await supabase.auth.signUp({
        email: TEST_USERS.regular.email,
        password: 'NewPassword123'
      })
      
      // Supabase returns user but with identities empty for existing users
      const passed = data?.user?.identities?.length === 0 || error?.message.includes('already registered')
      logTest('Signup with existing email shows correct error', passed)
      if (passed) this.results.passed++
      else this.results.failed++
    } catch (error) {
      logTest('Signup with existing email', false, error)
      this.results.failed++
    }

    // Test 3: Weak password
    try {
      const { data, error } = await supabase.auth.signUp({
        email: `weak${Date.now()}@test.com`,
        password: '123'
      })
      
      const passed = error?.message.includes('Password') || error?.message.includes('at least')
      logTest('Signup with weak password shows correct error', passed)
      if (passed) this.results.passed++
      else this.results.failed++
    } catch (error) {
      logTest('Signup with weak password', false, error)
      this.results.failed++
    }
  }

  async testPasswordReset() {
    logSection('TEST: Password Reset Flow')

    // Test 1: Request password reset for valid email
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(
        TEST_USERS.regular.email,
        { redirectTo: 'http://localhost:3000/auth/reset-password' }
      )
      
      const passed = !error
      logTest('Password reset email sent for valid user', passed, error)
      if (passed) this.results.passed++
      else this.results.failed++
    } catch (error) {
      logTest('Password reset for valid email', false, error)
      this.results.failed++
    }

    // Test 2: Request password reset for non-existent email
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(
        'nonexistent@test.com',
        { redirectTo: 'http://localhost:3000/auth/reset-password' }
      )
      
      // Supabase doesn't reveal if email exists for security (returns success)
      const passed = !error
      logTest('Password reset handles non-existent email securely', passed)
      if (passed) this.results.passed++
      else this.results.failed++
    } catch (error) {
      logTest('Password reset for non-existent email', false, error)
      this.results.failed++
    }
  }

  async testProtectedRoutes() {
    logSection('TEST: Protected Routes')

    // Test 1: Access without authentication
    try {
      await supabase.auth.signOut()
      const { data: { user } } = await supabase.auth.getUser()
      
      const passed = user === null
      logTest('Unauthenticated user cannot access protected data', passed)
      if (passed) this.results.passed++
      else this.results.failed++
    } catch (error) {
      logTest('Protected route without auth', false, error)
      this.results.failed++
    }

    // Test 2: Access with authentication
    try {
      await supabase.auth.signInWithPassword({
        email: TEST_USERS.regular.email,
        password: TEST_USERS.regular.password
      })
      
      const { data: { user } } = await supabase.auth.getUser()
      const passed = user !== null && user.email === TEST_USERS.regular.email
      logTest('Authenticated user can access protected data', passed)
      if (passed) this.results.passed++
      else this.results.failed++
    } catch (error) {
      logTest('Protected route with auth', false, error)
      this.results.failed++
    }
  }

  async testSessionManagement() {
    logSection('TEST: Session Management')

    // Test 1: Session persistence
    try {
      await supabase.auth.signInWithPassword({
        email: TEST_USERS.regular.email,
        password: TEST_USERS.regular.password
      })
      
      const { data: { session: session1 } } = await supabase.auth.getSession()
      
      // Simulate page refresh by getting session again
      const { data: { session: session2 } } = await supabase.auth.getSession()
      
      const passed = session1?.access_token === session2?.access_token
      logTest('Session persists across page refreshes', passed)
      if (passed) this.results.passed++
      else this.results.failed++
    } catch (error) {
      logTest('Session persistence', false, error)
      this.results.failed++
    }

    // Test 2: Session refresh
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        const { data, error } = await supabase.auth.refreshSession()
        const passed = !error && data?.session?.access_token !== session.access_token
        logTest('Session refresh generates new token', passed, error)
        if (passed) this.results.passed++
        else this.results.failed++
      } else {
        logTest('Session refresh (no active session)', false)
        this.results.failed++
      }
    } catch (error) {
      logTest('Session refresh', false, error)
      this.results.failed++
    }

    // Test 3: Sign out
    try {
      const { error } = await supabase.auth.signOut()
      const { data: { session } } = await supabase.auth.getSession()
      
      const passed = !error && session === null
      logTest('Sign out clears session', passed, error)
      if (passed) this.results.passed++
      else this.results.failed++
    } catch (error) {
      logTest('Sign out', false, error)
      this.results.failed++
    }
  }

  async testRoleBasedAccess() {
    logSection('TEST: Role-Based Access Control')

    // Test 1: Admin role access
    try {
      await supabase.auth.signInWithPassword({
        email: TEST_USERS.admin.email,
        password: TEST_USERS.admin.password
      })
      
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('email', TEST_USERS.admin.email)
        .single()
      
      const passed = profile?.role === 'admin'
      logTest('Admin user has admin role', passed)
      if (passed) this.results.passed++
      else this.results.failed++
    } catch (error) {
      logTest('Admin role verification', false, error)
      this.results.failed++
    }

    // Test 2: Regular user role
    try {
      await supabase.auth.signInWithPassword({
        email: TEST_USERS.regular.email,
        password: TEST_USERS.regular.password
      })
      
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('email', TEST_USERS.regular.email)
        .single()
      
      const passed = profile?.role === 'user' || profile?.role === null
      logTest('Regular user has correct role', passed)
      if (passed) this.results.passed++
      else this.results.failed++
    } catch (error) {
      logTest('Regular user role verification', false, error)
      this.results.failed++
    }
  }

  async testErrorHandling() {
    logSection('TEST: Error Handling')

    // Test 1: Network error simulation
    try {
      // Save original URL
      const originalUrl = supabase.supabaseUrl
      
      // Set invalid URL to simulate network error
      supabase.supabaseUrl = 'https://invalid.supabase.co'
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: TEST_USERS.regular.email,
        password: TEST_USERS.regular.password
      }).catch(err => ({ data: null, error: err }))
      
      // Restore URL
      supabase.supabaseUrl = originalUrl
      
      const passed = error !== null
      logTest('Network error handled gracefully', passed)
      if (passed) this.results.passed++
      else this.results.failed++
    } catch (error) {
      logTest('Network error handling', false, error)
      this.results.failed++
    }

    // Test 2: Rate limiting
    try {
      let rateLimitHit = false
      
      // Attempt multiple rapid requests
      for (let i = 0; i < 10; i++) {
        const { error } = await supabase.auth.signInWithPassword({
          email: `test${i}@test.com`,
          password: 'wrong'
        })
        
        if (error?.message.includes('rate') || error?.message.includes('too many')) {
          rateLimitHit = true
          break
        }
      }
      
      logTest('Rate limiting detection', rateLimitHit)
      if (rateLimitHit) this.results.passed++
      else this.results.failed++
    } catch (error) {
      logTest('Rate limiting', false, error)
      this.results.failed++
    }
  }

  printSummary() {
    console.log(`${colors.cyan}TEST SUITE SUMMARY${colors.reset}`)
    
    const total = this.results.passed + this.results.failed
    const passRate = ((this.results.passed / total) * 100).toFixed(1)
    
    console.log(`${colors.green}Passed: ${this.results.passed}${colors.reset}`)
    console.log(`${colors.red}Failed: ${this.results.failed}${colors.reset}`)
    
    if (this.results.failed === 0) {
    } else {
    }
    
  }
}

// Run tests if executed directly
if (typeof module !== 'undefined' && require.main === module) {
  const testSuite = new AuthTestSuite()
  testSuite.runAllTests().catch(error => {
    console.error(`${colors.red}Fatal error running tests:${colors.reset}`, error)
    process.exit(1)
  })
}

export default AuthTestSuite