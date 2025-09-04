const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function importCSVToContributions() {
  console.log('🚀 Importing CSV Data to Contributions Table\n');
  console.log('This will make all donor data visible in admin panel and test@dkdev.io account\n');

  try {
    // Get test campaign
    console.log('🔍 Getting test@dkdev.io campaign...');
    const { data: campaigns, error: campaignError } = await supabase
      .from('campaigns')
      .select('id, campaign_name')
      .eq('email', 'test@dkdev.io')
      .limit(1);

    if (campaignError || !campaigns || campaigns.length === 0) {
      throw new Error('No test@dkdev.io campaign found');
    }

    const testCampaignId = campaigns[0].id;
    console.log('✅ Found test campaign:', campaigns[0].campaign_name);
    console.log('   Campaign ID:', testCampaignId);

    // Parse CSV files
    console.log('\n📄 Parsing CSV files...');

    // Parse donors CSV
    const donorsPath = path.join(__dirname, 'exported-data', 'campaign_donors.csv');
    const donorsContent = fs.readFileSync(donorsPath, 'utf8');
    const donorLines = donorsContent.trim().split('\n');
    const donorHeaders = donorLines[0].split(',');

    const donors = donorLines.slice(1).map((line) => {
      const values = line.split(',');
      const record = {};
      donorHeaders.forEach((header, index) => {
        record[header.trim()] = values[index] ? values[index].trim() : null;
      });
      return record;
    });

    console.log('✅ Parsed', donors.length, 'donor records');

    // Clear existing contributions for test campaign
    console.log('\n🧹 Clearing existing test contributions...');
    const { error: deleteError } = await supabase
      .from('contributions')
      .delete()
      .eq('campaign_id', testCampaignId);

    if (deleteError) {
      console.log('⚠️ Could not clear existing contributions:', deleteError.message);
    } else {
      console.log('✅ Cleared existing contributions');
    }

    // Import donors as contributions
    console.log('\n📥 Importing donors as contributions...');
    let imported = 0;
    const batchSize = 50;

    for (let i = 0; i < donors.length; i += batchSize) {
      const batch = donors.slice(i, i + batchSize);

      const contributions = batch.map((donor) => ({
        campaign_id: testCampaignId,
        amount: parseFloat(donor.contribution_amount) || Math.random() * 500 + 25,
        donor_name: `${donor.first_name} ${donor.last_name}`,
        donor_email: `${donor.unique_id}@donor.test`,
        donor_wallet: donor.wallet,
        donor_address: `${donor.address_line_1}, ${donor.city}, ${donor.state} ${donor.zip}`,
        donor_phone: donor.phone,
        donor_employer: donor.employer,
        donor_occupation: donor.occupation,
        transaction_id: `tx_${donor.unique_id}_${Date.now()}`,
        status: 'completed',
        created_at: new Date(donor.contribution_date || Date.now()).toISOString(),
      }));

      const { data, error } = await supabase.from('contributions').insert(contributions);

      if (error) {
        console.error(`❌ Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error.message);
        // Try with minimal fields
        const minimalContributions = batch.map((donor) => ({
          campaign_id: testCampaignId,
          amount: parseFloat(donor.contribution_amount) || Math.random() * 500 + 25,
          donor_name: `${donor.first_name} ${donor.last_name}`,
          donor_email: `${donor.unique_id}@donor.test`,
          created_at: new Date().toISOString(),
        }));

        const { error: retryError } = await supabase
          .from('contributions')
          .insert(minimalContributions);

        if (retryError) {
          console.error('❌ Retry failed:', retryError.message);
        } else {
          imported += batch.length;
          console.log(
            `✅ Imported batch ${Math.floor(i / batchSize) + 1} (minimal): ${batch.length} records`
          );
        }
      } else {
        imported += batch.length;
        console.log(`✅ Imported batch ${Math.floor(i / batchSize) + 1}: ${batch.length} records`);
      }
    }

    // Verify import
    console.log('\n🔍 Verifying import...');
    const { count, error: countError } = await supabase
      .from('contributions')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', testCampaignId);

    if (countError) {
      console.error('Error verifying import:', countError);
    } else {
      console.log(`📊 Total contributions in database: ${count}`);
    }

    // Show sample data
    const { data: sampleData } = await supabase
      .from('contributions')
      .select('donor_name, amount, donor_email, created_at')
      .eq('campaign_id', testCampaignId)
      .limit(5);

    if (sampleData && sampleData.length > 0) {
      console.log('\n📋 Sample imported data:');
      sampleData.forEach((contrib, index) => {
        console.log(
          `${index + 1}. ${contrib.donor_name} - $${contrib.amount} (${contrib.donor_email})`
        );
      });
    }

    console.log('\n✅ CSV IMPORT COMPLETED SUCCESSFULLY!');
    console.log('📊 Import Summary:');
    console.log(`   - Records imported: ${imported}`);
    console.log(`   - Campaign ID: ${testCampaignId}`);
    console.log('   - Account: test@dkdev.io');
    console.log('\n🎯 Data is now accessible via:');
    console.log('   - Admin panel (contributions table)');
    console.log('   - test@dkdev.io account dashboard');
    console.log('   - Frontend application');
  } catch (error) {
    console.error('❌ Import failed:', error);
  }
}

// Run import
importCSVToContributions();
