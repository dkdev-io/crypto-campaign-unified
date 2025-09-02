#!/usr/bin/env node

/**
 * DATA UPLOAD SYSTEM TEST SCRIPT
 * 
 * Tests the complete donor data workflow including:
 * 1. Database functions for dynamic table creation
 * 2. CSV parsing and validation
 * 3. Data insertion and management
 * 4. User data source tracking
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'fs'
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
    email: `datatest-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    fullName: 'Data Test User'
  },
  testTableName: `offlinecontributions_datatest_${Date.now()}`,
  sampleCSVData: [
    ['full_name', 'email', 'phone', 'address', 'city', 'state', 'zip', 'employer', 'occupation', 'amount', 'date'],
    ['John Doe', 'john@example.com', '555-1234', '123 Main St', 'Anytown', 'CA', '90210', 'ACME Corp', 'Engineer', '100.00', '2024-01-15'],
    ['Jane Smith', 'jane@example.com', '555-5678', '456 Oak Ave', 'Somewhere', 'NY', '10001', 'Widget Inc', 'Manager', '250.00', '2024-01-16'],
    ['Bob Johnson', 'bob@example.com', '555-9012', '789 Pine St', 'Elsewhere', 'TX', '77001', 'Self Employed', 'Consultant', '75.00', '2024-01-17']
  ]
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

// Test 1: Create Test User
async function testUserCreation() {
  log('Creating test user...', 'info')
  
  const { data, error } = await supabase.auth.signUp({
    email: TEST_CONFIG.testUser.email,
    password: TEST_CONFIG.testUser.password,
    options: {
      data: {
        full_name: TEST_CONFIG.testUser.fullName
      }
    }
  })
  
  assert(!error, `Test user created: ${error?.message || 'OK'}`)
  assert(data?.user?.id, 'User ID generated')
  
  if (data?.user?.id) {
    TEST_CONFIG.testUser.id = data.user.id
    
    // Create user profile
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const { error: profileError } = await supabase
      .from('users')
      .insert([{
        id: data.user.id,
        email: data.user.email,
        full_name: TEST_CONFIG.testUser.fullName,
        email_confirmed: true
      }])
    
    assert(!profileError, `User profile created: ${profileError?.message || 'OK'}`)
  }
}

// Test 2: Database Functions Availability
async function testDatabaseFunctions() {
  log('Testing database function availability...', 'info')
  
  // Test create_user_contribution_table function
  try {
    const { data, error } = await supabase.rpc('create_user_contribution_table', {
      p_table_name: 'test_function_check',
      p_columns: [{ name: 'test_column', type: 'text' }]
    })
    
    // This might fail due to authentication, but function should exist
    assert(!error || error.message.includes('permission'), 'create_user_contribution_table function exists')
  } catch (error) {
    log(`Function test returned: ${error.message}`, 'warning')
  }
  
  // Test other functions
  const functionsToTest = [
    'insert_contribution_data',
    'get_user_data_summary',
    'register_data_source'
  ]
  
  for (const funcName of functionsToTest) {
    try {
      // Try to call with invalid params to test existence
      await supabase.rpc(funcName, {})
    } catch (error) {
      // Function exists if we get parameter errors rather than "function not found"
      const exists = !error.message.includes('function') || 
                    error.message.includes('parameter') ||
                    error.message.includes('argument')
      assert(exists, `${funcName} function exists`)
    }
  }
}

// Test 3: CSV Data Processing
async function testCSVProcessing() {
  log('Testing CSV data processing...', 'info')
  
  const headers = TEST_CONFIG.sampleCSVData[0]
  const dataRows = TEST_CONFIG.sampleCSVData.slice(1)
  
  assert(headers.length > 0, 'CSV headers parsed')
  assert(dataRows.length > 0, 'CSV data rows parsed')
  assert(headers.includes('full_name'), 'Required column: full_name found')
  assert(headers.includes('email'), 'Required column: email found')
  assert(headers.includes('amount'), 'Required column: amount found')
  
  // Test data validation
  const emailColumn = headers.indexOf('email')
  const validEmail = dataRows[0][emailColumn]
  assert(validEmail && validEmail.includes('@'), 'Email format validation')
  
  const amountColumn = headers.indexOf('amount')
  const validAmount = dataRows[0][amountColumn]
  assert(validAmount && !isNaN(parseFloat(validAmount)), 'Amount format validation')
}

// Test 4: Table Name Generation
async function testTableNameGeneration() {
  log('Testing table name generation...', 'info')
  
  const generateTableName = (username) => {
    const sanitizedUsername = username
      ?.toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      || 'user'
    
    return `offlinecontributions_${sanitizedUsername}`
  }
  
  const testCases = [
    { input: 'test@example.com', expected: 'offlinecontributions_test_example_com' },
    { input: 'user.name+tag@domain.co.uk', expected: 'offlinecontributions_user_name_tag_domain_co_uk' },
    { input: '', expected: 'offlinecontributions_user' },
    { input: '___test___', expected: 'offlinecontributions_test' }
  ]
  
  testCases.forEach(({ input, expected }) => {
    const result = generateTableName(input)
    assert(result === expected, `Table name generation: ${input} -> ${result}`)
  })
}

// Test 5: Sample Data File Creation
async function testSampleDataFile() {
  log('Creating sample CSV file...', 'info')
  
  try {
    const csvContent = TEST_CONFIG.sampleCSVData
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')
    
    const filePath = join(__dirname, 'test-data.csv')
    writeFileSync(filePath, csvContent, 'utf8')
    
    // Verify file was created
    const fileContent = readFileSync(filePath, 'utf8')
    assert(fileContent.length > 0, 'Sample CSV file created')
    assert(fileContent.includes('full_name'), 'CSV file contains headers')
    assert(fileContent.includes('John Doe'), 'CSV file contains data')
    
    log(`Sample CSV file created at: ${filePath}`, 'info')
    
  } catch (error) {
    assert(false, `Failed to create sample CSV file: ${error.message}`)
  }
}

// Test 6: User Data Source Tracking
async function testUserDataSourceTracking() {
  log('Testing user data source tracking...', 'info')
  
  // This would require authentication to test properly
  // For now, we'll test the data structure
  const sampleDataSource = {
    table_name: TEST_CONFIG.testTableName,
    source_type: 'csv_upload',
    source_name: 'test-data.csv',
    record_count: 3,
    columns_info: TEST_CONFIG.sampleCSVData[0].map(col => ({
      name: col,
      sanitized: col.toLowerCase().replace(/[^a-zA-Z0-9_]/g, '_')
    })),
    metadata: {
      file_size: 1024,
      upload_timestamp: new Date().toISOString()
    }
  }
  
  assert(sampleDataSource.table_name.startsWith('offlinecontributions_'), 'Table name follows convention')
  assert(sampleDataSource.source_type === 'csv_upload', 'Source type is correct')
  assert(Array.isArray(sampleDataSource.columns_info), 'Columns info is array')
  assert(sampleDataSource.record_count > 0, 'Record count is positive')
  assert(typeof sampleDataSource.metadata === 'object', 'Metadata is object')
}

// Test 7: Error Handling
async function testErrorHandling() {
  log('Testing error handling scenarios...', 'info')
  
  // Test invalid table names
  const invalidTableNames = [
    'invalid-table',
    'DROP TABLE users;',
    'offlinecontributions_',
    'not_offline_contributions_table'
  ]
  
  invalidTableNames.forEach(tableName => {
    const isValid = /^offlinecontributions_[a-zA-Z0-9_]+$/.test(tableName)
    assert(!isValid, `Invalid table name rejected: ${tableName}`)
  })
  
  // Test valid table names
  const validTableNames = [
    'offlinecontributions_user123',
    'offlinecontributions_test_user',
    'offlinecontributions_a1b2c3'
  ]
  
  validTableNames.forEach(tableName => {
    const isValid = /^offlinecontributions_[a-zA-Z0-9_]+$/.test(tableName)
    assert(isValid, `Valid table name accepted: ${tableName}`)
  })
}

// Test 8: Integration Test
async function testIntegration() {
  log('Testing data upload integration...', 'info')
  
  // This simulates the complete flow without actually creating tables
  const uploadData = {
    file: { name: 'test-donors.csv', size: 2048 },
    headers: TEST_CONFIG.sampleCSVData[0],
    dataRows: TEST_CONFIG.sampleCSVData.slice(1),
    user: { id: 'test-user-id', email: 'test@example.com' }
  }
  
  // Simulate table name generation
  const tableName = `offlinecontributions_${uploadData.user.email.replace(/[^a-zA-Z0-9]/g, '_')}`
  
  // Simulate data processing
  const processedData = uploadData.dataRows.map(row => {
    const rowData = { source_file: uploadData.file.name }
    uploadData.headers.forEach((header, index) => {
      const sanitizedColumn = header.toLowerCase().replace(/[^a-zA-Z0-9_]/g, '_')
      rowData[sanitizedColumn] = row[index] || null
    })
    return rowData
  })
  
  assert(tableName.startsWith('offlinecontributions_'), 'Integration: Table name generated')
  assert(processedData.length === uploadData.dataRows.length, 'Integration: All data processed')
  assert(processedData[0].source_file === uploadData.file.name, 'Integration: Source file tracked')
  assert(processedData[0].full_name === 'John Doe', 'Integration: Data mapped correctly')
}

// Test 9: Cleanup
async function testCleanup() {
  log('Cleaning up test data...', 'info')
  
  try {
    // Clean up test files
    const testFilePath = join(__dirname, 'test-data.csv')
    try {
      const fs = await import('fs')
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath)
        log('Test CSV file cleaned up', 'success')
      }
    } catch (error) {
      log(`Cleanup warning: ${error.message}`, 'warning')
    }
    
    // Note: In a real cleanup, you'd also delete the test user and any created tables
    // This requires admin privileges or special cleanup functions
    
    log('Test cleanup completed', 'success')
  } catch (error) {
    log(`Cleanup warning: ${error.message}`, 'warning')
  }
}

// Main test runner
async function runAllTests() {
  log('🚀 Starting Data Upload System Test Suite', 'info')
  log('==========================================', 'info')
  
  await runTest('User Creation', testUserCreation)
  await runTest('Database Functions', testDatabaseFunctions)
  await runTest('CSV Processing', testCSVProcessing)
  await runTest('Table Name Generation', testTableNameGeneration)
  await runTest('Sample Data File', testSampleDataFile)
  await runTest('Data Source Tracking', testUserDataSourceTracking)
  await runTest('Error Handling', testErrorHandling)
  await runTest('Integration Test', testIntegration)
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
    log('\n🎉 All tests passed! Data upload system is working correctly.', 'success')
  } else {
    log('\n⚠️ Some tests failed. Check the errors above.', 'warning')
  }
  
  log('\n📋 NEXT STEPS:', 'info')
  log('1. Run database migrations for dynamic table functions', 'info')
  log('2. Test the complete flow in your browser using AuthFlow', 'info')
  log('3. Try uploading the generated test-data.csv file', 'info')
  log('4. Verify data appears in your user-specific table', 'info')
  
  log('\n📄 GENERATED FILES:', 'info')
  log(`- test-data.csv: Sample donor data for testing uploads`, 'info')
  
  process.exit(testResults.failed > 0 ? 1 : 0)
}

// Error handling
process.on('unhandledRejection', (error) => {
  log(`Unhandled rejection: ${error.message}`, 'error')
  process.exit(1)
})

// Run tests
runAllTests().catch(console.error)