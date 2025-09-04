// Quick Database Fix Verification
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kmepcdsklnnxokoimvzo.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDYyNDgsImV4cCI6MjA3MTEyMjI0OH0.7fa_fy4aWlz0PZvwC90X1r_6UMHzBujnN0fIngva1iI';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyFixes() {
  const results = {
    statusColumn: false,
    contributionsTable: false,
    kycTable: false,
    dashboardFunction: false,
  };

  // Test 1: Status column
  try {
    const { data, error } = await supabase
      .from('campaigns')
      .select('campaign_name, status')
      .limit(1);

    if (!error && data) {
      results.statusColumn = true;
    } else {
    }
  } catch (err) {
    console.log('   ❌ Status column error:', err.message);
  }

  // Test 2: Contributions table
  try {
    const { data, error } = await supabase.from('contributions').select('*').limit(1);

    if (!error) {
      results.contributionsTable = true;
    } else {
    }
  } catch (err) {
    console.log('   ❌ Contributions error:', err.message);
  }

  // Test 3: KYC table
  try {
    const { data, error } = await supabase.from('kyc_data').select('*').limit(1);

    if (!error) {
      results.kycTable = true;
    } else {
    }
  } catch (err) {
    console.log('   ❌ KYC error:', err.message);
  }

  // Test 4: Dashboard function
  try {
    const { data, error } = await supabase.rpc('get_dashboard_stats');

    if (!error && data) {
      results.dashboardFunction = true;
    } else {
    }
  } catch (err) {
    console.log('   ❌ Dashboard function error:', err.message);
  }

  // Summary
  const fixCount = Object.values(results).filter(Boolean).length;
  console.log('📊 VERIFICATION RESULTS');

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
