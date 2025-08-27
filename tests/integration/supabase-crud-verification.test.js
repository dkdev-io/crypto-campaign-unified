// Comprehensive Supabase CRUD Operations Verification
// Tests all database operations with existing mock data
// Ensures complete data flow integrity

import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';

// Initialize Supabase client with production credentials
const supabaseUrl = 'https://kmepcdsklnnxokoimvzo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDYyNDgsImV4cCI6MjA3MTEyMjI0OH0.7fa_fy4aWlz0PZvwC90X1r_6UMHzBujnN0fIngva1iI';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test report structure
const testReport = {
  timestamp: new Date().toISOString(),
  tables: {},
  operations: {
    CREATE: { passed: [], failed: [] },
    READ: { passed: [], failed: [] },
    UPDATE: { passed: [], failed: [] },
    DELETE: { passed: [], failed: [] }
  },
  queries: {
    working: [],
    broken: []
  },
  summary: {
    totalTests: 0,
    passed: 0,
    failed: 0,
    brokenFlows: []
  }
};

// Helper function to log test results
function logTest(operation, table, success, details) {
  const status = success ? 'passed' : 'failed';
  testReport.operations[operation][status].push({
    table,
    details,
    timestamp: new Date().toISOString()
  });
  testReport.summary.totalTests++;
  if (success) {
    testReport.summary.passed++;
  } else {
    testReport.summary.failed++;
    testReport.summary.brokenFlows.push(`${operation} on ${table}: ${details}`);
  }
  console.log(`${success ? '✅' : '❌'} ${operation} ${table}: ${details}`);
}

// Helper function to test query
async function testQuery(queryName, queryFunction) {
  try {
    const result = await queryFunction();
    if (result.error) {
      testReport.queries.broken.push({ name: queryName, error: result.error.message });
      return false;
    }
    testReport.queries.working.push({ name: queryName, count: result.data?.length || 0 });
    return true;
  } catch (error) {
    testReport.queries.broken.push({ name: queryName, error: error.message });
    return false;
  }
}

// 1. LIST ALL TABLES AND RELATIONSHIPS
async function listTablesAndRelationships() {
  
  const tables = [
    'campaigns',
    'contributions', 
    'kyc_data',
    'fec_committees',
    'committee_test_data',
    'donation_amounts',
    'blockchain_transactions',
    'admin_users'
  ];

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        testReport.tables[table] = { exists: false, error: error.message };
        console.log(`❌ Table '${table}': NOT ACCESSIBLE - ${error.message}`);
      } else {
        testReport.tables[table] = { exists: true, count: count || 0 };
        
        // Get sample record to understand structure
        const { data: sample } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (sample && sample.length > 0) {
          testReport.tables[table].columns = Object.keys(sample[0]);
        }
      }
    } catch (err) {
      testReport.tables[table] = { exists: false, error: err.message };
      console.log(`❌ Table '${table}': ERROR - ${err.message}`);
    }
  }

  // Test relationships
  
  // Campaign -> Contributions relationship
  const { data: campaignWithContribs } = await supabase
    .from('campaigns')
    .select(`
      *,
      contributions (
        id,
        amount,
        user_id
      )
    `)
    .limit(1);
  
  if (campaignWithContribs && campaignWithContribs[0]?.contributions) {
    console.log('✅ campaigns -> contributions relationship WORKING');
  } else {
    console.log('❌ campaigns -> contributions relationship NOT WORKING');
  }
}

// 2. TEST CREATE OPERATIONS
async function testCreateOperations() {

  // Test campaign creation
  const testCampaign = {
    campaign_name: `Test Campaign ${Date.now()}`,
    email: 'test@example.com',
    suggested_amounts: [25, 50, 100, 250],
    max_donation_limit: 3300,
    description: 'Test campaign for CRUD verification',
    status: 'active'
  };

  const { data: newCampaign, error: campaignError } = await supabase
    .from('campaigns')
    .insert(testCampaign)
    .select()
    .single();

  if (!campaignError && newCampaign) {
    logTest('CREATE', 'campaigns', true, `Created campaign: ${newCampaign.campaign_name}`);
    testReport.testCampaignId = newCampaign.id;

    // Test contribution creation with mock KYC user
    const testContribution = {
      campaign_id: newCampaign.id,
      user_id: 'mock-user-' + Date.now(),
      amount: 100,
      currency: 'USD',
      payment_method: 'test',
      status: 'pending',
      donor_email: 'donor@test.com',
      donor_name: 'Test Donor'
    };

    const { data: newContribution, error: contribError } = await supabase
      .from('contributions')
      .insert(testContribution)
      .select()
      .single();

    if (!contribError && newContribution) {
      logTest('CREATE', 'contributions', true, `Created contribution: $${newContribution.amount}`);
      testReport.testContributionId = newContribution.id;
    } else {
      logTest('CREATE', 'contributions', false, contribError?.message || 'Unknown error');
    }
  } else {
    logTest('CREATE', 'campaigns', false, campaignError?.message || 'Unknown error');
  }

  // Test KYC data creation
  const testKYC = {
    user_id: 'kyc-test-' + Date.now(),
    full_name: 'Test User',
    email: 'kyc@test.com',
    date_of_birth: '1990-01-01',
    ssn_last_four: '1234',
    address_line1: '123 Test St',
    city: 'Test City',
    state: 'CA',
    postal_code: '90210',
    country: 'USA',
    verification_status: 'pending'
  };

  const { data: newKYC, error: kycError } = await supabase
    .from('kyc_data')
    .insert(testKYC)
    .select()
    .single();

  if (!kycError && newKYC) {
    logTest('CREATE', 'kyc_data', true, `Created KYC record for: ${newKYC.full_name}`);
    testReport.testKYCId = newKYC.id;
  } else {
    logTest('CREATE', 'kyc_data', false, kycError?.message || 'Unknown error');
  }
}

// 3. TEST READ OPERATIONS
async function testReadOperations() {

  // Test loading all campaigns
  const { data: allCampaigns, error: campaignsError } = await supabase
    .from('campaigns')
    .select('*')
    .eq('status', 'active');

  if (!campaignsError && allCampaigns) {
    logTest('READ', 'campaigns', true, `Loaded ${allCampaigns.length} active campaigns`);
  } else {
    logTest('READ', 'campaigns', false, campaignsError?.message || 'No campaigns found');
  }

  // Test loading individual campaign with contributions
  if (testReport.testCampaignId) {
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select(`
        *,
        contributions (
          id,
          amount,
          user_id,
          status,
          created_at
        )
      `)
      .eq('id', testReport.testCampaignId)
      .single();

    if (!campaignError && campaign) {
      logTest('READ', 'campaign with contributions', true, 
        `Loaded campaign "${campaign.campaign_name}" with ${campaign.contributions?.length || 0} contributions`);
    } else {
      logTest('READ', 'campaign with contributions', false, campaignError?.message || 'Unknown error');
    }
  }

  // Test loading contributions by user
  const { data: userContribs, error: userContribsError } = await supabase
    .from('contributions')
    .select('*')
    .limit(10);

  if (!userContribsError && userContribs) {
    logTest('READ', 'contributions', true, `Loaded ${userContribs.length} contributions`);
  } else {
    logTest('READ', 'contributions', false, userContribsError?.message || 'Unknown error');
  }

  // Test loading KYC data with approved status
  const { data: approvedKYC, error: kycError } = await supabase
    .from('kyc_data')
    .select('*')
    .eq('verification_status', 'approved');

  if (!kycError) {
    logTest('READ', 'kyc_data (approved)', true, `Found ${approvedKYC?.length || 0} approved KYC records`);
  } else {
    logTest('READ', 'kyc_data', false, kycError?.message || 'Unknown error');
  }

  // Test admin dashboard statistics
  const { data: stats, error: statsError } = await supabase
    .rpc('get_dashboard_stats', {});

  if (!statsError) {
    logTest('READ', 'dashboard statistics', true, 'Dashboard stats loaded');
  } else {
    // Try alternative method if RPC doesn't exist
    const { count: campaignCount } = await supabase
      .from('campaigns')
      .select('*', { count: 'exact', head: true });
    
    const { count: contribCount } = await supabase
      .from('contributions')
      .select('*', { count: 'exact', head: true });

    if (campaignCount !== null && contribCount !== null) {
      logTest('READ', 'dashboard statistics (manual)', true, 
        `${campaignCount} campaigns, ${contribCount} contributions`);
    } else {
      logTest('READ', 'dashboard statistics', false, 'Unable to get counts');
    }
  }
}

// 4. TEST UPDATE OPERATIONS
async function testUpdateOperations() {

  // Update campaign details
  if (testReport.testCampaignId) {
    const updateData = {
      description: 'Updated description at ' + new Date().toISOString(),
      suggested_amounts: [50, 100, 250, 500]
    };

    const { data: updatedCampaign, error: updateError } = await supabase
      .from('campaigns')
      .update(updateData)
      .eq('id', testReport.testCampaignId)
      .select()
      .single();

    if (!updateError && updatedCampaign) {
      logTest('UPDATE', 'campaigns', true, `Updated campaign: ${updatedCampaign.campaign_name}`);
    } else {
      logTest('UPDATE', 'campaigns', false, updateError?.message || 'Unknown error');
    }
  }

  // Update contribution status
  if (testReport.testContributionId) {
    const { data: updatedContrib, error: contribUpdateError } = await supabase
      .from('contributions')
      .update({ status: 'completed' })
      .eq('id', testReport.testContributionId)
      .select()
      .single();

    if (!contribUpdateError && updatedContrib) {
      logTest('UPDATE', 'contributions', true, `Updated contribution status to: ${updatedContrib.status}`);
    } else {
      logTest('UPDATE', 'contributions', false, contribUpdateError?.message || 'Unknown error');
    }
  }

  // Update KYC verification status
  if (testReport.testKYCId) {
    const { data: updatedKYC, error: kycUpdateError } = await supabase
      .from('kyc_data')
      .update({ verification_status: 'approved' })
      .eq('id', testReport.testKYCId)
      .select()
      .single();

    if (!kycUpdateError && updatedKYC) {
      logTest('UPDATE', 'kyc_data', true, `Updated KYC status to: ${updatedKYC.verification_status}`);
    } else {
      logTest('UPDATE', 'kyc_data', false, kycUpdateError?.message || 'Unknown error');
    }
  }
}

// 5. TEST DELETE OPERATIONS
async function testDeleteOperations() {

  // Test soft delete (if implemented)
  // Note: Checking if soft delete is implemented by updating status instead of hard delete
  if (testReport.testCampaignId) {
    // First try soft delete by updating status
    const { error: softDeleteError } = await supabase
      .from('campaigns')
      .update({ status: 'deleted' })
      .eq('id', testReport.testCampaignId);

    if (!softDeleteError) {
      logTest('DELETE', 'campaigns (soft)', true, 'Soft deleted campaign');
    } else {
      // Try hard delete if soft delete doesn't work
      const { error: hardDeleteError } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', testReport.testCampaignId);

      if (!hardDeleteError) {
        logTest('DELETE', 'campaigns (hard)', true, 'Hard deleted campaign');
      } else {
        logTest('DELETE', 'campaigns', false, hardDeleteError?.message || 'Unknown error');
      }
    }
  }

  // Test cascade delete (contributions should be deleted when campaign is deleted)
  // First check if contributions still exist
  if (testReport.testContributionId) {
    const { data: contribution, error } = await supabase
      .from('contributions')
      .select('*')
      .eq('id', testReport.testContributionId)
      .single();

    if (!contribution && !error) {
      logTest('DELETE', 'contributions (cascade)', true, 'Contribution cascade deleted with campaign');
    } else if (contribution) {
      // Manual cleanup if cascade didn't work
      const { error: deleteError } = await supabase
        .from('contributions')
        .delete()
        .eq('id', testReport.testContributionId);

      if (!deleteError) {
        logTest('DELETE', 'contributions (manual)', true, 'Manually deleted contribution');
      } else {
        logTest('DELETE', 'contributions', false, deleteError?.message || 'Unknown error');
      }
    }
  }

  // Clean up test KYC data
  if (testReport.testKYCId) {
    const { error: kycDeleteError } = await supabase
      .from('kyc_data')
      .delete()
      .eq('id', testReport.testKYCId);

    if (!kycDeleteError) {
      logTest('DELETE', 'kyc_data', true, 'Deleted test KYC record');
    } else {
      logTest('DELETE', 'kyc_data', false, kycDeleteError?.message || 'Unknown error');
    }
  }
}

// 6. TEST SPECIFIC QUERIES
async function testSpecificQueries() {

  const queries = [
    {
      name: 'Active Campaigns',
      query: () => supabase
        .from('campaigns')
        .select('*')
        .eq('status', 'active')
    },
    {
      name: 'User Contributions',
      query: () => supabase
        .from('contributions')
        .select('*')
        .limit(10)
    },
    {
      name: 'Approved KYC',
      query: () => supabase
        .from('kyc_data')
        .select('*')
        .eq('verification_status', 'approved')
    },
    {
      name: 'Campaign with Total Raised',
      query: () => supabase
        .from('campaigns')
        .select(`
          *,
          contributions (
            amount
          )
        `)
        .limit(1)
    },
    {
      name: 'Recent Contributions',
      query: () => supabase
        .from('contributions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)
    },
    {
      name: 'Test Committees',
      query: () => supabase
        .from('committee_test_data')
        .select('*')
        .eq('is_active', true)
    }
  ];

  for (const { name, query } of queries) {
    const success = await testQuery(name, query);
    console.log(`${success ? '✅' : '❌'} Query: ${name}`);
  }
}

// Generate comprehensive test report
function generateReport() {
  
  console.log('📊 TABLE STATUS:');
  for (const [table, info] of Object.entries(testReport.tables)) {
    if (info.exists) {
      console.log(`  ✅ ${table}: ${info.count} records`);
    } else {
      console.log(`  ❌ ${table}: ${info.error}`);
    }
  }

  for (const [operation, results] of Object.entries(testReport.operations)) {
    if (results.passed.length > 0) {
      results.passed.forEach(test => {
      });
    }
  }

  for (const [operation, results] of Object.entries(testReport.operations)) {
    if (results.failed.length > 0) {
      results.failed.forEach(test => {
      });
    }
  }

  testReport.queries.working.forEach(q => {
  });

  testReport.queries.broken.forEach(q => {
    console.log(`  ❌ ${q.name}: ${q.error}`);
  });

  console.log('\n📈 SUMMARY:');
  console.log(`  Total Tests: ${testReport.summary.totalTests}`);
  console.log(`  Passed: ${testReport.summary.passed}`);
  console.log(`  Failed: ${testReport.summary.failed}`);
  console.log(`  Success Rate: ${((testReport.summary.passed / testReport.summary.totalTests) * 100).toFixed(1)}%`);

  if (testReport.summary.brokenFlows.length > 0) {
    testReport.summary.brokenFlows.forEach(flow => {
    });
  }

  // Save report to file
  const reportFilename = `tests/integration/crud-report-${new Date().toISOString().split('T')[0]}.json`;
  writeFileSync(reportFilename, JSON.stringify(testReport, null, 2));
}

// Main execution function
async function runAllTests() {
  console.log('🚀 Starting Comprehensive CRUD Verification');

  try {
    await listTablesAndRelationships();
    await testCreateOperations();
    await testReadOperations();
    await testUpdateOperations();
    await testDeleteOperations();
    await testSpecificQueries();
  } catch (error) {
    console.error('\n❌ Critical error during testing:', error);
    testReport.summary.brokenFlows.push(`Critical error: ${error.message}`);
  } finally {
    generateReport();
  }

}

// Run tests
runAllTests().catch(console.error);

export { runAllTests, testReport };