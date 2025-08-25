#!/usr/bin/env node

// Simple script to add the "Testy Test for Chancellor" committee
// This assumes the tables already exist and just inserts test data

import { createClient } from '@supabase/supabase-js';

// Use the existing credentials from your config
const supabaseUrl = 'https://kmepcdsklnnxokoimvzo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDYyNDgsImV4cCI6MjA3MTEyMjI0OH0.7fa_fy4aWlz0PZvwC90X1r_6UMHzBujnN0fIngva1iI';


const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function addTestCommittee() {
  try {
    // First, check if the fec_committees table exists
    
    const { data: existingData, error: checkError } = await supabase
      .from('fec_committees')
      .select('count')
      .limit(1);
    
    if (checkError) {
      console.error('❌ fec_committees table does not exist:', checkError.message);
      return;
    }
    
    console.log('✅ fec_committees table exists');
    
    // Check if test committee already exists
    
    const { data: existing, error: existsError } = await supabase
      .from('fec_committees')
      .select('*')
      .eq('fec_committee_id', 'C00999999')
      .single();
    
    if (existing) {
      return;
    }
    
    // Insert the test committee
    
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
      }
    } else {
      console.log('🎉 SUCCESS! Test committee added:');
      
      // Test the search functionality
      await testSearchFunctionality();
    }
    
  } catch (error) {
    console.error('💥 Error:', error);
  }
}

async function testSearchFunctionality() {
  
  try {
    // Test if the search function exists
    const { data, error } = await supabase
      .rpc('search_fec_committees', {
        search_term: 'Testy',
        limit_count: 10
      });
    
    if (error) {
      console.log('⚠️  Search function not available:', error.message);
    } else {
      console.log('✅ Search function works! Found committees:');
      data.forEach(committee => {
      });
    }
  } catch (error) {
    console.log('⚠️  Could not test search function:', error.message);
  }
}

// Run the script
addTestCommittee()
  .then(() => {
  })
  .catch((error) => {
    console.error('\n💥 Failed to add test committee:', error);
  });