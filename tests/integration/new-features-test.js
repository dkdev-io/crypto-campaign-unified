// Test New Features Added by Database Fixes
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kmepcdsklnnxokoimvzo.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDYyNDgsImV4cCI6MjA3MTEyMjI0OH0.7fa_fy4aWlz0PZvwC90X1r_6UMHzBujnN0fIngva1iI';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testNewFeatures() {
  const results = [];

  // TEST 1: Status-based campaign queries (was broken before)
  try {
    const { data: activeCampaigns, error } = await supabase
      .from('campaigns')
      .select('campaign_name, status, max_donation_limit')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(5);

    if (!error && activeCampaigns) {
      activeCampaigns.forEach((c) => {});
      results.push({ test: 'Status-based queries', passed: true, count: activeCampaigns.length });
    } else {
      results.push({ test: 'Status-based queries', passed: false, error: error?.message });
    }
  } catch (err) {
    console.log('   ❌ Error:', err.message);
    results.push({ test: 'Status-based queries', passed: false, error: err.message });
  }

  // TEST 2: Full contributions CRUD workflow
  try {
    // Get a campaign to link to
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('id, campaign_name')
      .limit(1);

    if (campaigns && campaigns.length > 0) {
      const campaign = campaigns[0];

      // CREATE contribution
      const newContrib = {
        campaign_id: campaign.id,
        user_id: 'test-user-' + Date.now(),
        amount: 150.0,
        currency: 'USD',
        status: 'completed',
        donor_email: 'test@example.com',
        donor_name: 'Test Donor',
      };

      const { data: created, error: createError } = await supabase
        .from('contributions')
        .insert(newContrib)
        .select()
        .single();

      if (!createError && created) {
        // READ contribution
        const { data: retrieved, error: readError } = await supabase
          .from('contributions')
          .select('*')
          .eq('id', created.id)
          .single();

        if (!readError && retrieved) {
          // UPDATE contribution
          const { data: updated, error: updateError } = await supabase
            .from('contributions')
            .update({ amount: 200.0, status: 'completed' })
            .eq('id', created.id)
            .select()
            .single();

          if (!updateError && updated) {
            // DELETE contribution
            const { error: deleteError } = await supabase
              .from('contributions')
              .delete()
              .eq('id', created.id);

            if (!deleteError) {
              console.log('   ✅ Deleted contribution successfully');
              results.push({
                test: 'Contributions CRUD',
                passed: true,
                operations: 'CREATE/READ/UPDATE/DELETE all working',
              });
            } else {
              results.push({
                test: 'Contributions CRUD',
                passed: false,
                error: deleteError.message,
              });
            }
          } else {
            results.push({
              test: 'Contributions CRUD',
              passed: false,
              error: updateError?.message,
            });
          }
        } else {
          results.push({ test: 'Contributions CRUD', passed: false, error: readError?.message });
        }
      } else {
        results.push({ test: 'Contributions CRUD', passed: false, error: createError?.message });
      }
    }
  } catch (err) {
    console.log('   ❌ Error:', err.message);
    results.push({ test: 'Contributions CRUD', passed: false, error: err.message });
  }

  // TEST 3: KYC data management
  try {
    // CREATE KYC record
    const newKYC = {
      user_id: 'kyc-test-' + Date.now(),
      full_name: 'John Smith',
      email: 'john.smith@test.com',
      verification_status: 'pending',
    };

    const { data: createdKYC, error: kycCreateError } = await supabase
      .from('kyc_data')
      .insert(newKYC)
      .select()
      .single();

    if (!kycCreateError && createdKYC) {
      // UPDATE KYC status
      const { data: updatedKYC, error: kycUpdateError } = await supabase
        .from('kyc_data')
        .update({ verification_status: 'approved' })
        .eq('id', createdKYC.id)
        .select()
        .single();

      if (!kycUpdateError && updatedKYC) {
        // Query approved KYC records
        const { data: approved, error: queryError } = await supabase
          .from('kyc_data')
          .select('full_name, email, verification_status')
          .eq('verification_status', 'approved');

        if (!queryError && approved) {
          // Cleanup
          await supabase.from('kyc_data').delete().eq('id', createdKYC.id);

          results.push({
            test: 'KYC data management',
            passed: true,
            approved_count: approved.length,
          });
        }
      }
    }
  } catch (err) {
    console.log('   ❌ Error:', err.message);
    results.push({ test: 'KYC data management', passed: false, error: err.message });
  }

  // TEST 4: Table relationships (campaigns with contributions)
  try {
    const { data: campaignsWithContribs, error } = await supabase
      .from('campaigns')
      .select(
        `
        campaign_name,
        status,
        max_donation_limit,
        contributions (
          id,
          amount,
          status,
          donor_name,
          created_at
        )
      `
      )
      .limit(3);

    if (!error && campaignsWithContribs) {
      campaignsWithContribs.forEach((campaign) => {
        const contribCount = campaign.contributions?.length || 0;
      });
      results.push({
        test: 'Table relationships',
        passed: true,
        joined_tables: 'campaigns + contributions',
      });
    } else {
      results.push({ test: 'Table relationships', passed: false, error: error?.message });
    }
  } catch (err) {
    console.log('   ❌ Error:', err.message);
    results.push({ test: 'Table relationships', passed: false, error: err.message });
  }

  // TEST 5: Dashboard analytics (was broken before)
  try {
    const { data: stats, error } = await supabase.rpc('get_dashboard_stats');

    if (!error && stats) {
      results.push({
        test: 'Dashboard analytics',
        passed: true,
        stats: {
          campaigns: stats.total_campaigns,
          contributions: stats.total_contributions,
          raised: stats.total_raised,
        },
      });
    } else {
      results.push({ test: 'Dashboard analytics', passed: false, error: error?.message });
    }
  } catch (err) {
    console.log('   ❌ Error:', err.message);
    results.push({ test: 'Dashboard analytics', passed: false, error: err.message });
  }

  return results;
}

async function main() {
  const results = await testNewFeatures();

  console.log('📊 NEW FEATURES TEST RESULTS');

  const passedTests = results.filter((r) => r.passed).length;
  const totalTests = results.length;

  results.forEach((result) => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.test}: ${result.passed ? 'WORKING' : 'FAILED'}`);
    if (result.error) {
      console.log(`    Error: ${result.error}`);
    }
  });

  if (passedTests === totalTests) {
    console.log('🚀 Database transformation COMPLETE!');
  } else if (passedTests >= totalTests * 0.8) {
    console.log('🎯 MAJOR SUCCESS! Most new features operational.');
  } else {
    console.log('⚠️  Some new features need attention.');
  }
}

main().catch(console.error);
