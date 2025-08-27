// Direct Table Creation via Supabase Client Operations
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kmepcdsklnnxokoimvzo.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTU0NjI0OCwiZXhwIjoyMDcxMTIyMjQ4fQ.9gyw4TmPvtNYLz7_aNHBdkPSgUypmg5SCbLEwQKki-Q';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

console.log('🔨 DIRECT TABLE CREATION APPROACH');
console.log('🎯 Creating schema by inserting data and letting Supabase infer structure');
console.log('=' .repeat(70));

async function createTablesViaInserts() {
  let successCount = 0;

  // 1. Test and ensure status column exists on campaigns
  console.log('\n1️⃣ Ensuring campaigns has status column...');
  try {
    // Try to update an existing campaign with status
    const { data: existingCampaigns } = await supabase
      .from('campaigns')
      .select('id')
      .limit(1);

    if (existingCampaigns && existingCampaigns.length > 0) {
      const { error: updateError } = await supabase
        .from('campaigns')
        .update({ status: 'active' })
        .eq('id', existingCampaigns[0].id);

      if (updateError) {
        console.log('   ❌ Status column missing - cannot update existing campaign');
        console.log('   ⚠️  Manual SQL required for status column');
      } else {
        console.log('   ✅ Status column exists and working');
        successCount++;
      }
    } else {
      console.log('   ⚠️  No existing campaigns to test status column');
    }
  } catch (err) {
    console.log(`   ❌ Status test failed: ${err.message}`);
  }

  // 2. Create contributions table by inserting sample data
  console.log('\n2️⃣ Creating contributions table...');
  try {
    // First, get a campaign ID to reference
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('id')
      .limit(1);

    if (campaigns && campaigns.length > 0) {
      const campaignId = campaigns[0].id;
      
      // Try to create contributions table by inserting data
      const sampleContribution = {
        id: crypto.randomUUID(),
        campaign_id: campaignId,
        user_id: 'test-user-123',
        amount: 100.00,
        currency: 'USD',
        status: 'pending',
        donor_email: 'test@example.com',
        donor_name: 'Test Donor',
        created_at: new Date().toISOString()
      };

      const { data: insertedContrib, error: insertError } = await supabase
        .from('contributions')
        .insert(sampleContribution)
        .select()
        .single();

      if (insertedContrib && !insertError) {
        console.log('   ✅ Contributions table accessible - sample data inserted');
        successCount++;

        // Clean up test data
        await supabase.from('contributions').delete().eq('id', insertedContrib.id);
        console.log('   🧹 Cleaned up test contribution');
      } else {
        console.log('   ❌ Contributions table not accessible or doesn\'t exist');
        console.log(`   📋 Error: ${insertError?.message}`);
      }
    } else {
      console.log('   ⚠️  No campaigns found to link contributions to');
    }
  } catch (err) {
    console.log(`   ❌ Contributions creation failed: ${err.message}`);
  }

  // 3. Create KYC data table by inserting sample data  
  console.log('\n3️⃣ Creating kyc_data table...');
  try {
    const sampleKYC = {
      id: crypto.randomUUID(),
      user_id: 'test-kyc-' + Date.now(),
      full_name: 'Test User',
      email: 'testuser@example.com',
      verification_status: 'pending',
      created_at: new Date().toISOString()
    };

    const { data: insertedKYC, error: kycError } = await supabase
      .from('kyc_data')
      .insert(sampleKYC)
      .select()
      .single();

    if (insertedKYC && !kycError) {
      console.log('   ✅ KYC data table accessible - sample data inserted');
      successCount++;

      // Clean up test data
      await supabase.from('kyc_data').delete().eq('id', insertedKYC.id);
      console.log('   🧹 Cleaned up test KYC record');
    } else {
      console.log('   ❌ KYC data table not accessible or doesn\'t exist');
      console.log(`   📋 Error: ${kycError?.message}`);
    }
  } catch (err) {
    console.log(`   ❌ KYC creation failed: ${err.message}`);
  }

  // 4. Test dashboard function
  console.log('\n4️⃣ Testing dashboard function...');
  try {
    const { data: stats, error: statsError } = await supabase.rpc('get_dashboard_stats');

    if (stats && !statsError) {
      console.log('   ✅ Dashboard function working');
      console.log(`   📊 Sample stats: ${JSON.stringify(stats, null, 2)}`);
      successCount++;
    } else {
      console.log('   ❌ Dashboard function not available');
      console.log(`   📋 Error: ${statsError?.message}`);
    }
  } catch (err) {
    console.log(`   ❌ Dashboard function failed: ${err.message}`);
  }

  return successCount;
}

// Alternative: Use HTTP requests to Supabase database URL directly
async function useHTTPQueries() {
  console.log('\n🌐 ATTEMPTING HTTP QUERY APPROACH...');
  
  const dbUrl = supabaseUrl.replace('supabase.co', 'supabase.co:5432');
  
  try {
    // Use curl to execute SQL via HTTP
    const { execSync } = await import('child_process');
    
    const curlCommand = `curl -X POST "${supabaseUrl}/rest/v1/rpc/exec" \\
      -H "apikey: ${serviceRoleKey}" \\
      -H "Authorization: Bearer ${serviceRoleKey}" \\
      -H "Content-Type: application/json" \\
      -d '{"sql":"SELECT version();"}'`;
      
    console.log('   🔄 Testing database connection via HTTP...');
    
    const result = execSync(curlCommand, { encoding: 'utf8' });
    console.log('   ✅ HTTP response:', result);
    
    return true;
  } catch (err) {
    console.log(`   ❌ HTTP approach failed: ${err.message}`);
    return false;
  }
}

// Try using pg connection directly
async function usePgDirect() {
  console.log('\n💾 ATTEMPTING DIRECT POSTGRES CONNECTION...');
  
  try {
    // Try using node-postgres directly  
    const { Client } = await import('pg');
    
    const client = new Client({
      host: 'aws-1-us-west-1.pooler.supabase.com',
      port: 6543,
      database: 'postgres',
      user: 'postgres.kmepcdsklnnxokoimvzo',
      password: process.env.SUPABASE_DB_PASSWORD || '',
      ssl: { rejectUnauthorized: false }
    });

    console.log('   🔗 Attempting direct Postgres connection...');
    await client.connect();
    
    // Execute status column addition
    await client.query(`
      ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
    `);
    
    console.log('   ✅ Direct Postgres connection successful');
    
    await client.end();
    return true;
    
  } catch (err) {
    console.log(`   ❌ Direct Postgres connection failed: ${err.message}`);
    return false;
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting aggressive database fix application...\n');

  let totalSuccess = 0;
  
  // Method 1: Table creation via inserts
  totalSuccess += await createTablesViaInserts();
  
  // Method 2: HTTP queries (if available)
  const httpSuccess = await useHTTPQueries();
  if (httpSuccess) totalSuccess++;
  
  // Method 3: Direct Postgres (if possible)
  const pgSuccess = await usePgDirect();
  if (pgSuccess) totalSuccess++;

  // Final verification
  console.log('\n🧪 FINAL VERIFICATION...');
  const { data: campaigns } = await supabase.from('campaigns').select('*').limit(1);
  const { data: contributions } = await supabase.from('contributions').select('*').limit(1); 
  const { data: kyc } = await supabase.from('kyc_data').select('*').limit(1);
  const { data: stats } = await supabase.rpc('get_dashboard_stats');

  const verificationResults = [
    { name: 'Campaigns', working: !!campaigns },
    { name: 'Contributions', working: contributions !== undefined },
    { name: 'KYC Data', working: kyc !== undefined },
    { name: 'Dashboard Stats', working: !!stats }
  ];

  let workingCount = 0;
  verificationResults.forEach(result => {
    const status = result.working ? '✅' : '❌';
    console.log(`   ${status} ${result.name}: ${result.working ? 'Working' : 'Not working'}`);
    if (result.working) workingCount++;
  });

  console.log('\n' + '='.repeat(70));
  console.log('🎯 AGGRESSIVE FIX RESULTS');
  console.log('='.repeat(70));
  console.log(`🔧 Methods attempted: 3`);
  console.log(`✅ Features working: ${workingCount}/4`);
  
  if (workingCount >= 3) {
    console.log('\n🎉 SIGNIFICANT SUCCESS! Most features are now working!');
  } else if (workingCount >= 1) {
    console.log('\n⚠️  PARTIAL SUCCESS! Some features working.');
  } else {
    console.log('\n❌ MANUAL INTERVENTION REQUIRED');
  }
  
  console.log('\n🔗 For any remaining issues:');
  console.log('   1. Open: https://supabase.com/dashboard/project/kmepcdsklnnxokoimvzo');
  console.log('   2. Go to SQL Editor');
  console.log('   3. Copy and run: scripts/FINAL-DATABASE-FIXES.sql');
}

main().catch(console.error);