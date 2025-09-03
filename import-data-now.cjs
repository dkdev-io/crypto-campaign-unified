const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function importCSVData() {
  console.log('🚀 IMPORTING CSV DATA TO MAKE IT VISIBLE\n');

  try {
    // Get test campaign
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('id, campaign_name')
      .eq('email', 'test@dkdev.io')
      .limit(1);

    if (!campaigns || campaigns.length === 0) {
      throw new Error('No test@dkdev.io campaign found');
    }

    const testCampaignId = campaigns[0].id;
    console.log('✅ Test campaign found:', campaigns[0].campaign_name);
    console.log('   Campaign ID:', testCampaignId);

    // Parse donors CSV
    const donorsPath = './scripts/exported-data/campaign_donors.csv';
    const content = fs.readFileSync(donorsPath, 'utf8');
    const lines = content.trim().split('\n');
    const headers = lines[0].split(',');
    
    const donors = lines.slice(1).map(line => {
      const values = line.split(',');
      const record = {};
      headers.forEach((header, index) => {
        record[header.trim()] = values[index] ? values[index].trim() : null;
      });
      return record;
    });

    console.log('📄 Parsed', donors.length, 'donor records');

    // Import to contributions table
    console.log('📥 Importing to contributions table...');
    let imported = 0;

    for (let i = 0; i < donors.length; i += 25) {
      const batch = donors.slice(i, i + 25);
      
      const contributions = batch.map(donor => ({
        campaign_id: testCampaignId,
        amount: parseFloat(donor.contribution_amount) || 100,
        donor_name: `${donor.first_name} ${donor.last_name}`,
        donor_email: `${donor.unique_id}@test.local`,
        status: 'completed',
        created_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('contributions')
        .insert(contributions);

      if (!error) {
        imported += batch.length;
        console.log(`✅ Batch ${Math.floor(i / 25) + 1}: ${batch.length} records`);
      } else {
        console.log(`❌ Batch ${Math.floor(i / 25) + 1} failed:`, error.message);
      }
    }

    // Verify
    const { count } = await supabase
      .from('contributions')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', testCampaignId);

    console.log('\n✅ IMPORT COMPLETED!');
    console.log('📊 Total contributions:', count);
    console.log('🎯 Data now visible in:');
    console.log('   - Admin panel');
    console.log('   - test@dkdev.io account');

  } catch (error) {
    console.error('❌ Import failed:', error);
  }
}

importCSVData();