// Quick Database Fix Verification
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kmepcdsklnnxokoimvzo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDYyNDgsImV4cCI6MjA3MTEyMjI0OH0.7fa_fy4aWlz0PZvwC90X1r_6UMHzBujnN0fIngva1iI';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🔍 QUICK DATABASE FIX VERIFICATION');
console.log('=' .repeat(50));

async function verifyFixes() {
  const results = {
    statusColumn: false,
    contributionsTable: false,
    kycTable: false,
    dashboardFunction: false
  };

  // Test 1: Status column
  console.log('\n1️⃣ Testing status column...');
  try {
    const { data, error } = await supabase
      .from('campaigns')
      .select('campaign_name, status')
      .limit(1);

    if (!error && data) {
      console.log('   ✅ Status column working!');
      results.statusColumn = true;
    } else {
      console.log('   ❌ Status column still missing');
    }
  } catch (err) {
    console.log('   ❌ Status column error:', err.message);
  }

  // Test 2: Contributions table
  console.log('\n2️⃣ Testing contributions table...');
  try {
    const { data, error } = await supabase
      .from('contributions')
      .select('*')
      .limit(1);

    if (!error) {
      console.log('   ✅ Contributions table accessible!');
      results.contributionsTable = true;
    } else {
      console.log('   ❌ Contributions table still inaccessible');
    }
  } catch (err) {
    console.log('   ❌ Contributions error:', err.message);
  }

  // Test 3: KYC table
  console.log('\n3️⃣ Testing KYC data table...');
  try {
    const { data, error } = await supabase
      .from('kyc_data')
      .select('*')
      .limit(1);

    if (!error) {
      console.log('   ✅ KYC data table accessible!');
      results.kycTable = true;
    } else {
      console.log('   ❌ KYC data table still inaccessible');
    }
  } catch (err) {
    console.log('   ❌ KYC error:', err.message);
  }

  // Test 4: Dashboard function
  console.log('\n4️⃣ Testing dashboard function...');
  try {
    const { data, error } = await supabase.rpc('get_dashboard_stats');

    if (!error && data) {
      console.log('   ✅ Dashboard function working!');
      console.log('   📊 Stats:', JSON.stringify(data, null, 2));
      results.dashboardFunction = true;
    } else {
      console.log('   ❌ Dashboard function still missing');
    }
  } catch (err) {
    console.log('   ❌ Dashboard function error:', err.message);
  }

  // Summary
  const fixCount = Object.values(results).filter(Boolean).length;
  console.log('\n' + '=' .repeat(50));
  console.log('📊 VERIFICATION RESULTS');
  console.log('=' .repeat(50));
  console.log(`✅ Fixes Applied: ${fixCount}/4`);
  
  if (fixCount === 4) {
    console.log('🎉 ALL DATABASE FIXES SUCCESSFUL!');
    console.log('🚀 Database is now fully functional for CRUD operations');
  } else if (fixCount >= 2) {
    console.log('⚠️  PARTIAL SUCCESS - Some fixes applied');
  } else {
    console.log('❌ FIXES NOT APPLIED - SQL may not have run correctly');
  }

  return results;
}

verifyFixes().catch(console.error);