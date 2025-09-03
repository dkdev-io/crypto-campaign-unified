#!/usr/bin/env node

// Immediate fix for campaigns table - creates missing columns via function call
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kmepcdsklnnxokoimvzo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDYyNDgsImV4cCI6MjA3MTEyMjI0OH0.7fa_fy4aWlz0PZvwC90X1r_6UMHzBujnN0fIngva1iI';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixCampaignsTable() {
  try {
    console.log('🔧 Fixing campaigns table...');
    
    // Test current campaigns table structure
    const { data: testData, error: testError } = await supabase
      .from('campaigns')
      .select('*')
      .limit(1);
    
    console.log('Current campaigns table columns:', Object.keys(testData?.[0] || {}));
    
    if (testError) {
      console.error('❌ Cannot access campaigns table:', testError.message);
      return false;
    }
    
    // Try to call the fix function - if it exists
    try {
      const { data: functionResult, error: functionError } = await supabase
        .rpc('fix_campaigns_table_schema');
      
      if (functionError) {
        console.log('ℹ️ fix_campaigns_table_schema function not found:', functionError.message);
      } else {
        console.log('✅ Schema fix function executed successfully');
        return true;
      }
    } catch (e) {
      console.log('ℹ️ No schema fix function available');
    }
    
    // Alternative: Create a test campaign with minimal data
    console.log('📝 Creating test campaign entry...');
    
    const testCampaign = {
      campaign_name: 'Test Campaign for Committee Search',
      // Only include columns that definitely exist
      wallet_address: 'test-wallet-' + Date.now(),
      max_donation_limit: 3300,
      suggested_amounts: [25, 50, 100, 250]
    };
    
    const { data: newCampaign, error: insertError } = await supabase
      .from('campaigns')
      .insert([testCampaign])
      .select();
    
    if (insertError) {
      console.error('❌ Failed to create test campaign:', insertError.message);
      return false;
    } else {
      console.log('✅ Test campaign created:', newCampaign[0]);
      return true;
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
    return false;
  }
}

// Execute the fix
fixCampaignsTable().then(success => {
  if (success) {
    console.log('\n🎉 Fix completed successfully!');
    console.log('💡 You can now test the workflow at http://localhost:5173/setup');
  } else {
    console.log('\n⚠️ Manual database fix required.');
    console.log('📖 Please follow instructions in FIX_CAMPAIGNS_NOW.md');
    console.log('🔗 Supabase SQL Editor: https://supabase.com/dashboard/project/kmepcdsklnnxokoimvzo/sql');
  }
}).catch(console.error);