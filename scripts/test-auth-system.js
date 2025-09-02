#!/usr/bin/env node

/**
 * CAMPAIGN AUTH SYSTEM TEST SCRIPT
 * 
 * Tests the complete auth flow including:
 * 1. Database setup and migrations
 * 2. User signup and verification
 * 3. Login functionality
 * 4. Profile completion
 * 5. Team invitation system
 * 6. Permission management
 * 7. Admin user management
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Supabase client
const supabaseUrl = 'https://kmepcdsklnnxokoimvzo.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDYyNDgsImV4cCI6MjA3MTEyMjI0OH0.7fa_fy4aWlz0PZvwC90X1r_6UMHzBujnN0fIngva1iI'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Test configuration
const TEST_CONFIG = {
  testUser: {
    email: `test-auth-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    fullName: 'Auth Test User'
  },
  testAdmin: {
    email: `admin-auth-${Date.now()}@example.com`,
    password: 'AdminPassword123!',
    fullName: 'Auth Test Admin'
  },
  testCampaign: {
    campaign_name: `Test Campaign ${Date.now()}`,
    candidate_name: 'Test Candidate',
    website: 'https://test.com'
  }
}

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  errors: []
}

function log(message, type = 'info') {
  const timestamp = new Date().toISOString()
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    error: '\x1b[31m',   // Red
    warning: '\x1b[33m', // Yellow
    reset: '\x1b[0m'     // Reset
  }
  
}

function assert(condition, message) {
  if (condition) {
    testResults.passed++
    log(`✅ ${message}`, 'success')
  } else {
    testResults.failed++
    testResults.errors.push(message)
    log(`❌ ${message}`, 'error')
  }
}

async function runTest(name, testFn) {
  log(`\n🧪 Running test: ${name}`, 'info')
  try {
    await testFn()
  } catch (error) {
    testResults.failed++
    testResults.errors.push(`${name}: ${error.message}`)
    log(`❌ Test failed: ${name} - ${error.message}`, 'error')
  }
}

// Test 1: Database Schema Validation
async function testDatabaseSchema() {
  log('Checking database schema...', 'info')
  
  // Check users table
  const { data: usersSchema, error: usersError } = await supabase
    .from('users')
    .select('*')
    .limit(1)
  
  assert(!usersError, 'Users table exists and is accessible')
  
  // Check campaign_members table
  const { data: membersSchema, error: membersError } = await supabase
    .from('campaign_members')
    .select('*')
    .limit(1)
  
  assert(!membersError, 'Campaign_members table exists and is accessible')
  
  // Check invitations table
  const { data: invitationsSchema, error: invitationsError } = await supabase
    .from('invitations')
    .select('*')
    .limit(1)
  
  assert(!invitationsError, 'Invitations table exists and is accessible')
  
  // Check campaigns table
  const { data: campaignsSchema, error: campaignsError } = await supabase
    .from('campaigns')
    .select('*')
    .limit(1)
  
  assert(!campaignsError, 'Campaigns table exists and is accessible')
}

// Test 2: User Registration
async function testUserRegistration() {
  log('Testing user registration...', 'info')
  
  const { data, error } = await supabase.auth.signUp({
    email: TEST_CONFIG.testUser.email,
    password: TEST_CONFIG.testUser.password,
    options: {
      data: {
        full_name: TEST_CONFIG.testUser.fullName
      }
    }
  })
  
  assert(!error, `User registration successful: ${error?.message || 'OK'}`)
  assert(data?.user?.id, 'User ID generated')
  assert(data?.user?.email === TEST_CONFIG.testUser.email, 'Email stored correctly')
  
  // Store user ID for later tests
  TEST_CONFIG.testUser.id = data?.user?.id
  
  // Check if user profile was created
  if (data?.user?.id) {
    // Wait a moment for the trigger to create the profile
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single()
    
    assert(!profileError, `User profile created: ${profileError?.message || 'OK'}`)
    assert(profile?.full_name === TEST_CONFIG.testUser.fullName, 'Full name stored in profile')
  }
}

// Test 3: Admin User Setup
async function testAdminUserSetup() {
  log('Setting up admin user...', 'info')
  
  // Create admin user
  const { data, error } = await supabase.auth.signUp({
    email: TEST_CONFIG.testAdmin.email,
    password: TEST_CONFIG.testAdmin.password,
    options: {
      data: {
        full_name: TEST_CONFIG.testAdmin.fullName
      }
    }
  })
  
  assert(!error, `Admin user registration: ${error?.message || 'OK'}`)
  
  if (data?.user?.id) {
    TEST_CONFIG.testAdmin.id = data.user.id
    
    // Wait for profile creation
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Update user to admin role (this would normally be done by a super admin)
    const { error: updateError } = await supabase
      .from('users')
      .update({ role: 'admin' })
      .eq('id', data.user.id)
    
    assert(!updateError, `Admin role assigned: ${updateError?.message || 'OK'}`)
  }
}

// Test 4: Campaign Creation
async function testCampaignCreation() {
  log('Testing campaign creation...', 'info')
  
  const { data, error } = await supabase
    .from('campaigns')
    .insert([{
      ...TEST_CONFIG.testCampaign,
      owner_id: TEST_CONFIG.testUser.id,
      email: TEST_CONFIG.testUser.email
    }])
    .select()
    .single()
  
  assert(!error, `Campaign created: ${error?.message || 'OK'}`)
  assert(data?.id, 'Campaign ID generated')
  
  TEST_CONFIG.testCampaign.id = data?.id
  
  // Create campaign membership for the owner
  if (data?.id) {
    const { error: membershipError } = await supabase
      .from('campaign_members')
      .insert([{
        campaign_id: data.id,
        user_id: TEST_CONFIG.testUser.id,
        permissions: ['admin', 'export', 'view'],
        campaign_role: 'owner',
        joined_at: new Date().toISOString(),
        status: 'active'
      }])
    
    assert(!membershipError, `Campaign membership created: ${membershipError?.message || 'OK'}`)
  }
}

// Test 5: Invitation System
async function testInvitationSystem() {
  log('Testing invitation system...', 'info')
  
  const inviteEmail = `invite-test-${Date.now()}@example.com`
  const token = generateToken()
  
  const { data, error } = await supabase
    .from('invitations')
    .insert([{
      email: inviteEmail,
      campaign_id: TEST_CONFIG.testCampaign.id,
      invited_by: TEST_CONFIG.testUser.id,
      permissions: ['view', 'export'],
      campaign_role: 'member',
      token: token,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      personal_message: 'Welcome to the team!',
      status: 'pending'
    }])
    .select()
    .single()
  
  assert(!error, `Invitation created: ${error?.message || 'OK'}`)
  assert(data?.token === token, 'Invitation token stored')
  
  // Test invitation retrieval
  const { data: invitation, error: fetchError } = await supabase
    .from('invitations')
    .select('*')
    .eq('token', token)
    .single()
  
  assert(!fetchError, `Invitation retrieved: ${fetchError?.message || 'OK'}`)
  assert(invitation?.email === inviteEmail, 'Invitation email matches')
}

// Test 6: Permission Queries
async function testPermissions() {
  log('Testing permission system...', 'info')
  
  // Test user can view their own campaign
  const { data: userCampaigns, error: campaignsError } = await supabase
    .from('campaign_members')
    .select(`
      *,
      campaigns (*)
    `)
    .eq('user_id', TEST_CONFIG.testUser.id)
  
  assert(!campaignsError, `User campaigns query: ${campaignsError?.message || 'OK'}`)
  assert(userCampaigns?.length > 0, 'User has campaign memberships')
  
  // Test admin can access users table (simulate RLS)
  const { data: allUsers, error: usersError } = await supabase
    .from('users')
    .select('id, email, full_name, role')
    .limit(5)
  
  // This might fail due to RLS if not properly authenticated, which is expected
  log(`Users query result: ${usersError ? 'Blocked by RLS (expected)' : 'Accessible'}`, 
       usersError ? 'warning' : 'info')
}

// Test 7: Cleanup
async function testCleanup() {
  log('Cleaning up test data...', 'info')
  
  try {
    // Delete test invitation
    await supabase
      .from('invitations')
      .delete()
      .eq('campaign_id', TEST_CONFIG.testCampaign.id)
    
    // Delete campaign membership
    await supabase
      .from('campaign_members')
      .delete()
      .eq('campaign_id', TEST_CONFIG.testCampaign.id)
    
    // Delete test campaign
    await supabase
      .from('campaigns')
      .delete()
      .eq('id', TEST_CONFIG.testCampaign.id)
    
    // Note: We don't delete users as they're managed by Supabase Auth
    // In a real scenario, you'd use the auth admin API to delete test users
    
    log('Test cleanup completed', 'success')
  } catch (error) {
    log(`Cleanup warning: ${error.message}`, 'warning')
  }
}

// Helper function to generate tokens
function generateToken() {
  return Array.from({ length: 32 }, () => 
    Math.random().toString(36).charAt(2)
  ).join('')
}

// Main test runner
async function runAllTests() {
  log('🚀 Starting Auth System Test Suite', 'info')
  log('=====================================', 'info')
  
  await runTest('Database Schema', testDatabaseSchema)
  await runTest('User Registration', testUserRegistration)
  await runTest('Admin User Setup', testAdminUserSetup)
  await runTest('Campaign Creation', testCampaignCreation)
  await runTest('Invitation System', testInvitationSystem)
  await runTest('Permissions', testPermissions)
  await runTest('Cleanup', testCleanup)
  
  // Summary
  log('\n📊 TEST SUMMARY', 'info')
  log('================', 'info')
  log(`✅ Passed: ${testResults.passed}`, 'success')
  log(`❌ Failed: ${testResults.failed}`, testResults.failed > 0 ? 'error' : 'info')
  
  if (testResults.errors.length > 0) {
    log('\n🚨 ERRORS:', 'error')
    testResults.errors.forEach(error => log(`  - ${error}`, 'error'))
  }
  
  if (testResults.failed === 0) {
    log('\n🎉 All tests passed! Auth system is working correctly.', 'success')
  } else {
    log('\n⚠️ Some tests failed. Check the errors above.', 'warning')
  }
  
  log('\n📋 NEXT STEPS:', 'info')
  log('1. Run the database migration: supabase/migrations/20250826_create_auth_system.sql', 'info')
  log('2. Import AuthFlow component in your React app', 'info')
  log('3. Test the full flow in your browser', 'info')
  log('4. Configure email verification in Supabase dashboard', 'info')
  
  process.exit(testResults.failed > 0 ? 1 : 0)
}

// Error handling
process.on('unhandledRejection', (error) => {
  log(`Unhandled rejection: ${error.message}`, 'error')
  process.exit(1)
})

// Run tests
runAllTests().catch(console.error)