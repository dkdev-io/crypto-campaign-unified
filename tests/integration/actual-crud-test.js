// Actual CRUD Tests for Real Database Schema
import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';

const supabaseUrl = 'https://kmepcdsklnnxokoimvzo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDYyNDgsImV4cCI6MjA3MTEyMjI0OH0.7fa_fy4aWlz0PZvwC90X1r_6UMHzBujnN0fIngva1iI';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test report structure
const report = {
  timestamp: new Date().toISOString(),
  working: [],
  broken: [],
  summary: {}
};

console.log('🚀 CRUD OPERATIONS TEST - ACTUAL SCHEMA');

// Helper to log results
function log(operation, success, details) {
  const status = success ? '✅' : '❌';
  if (success) {
    report.working.push({ operation, details });
  } else {
    report.broken.push({ operation, details });
  }
}

// TEST 1: CREATE Campaign
async function testCreate() {
  
  const testCampaign = {
    campaign_name: `Test Campaign ${Date.now()}`,
    email: 'test@example.com',
    website: 'https://test.com',
    wallet_address: `test-wallet-${Date.now()}`,
    suggested_amounts: [25, 50, 100, 250, 500],
    max_donation_limit: 3300,
    theme_color: '#4a90e2',
    supported_cryptos: ['BTC', 'ETH', 'USDC', 'SOL']
  };

  const { data, error } = await supabase
    .from('campaigns')
    .insert(testCampaign)
    .select()
    .single();

  if (data && !error) {
    log('CREATE campaign', true, `Created: ${data.campaign_name} (ID: ${data.id})`);
    report.testCampaignId = data.id;
    return data.id;
  } else {
    log('CREATE campaign', false, error?.message || 'Unknown error');
    return null;
  }
}

// TEST 2: READ Operations
async function testRead() {

  // Read all campaigns
  const { data: allCampaigns, error: allError } = await supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false });

  if (allCampaigns && !allError) {
    log('READ all campaigns', true, `Found ${allCampaigns.length} campaigns`);
  } else {
    log('READ all campaigns', false, allError?.message || 'No data');
  }

  // Read single campaign
  if (report.testCampaignId) {
    const { data: single, error: singleError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', report.testCampaignId)
      .single();

    if (single && !singleError) {
      log('READ single campaign', true, `Retrieved: ${single.campaign_name}`);
    } else {
      log('READ single campaign', false, singleError?.message || 'Not found');
    }
  }

  // Read with filters
  const { data: filtered, error: filterError } = await supabase
    .from('campaigns')
    .select('campaign_name, email, max_donation_limit')
    .gte('max_donation_limit', 1000)
    .limit(5);

  if (filtered && !filterError) {
    log('READ filtered campaigns', true, `Found ${filtered.length} campaigns with limit >= $1000`);
  } else {
    log('READ filtered campaigns', false, filterError?.message || 'Filter failed');
  }

  // Read campaigns with specific crypto support
  const { data: cryptoFiltered, error: cryptoError } = await supabase
    .from('campaigns')
    .select('campaign_name, supported_cryptos')
    .contains('supported_cryptos', ['BTC']);

  if (cryptoFiltered && !cryptoError) {
    log('READ BTC-supporting campaigns', true, `Found ${cryptoFiltered.length} BTC campaigns`);
  } else {
    log('READ crypto-filtered', false, cryptoError?.message || 'Filter failed');
  }
}

// TEST 3: UPDATE Operations
async function testUpdate() {

  if (!report.testCampaignId) {
    log('UPDATE campaign', false, 'No test campaign to update');
    return;
  }

  // Update suggested amounts
  const newAmounts = [10, 25, 50, 100, 250, 500, 1000];
  const { data: updated1, error: error1 } = await supabase
    .from('campaigns')
    .update({ suggested_amounts: newAmounts })
    .eq('id', report.testCampaignId)
    .select()
    .single();

  if (updated1 && !error1) {
    log('UPDATE suggested_amounts', true, `Updated to: [${newAmounts.join(', ')}]`);
  } else {
    log('UPDATE suggested_amounts', false, error1?.message || 'Update failed');
  }

  // Update multiple fields
  const multiUpdate = {
    max_donation_limit: 5000,
    theme_color: '#ff6b6b',
    supported_cryptos: ['BTC', 'ETH', 'USDC', 'SOL', 'MATIC']
  };

  const { data: updated2, error: error2 } = await supabase
    .from('campaigns')
    .update(multiUpdate)
    .eq('id', report.testCampaignId)
    .select()
    .single();

  if (updated2 && !error2) {
    log('UPDATE multiple fields', true, `Max: $${updated2.max_donation_limit}, Cryptos: ${updated2.supported_cryptos.length}`);
  } else {
    log('UPDATE multiple fields', false, error2?.message || 'Update failed');
  }

  // Update with condition
  const { data: conditional, error: condError } = await supabase
    .from('campaigns')
    .update({ website: 'https://updated-test.com' })
    .eq('id', report.testCampaignId)
    .eq('email', 'test@example.com')
    .select()
    .single();

  if (conditional && !condError) {
    log('UPDATE conditional', true, `Website updated to: ${conditional.website}`);
  } else {
    log('UPDATE conditional', false, condError?.message || 'Conditional update failed');
  }
}

// TEST 4: DELETE Operations
async function testDelete() {

  if (!report.testCampaignId) {
    log('DELETE campaign', false, 'No test campaign to delete');
    return;
  }

  // First verify it exists
  const { data: exists, error: existError } = await supabase
    .from('campaigns')
    .select('campaign_name')
    .eq('id', report.testCampaignId)
    .single();

  if (!exists || existError) {
    log('DELETE verify', false, 'Campaign not found for deletion');
    return;
  }

  // Delete the test campaign
  const { error: deleteError } = await supabase
    .from('campaigns')
    .delete()
    .eq('id', report.testCampaignId);

  if (!deleteError) {
    log('DELETE campaign', true, `Deleted: ${exists.campaign_name}`);

    // Verify deletion
    const { data: check, error: checkError } = await supabase
      .from('campaigns')
      .select('id')
      .eq('id', report.testCampaignId)
      .single();

    if (!check && checkError?.code === 'PGRST116') {
      log('DELETE verification', true, 'Confirmed campaign was deleted');
    } else {
      log('DELETE verification', false, 'Campaign still exists after deletion');
    }
  } else {
    log('DELETE campaign', false, deleteError?.message || 'Delete failed');
  }
}

// TEST 5: Complex Queries
async function testComplexQueries() {

  // Query 1: Campaigns with high donation limits
  const { data: highLimit, error: err1 } = await supabase
    .from('campaigns')
    .select('campaign_name, max_donation_limit, email')
    .gte('max_donation_limit', 2000)
    .order('max_donation_limit', { ascending: false });

  if (highLimit && !err1) {
    log('QUERY high donation limits', true, `Found ${highLimit.length} campaigns >= $2000`);
  } else {
    log('QUERY high donation limits', false, err1?.message || 'Query failed');
  }

  // Query 2: Recent campaigns
  const { data: recent, error: err2 } = await supabase
    .from('campaigns')
    .select('campaign_name, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (recent && !err2) {
    log('QUERY recent campaigns', true, `Retrieved ${recent.length} most recent campaigns`);
  } else {
    log('QUERY recent campaigns', false, err2?.message || 'Query failed');
  }

  // Query 3: Count campaigns
  const { count, error: err3 } = await supabase
    .from('campaigns')
    .select('*', { count: 'exact', head: true });

  if (count !== null && !err3) {
    log('QUERY count', true, `Total campaigns in database: ${count}`);
  } else {
    log('QUERY count', false, err3?.message || 'Count failed');
  }

  // Query 4: Campaigns by email domain
  const { data: byEmail, error: err4 } = await supabase
    .from('campaigns')
    .select('campaign_name, email')
    .like('email', '%gmail.com');

  if (byEmail && !err4) {
    log('QUERY by email pattern', true, `Found ${byEmail.length} Gmail campaigns`);
  } else {
    log('QUERY by email pattern', false, err4?.message || 'Pattern query failed');
  }

  // Query 5: Aggregate crypto support
  const { data: allCampaigns, error: err5 } = await supabase
    .from('campaigns')
    .select('supported_cryptos');

  if (allCampaigns && !err5) {
    const cryptoCount = {};
    allCampaigns.forEach(c => {
      if (c.supported_cryptos) {
        c.supported_cryptos.forEach(crypto => {
          cryptoCount[crypto] = (cryptoCount[crypto] || 0) + 1;
        });
      }
    });
    log('QUERY crypto analysis', true, `Crypto support: ${JSON.stringify(cryptoCount)}`);
  } else {
    log('QUERY crypto analysis', false, err5?.message || 'Analysis failed');
  }
}

// TEST 6: Edge Cases
async function testEdgeCases() {

  // Test 1: Invalid ID
  const { data: invalid, error: invErr } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', 'invalid-uuid-format')
    .single();

  if (invErr) {
    log('EDGE invalid UUID', true, 'Properly handles invalid UUID');
  } else {
    log('EDGE invalid UUID', false, 'Should have failed on invalid UUID');
  }

  // Test 2: Empty insert (should fail)
  const { error: emptyErr } = await supabase
    .from('campaigns')
    .insert({})
    .select();

  if (emptyErr) {
    log('EDGE empty insert', true, 'Properly rejects empty insert');
  } else {
    log('EDGE empty insert', false, 'Should have failed on empty insert');
  }

  // Test 3: Duplicate wallet address (if unique constraint exists)
  const wallet = `unique-test-${Date.now()}`;
  const campaign1 = {
    campaign_name: 'Campaign 1',
    email: 'test1@example.com',
    wallet_address: wallet
  };

  const { data: first, error: firstErr } = await supabase
    .from('campaigns')
    .insert(campaign1)
    .select()
    .single();

  if (first && !firstErr) {
    const campaign2 = {
      campaign_name: 'Campaign 2',
      email: 'test2@example.com',
      wallet_address: wallet
    };

    const { error: dupErr } = await supabase
      .from('campaigns')
      .insert(campaign2)
      .select()
      .single();

    if (dupErr) {
      log('EDGE duplicate wallet', true, 'Wallet uniqueness enforced');
    } else {
      log('EDGE duplicate wallet', false, 'Duplicate wallet allowed (no constraint)');
    }

    // Cleanup
    await supabase.from('campaigns').delete().eq('id', first.id);
  }

  // Test 4: Large array in suggested_amounts
  const largeAmounts = Array.from({ length: 100 }, (_, i) => (i + 1) * 10);
  const { data: largeArray, error: largeErr } = await supabase
    .from('campaigns')
    .insert({
      campaign_name: 'Large Array Test',
      email: 'large@test.com',
      suggested_amounts: largeAmounts,
      wallet_address: `large-${Date.now()}`
    })
    .select()
    .single();

  if (largeArray && !largeErr) {
    log('EDGE large array', true, `Stored ${largeArray.suggested_amounts.length} amounts`);
    // Cleanup
    await supabase.from('campaigns').delete().eq('id', largeArray.id);
  } else {
    log('EDGE large array', false, largeErr?.message || 'Large array failed');
  }
}

// Generate final report
function generateReport() {
  console.log('📊 FINAL REPORT');

  report.working.forEach(item => {
  });

  if (report.broken.length === 0) {
  } else {
    report.broken.forEach(item => {
    });
  }

  const total = report.working.length + report.broken.length;
  const successRate = ((report.working.length / total) * 100).toFixed(1);

  console.log('\n📈 SUMMARY:');
  console.log(`  Success Rate: ${successRate}%`);

  // Save detailed report
  const filename = `tests/integration/crud-results-${new Date().toISOString().split('T')[0]}.json`;
  writeFileSync(filename, JSON.stringify(report, null, 2));
}

// Run all tests
async function runTests() {

  try {
    const campaignId = await testCreate();
    await testRead();
    await testUpdate();
    await testDelete();
    await testComplexQueries();
    await testEdgeCases();
  } catch (error) {
    console.error('❌ Critical error:', error);
    report.broken.push({ operation: 'CRITICAL', details: error.message });
  }

  generateReport();
}

// Execute
runTests().catch(console.error);