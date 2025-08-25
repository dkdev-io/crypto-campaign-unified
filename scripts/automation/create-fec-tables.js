#!/usr/bin/env node

// Script to create FEC committee tables and add test data
// This breaks down the migration into individual operations

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kmepcdsklnnxokoimvzo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDYyNDgsImV4cCI6MjA3MTEyMjI0OH0.7fa_fy4aWlz0PZvwC90X1r_6UMHzBujnN0fIngva1iI';

console.log('🚀 Creating FEC committee tables and test data...');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function executeSQL(description, sql) {
  
  try {
    // Try using a custom SQL execution function if available
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: sql
    });
    
    if (error) {
      console.error(`❌ ${description} failed:`, error.message);
      return false;
    } else {
      console.log(`✅ ${description} successful`);
      return true;
    }
  } catch (err) {
    console.error(`💥 ${description} exception:`, err.message);
    return false;
  }
}

async function createTables() {
  console.log('📊 Starting table creation process...');
  
  // First, let's check what we can do with the current permissions
  try {
    // Test basic connectivity
    const { data: testData, error: testError } = await supabase
      .from('campaigns')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Database connection test failed:', testError.message);
      return;
    }
    
    console.log('✅ Database connection successful');
    
    // Check current user permissions
    
    // Since we can't create tables with anon key, let's create the test data
    // in the committee_test_data table (which might already exist)
    await addTestCommittees();
    
  } catch (error) {
    console.error('💥 Error during table creation:', error);
  }
}

async function addTestCommittees() {
  
  // Check if committee_test_data table exists
  try {
    const { data, error } = await supabase
      .from('committee_test_data')
      .select('count')
      .limit(1);
    
    if (error) {
      await createFallbackTestData();
      return;
    }
    
    console.log('✅ committee_test_data table exists');
    
    // Add our test committee
    const testCommittees = [
      {
        committee_name: 'Testy Test for Chancellor',
        test_purpose: 'User requested test committee for development',
        added_by_email: 'admin@example.com'
      },
      {
        committee_name: 'Chancellor Campaign Test Committee',
        test_purpose: 'Additional test variation',
        added_by_email: 'admin@example.com'
      }
    ];
    
    for (const committee of testCommittees) {
      // Check if already exists
      const { data: existing } = await supabase
        .from('committee_test_data')
        .select('*')
        .eq('committee_name', committee.committee_name)
        .single();
      
      if (existing) {
        continue;
      }
      
      // Insert new test committee
      const { data, error } = await supabase
        .from('committee_test_data')
        .insert([committee])
        .select()
        .single();
      
      if (error) {
        console.error(`❌ Failed to add "${committee.committee_name}":`, error.message);
      } else {
      }
    }
    
  } catch (error) {
    console.error('💥 Error adding test committees:', error);
  }
}

async function createFallbackTestData() {
  
  // Since we can't create the full FEC schema with anon permissions,
  // let's at least show how to create the test committee in the test data table
  
  const fallbackInstructions = `
📋 MANUAL MIGRATION REQUIRED

Since the anon key doesn't have permissions to create tables, please:

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/kmepcdsklnnxokoimvzo
2. Navigate to SQL Editor
3. Copy and paste the contents of: docs/fec-committees-schema.sql
4. Execute the SQL to create the tables
5. Run this script again to add the test data

Alternatively, here's the minimal SQL to add just the test committee:

-- First create the table (if it doesn't exist):
CREATE TABLE IF NOT EXISTS committee_test_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    committee_name TEXT NOT NULL,
    test_purpose TEXT,
    added_by_email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Then insert the test data:
INSERT INTO committee_test_data (committee_name, test_purpose, added_by_email) 
VALUES ('Testy Test for Chancellor', 'User requested test committee', 'admin@example.com')
ON CONFLICT DO NOTHING;
`;
  
}

async function verifySetup() {
  
  try {
    // Check if we can find any test committees
    const { data, error } = await supabase
      .from('committee_test_data')
      .select('*')
      .ilike('committee_name', '%testy%');
    
    if (error) {
      console.log('⚠️  Could not verify test committees:', error.message);
    } else if (data && data.length > 0) {
      data.forEach(committee => {
      });
    } else {
    }
  } catch (error) {
    console.log('⚠️  Verification failed:', error.message);
  }
}

// Main execution
createTables()
  .then(() => verifySetup())
  .then(() => {
  })
  .catch((error) => {
    console.error('\n💥 Process failed:', error);
  });