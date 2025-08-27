// New Database Inspector - Check updated Supabase connection
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://owjvgdzmmlrdtpjdxgka.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93anZnZHptbWxyZHRwamR4Z2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY4NTI4MTksImV4cCI6MjA0MjQyODgxOX0.dHyNtZfNzuaeBdrZiDzH4eMGYP4-FVWQd7F1Xf3VKz0';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectNewDatabase() {
  console.log('🔍 Inspecting New Database Connection...\n');
  console.log(`🔗 URL: ${supabaseUrl}`);

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

  const report = {
    accessible: [],
    inaccessible: [],
    empty: [],
    hasData: []
  };

  for (const table of tables) {
    console.log(`\n📊 Testing table: ${table}`);
    console.log('=' .repeat(30));
    
    try {
      // Test basic access
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .limit(1);

      if (error) {
        console.log(`  ❌ Error: ${error.message}`);
        report.inaccessible.push({ table, error: error.message });
        continue;
      }

      // Table is accessible
      report.accessible.push(table);
      
      // Check if it has data
      const { count: totalCount } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (totalCount > 0) {
        console.log(`  ✅ Accessible with ${totalCount} records`);
        report.hasData.push({ table, count: totalCount });
        
        // Show structure if has data
        if (data && data.length > 0) {
          const columns = Object.keys(data[0]);
          console.log(`  📋 Columns: ${columns.join(', ')}`);
          
          // Show sample for campaigns
          if (table === 'campaigns') {
            console.log('  📄 Sample record:');
            console.log(JSON.stringify(data[0], null, 2).split('\n').map(line => '    ' + line).join('\n'));
          }
        }
      } else {
        console.log(`  ⚠️ Accessible but empty`);
        report.empty.push(table);
      }

    } catch (err) {
      console.log(`  ❌ Unexpected error: ${err.message}`);
      report.inaccessible.push({ table, error: err.message });
    }
  }

  // Test specific operations
  console.log('\n🔧 Testing Specific Operations:');
  console.log('=' .repeat(40));

  // Test INSERT on campaigns
  const testCampaign = {
    campaign_name: `Schema Test ${Date.now()}`,
    email: 'schema-test@example.com',
    website: 'https://schema-test.com',
    wallet_address: `schema-test-${Date.now()}`
  };

  const { data: inserted, error: insertError } = await supabase
    .from('campaigns')
    .insert(testCampaign)
    .select()
    .single();

  if (inserted && !insertError) {
    console.log(`✅ INSERT test successful: ${inserted.campaign_name}`);
    
    // Clean up
    await supabase.from('campaigns').delete().eq('id', inserted.id);
    console.log(`🧹 Cleaned up test record`);
  } else {
    console.log(`❌ INSERT test failed: ${insertError?.message || 'Unknown error'}`);
  }

  // Test if contributions table is accessible now
  if (report.accessible.includes('contributions')) {
    console.log('\n🔗 Testing contributions table access:');
    const { data: contribData, error: contribError } = await supabase
      .from('contributions')
      .select('*')
      .limit(1);
    
    if (!contribError) {
      console.log('✅ Contributions table is accessible');
    } else {
      console.log(`❌ Contributions error: ${contribError.message}`);
    }
  }

  // Test if kyc_data table is accessible now
  if (report.accessible.includes('kyc_data')) {
    console.log('\n🔐 Testing kyc_data table access:');
    const { data: kycData, error: kycError } = await supabase
      .from('kyc_data')
      .select('*')
      .limit(1);
    
    if (!kycError) {
      console.log('✅ KYC data table is accessible');
    } else {
      console.log(`❌ KYC data error: ${kycError.message}`);
    }
  }

  console.log('\n📊 SUMMARY:');
  console.log(`  Accessible tables: ${report.accessible.length}`);
  console.log(`  Inaccessible tables: ${report.inaccessible.length}`);
  console.log(`  Tables with data: ${report.hasData.length}`);
  console.log(`  Empty tables: ${report.empty.length}`);

  return report;
}

inspectNewDatabase().catch(console.error);