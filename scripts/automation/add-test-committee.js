#!/usr/bin/env node

// Simple script to add the "Testy Test for Chancellor" committee
// This assumes the tables already exist and just inserts test data

import { createClient } from '@supabase/supabase-js';

// Use the existing credentials from your config
const supabaseUrl = 'https://kmepcdsklnnxokoimvzo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDYyNDgsImV4cCI6MjA3MTEyMjI0OH0.7fa_fy4aWlz0PZvwC90X1r_6UMHzBujnN0fIngva1iI';

console.log('🎯 Adding "Testy Test for Chancellor" committee to database...');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function addTestCommittee() {
  try {
    // First, check if the fec_committees table exists
    console.log('🔍 Checking if fec_committees table exists...');
    
    const { data: existingData, error: checkError } = await supabase
      .from('fec_committees')
      .select('count')
      .limit(1);
    
    if (checkError) {
      console.error('❌ fec_committees table does not exist:', checkError.message);
      console.log('📋 You need to run the full schema migration first.');
      console.log('💡 Please apply the SQL file: docs/fec-committees-schema.sql to your Supabase database');
      return;
    }
    
    console.log('✅ fec_committees table exists');
    
    // Check if test committee already exists
    console.log('🔍 Checking if test committee already exists...');
    
    const { data: existing, error: existsError } = await supabase
      .from('fec_committees')
      .select('*')
      .eq('fec_committee_id', 'C00999999')
      .single();
    
    if (existing) {
      console.log('ℹ️  Test committee already exists:');
      console.log(`   📍 Committee ID: ${existing.fec_committee_id}`);
      console.log(`   🏛️  Name: ${existing.committee_name}`);
      console.log(`   👤 Candidate: ${existing.candidate_name}`);
      return;
    }
    
    // Insert the test committee
    console.log('➕ Inserting test committee...');
    
    const testCommittee = {
      fec_committee_id: 'C00999999',
      committee_name: 'TESTY TEST FOR CHANCELLOR',
      committee_type: 'N',
      committee_designation: 'U',
      organization_type: 'Candidate Committee',
      candidate_name: 'CHANCELLOR, TESTY',
      candidate_office: 'H',
      candidate_office_state: 'CA',
      city: 'SAN FRANCISCO',
      state: 'CA',
      treasurer_name: 'TEST, TREASURER',
      is_active: true
    };
    
    const { data, error } = await supabase
      .from('fec_committees')
      .insert([testCommittee])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Failed to insert test committee:', error);
      
      // Check if it's a missing column error and suggest solution
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        console.log('💡 This might be a schema issue. The table exists but is missing columns.');
        console.log('🔧 Please run the full schema migration: docs/fec-committees-schema.sql');
      }
    } else {
      console.log('🎉 SUCCESS! Test committee added:');
      console.log(`   📍 Committee ID: ${data.fec_committee_id}`);
      console.log(`   🏛️  Name: ${data.committee_name}`);
      console.log(`   👤 Candidate: ${data.candidate_name}`);
      console.log(`   📍 Location: ${data.city}, ${data.state}`);
      console.log(`   💼 Treasurer: ${data.treasurer_name}`);
      
      // Test the search functionality
      await testSearchFunctionality();
    }
    
  } catch (error) {
    console.error('💥 Error:', error);
  }
}

async function testSearchFunctionality() {
  console.log('\n🔍 Testing search functionality...');
  
  try {
    // Test if the search function exists
    const { data, error } = await supabase
      .rpc('search_fec_committees', {
        search_term: 'Testy',
        limit_count: 10
      });
    
    if (error) {
      console.log('⚠️  Search function not available:', error.message);
      console.log('💡 The search_fec_committees function needs to be created via the full schema migration');
    } else {
      console.log('✅ Search function works! Found committees:');
      data.forEach(committee => {
        console.log(`   🏛️  ${committee.committee_name} (${committee.fec_committee_id})`);
      });
    }
  } catch (error) {
    console.log('⚠️  Could not test search function:', error.message);
  }
}

// Run the script
addTestCommittee()
  .then(() => {
    console.log('\n✨ Test committee setup completed!');
    console.log('🔗 Test it at: http://localhost:5173/');
    console.log('💡 Search for "Testy" or "Chancellor" in the campaign setup');
  })
  .catch((error) => {
    console.error('\n💥 Failed to add test committee:', error);
  });