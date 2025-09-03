const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

class CSVDataImporter {
  constructor() {
    this.testCampaignId = null;
    this.importedCounts = {
      donors: 0,
      prospects: 0,
      kyc_verifications: 0
    };
  }

  // Parse CSV file to JSON
  parseCSV(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.trim().split('\n');
    const headers = lines[0].split(',');
    
    return lines.slice(1).map(line => {
      const values = line.split(',');
      const record = {};
      headers.forEach((header, index) => {
        record[header.trim()] = values[index] ? values[index].trim() : null;
      });
      return record;
    });
  }

  // Get or create test campaign
  async getTestCampaign() {
    console.log('🔍 Getting test@dkdev.io campaign...');
    
    const { data: campaigns, error } = await supabase
      .from('campaigns')
      .select('id, campaign_name')
      .eq('email', 'test@dkdev.io')
      .limit(1);

    if (error) {
      console.error('Error fetching campaigns:', error);
      throw error;
    }

    if (campaigns && campaigns.length > 0) {
      this.testCampaignId = campaigns[0].id;
      console.log('✅ Found test campaign:', campaigns[0].campaign_name);
      console.log('   Campaign ID:', this.testCampaignId);
      return this.testCampaignId;
    }

    throw new Error('No test@dkdev.io campaign found');
  }

  // Import donors data
  async importDonors() {
    console.log('\n📥 Importing campaign donors...');
    const donorsPath = path.join(__dirname, 'exported-data', 'campaign_donors.csv');
    const donors = this.parseCSV(donorsPath);

    console.log('Found', donors.length, 'donor records');

    // Process in batches of 50
    const batchSize = 50;
    for (let i = 0; i < donors.length; i += batchSize) {
      const batch = donors.slice(i, i + batchSize);
      
      const processedBatch = batch.map(donor => ({
        campaign_id: this.testCampaignId,
        unique_id: donor.unique_id,
        first_name: donor.first_name,
        last_name: donor.last_name,
        email: `${donor.unique_id}@donor.test`, // Generate test emails
        address_line_1: donor.address_line_1,
        address_line_2: donor.address_line_2,
        city: donor.city,
        state: donor.state,
        zip: donor.zip,
        phone: donor.phone,
        employer: donor.employer,
        occupation: donor.occupation,
        wallet_address: donor.wallet,
        contribution_amount: parseFloat(donor.contribution_amount) || 0,
        contribution_date: donor.contribution_date,
        created_at: new Date().toISOString()
      }));

      const { data, error } = await supabase
        .from('donors')
        .insert(processedBatch);

      if (error) {
        console.error('Error inserting donor batch:', error);
        throw error;
      }

      this.importedCounts.donors += batch.length;
      console.log(`✅ Imported donor batch ${i / batchSize + 1}: ${batch.length} records`);
    }
  }

  // Import prospects data
  async importProspects() {
    console.log('\n📥 Importing campaign prospects...');
    const prospectsPath = path.join(__dirname, 'exported-data', 'campaign_prospects.csv');
    const prospects = this.parseCSV(prospectsPath);

    console.log('Found', prospects.length, 'prospect records');

    const batchSize = 50;
    for (let i = 0; i < prospects.length; i += batchSize) {
      const batch = prospects.slice(i, i + batchSize);
      
      const processedBatch = batch.map(prospect => ({
        campaign_id: this.testCampaignId,
        unique_id: prospect.unique_id,
        first_name: prospect.first_name,
        last_name: prospect.last_name,
        email: `${prospect.unique_id}@prospect.test`,
        address_line_1: prospect.address_line_1,
        address_line_2: prospect.address_line_2,
        city: prospect.city,
        state: prospect.state,
        zip: prospect.zip,
        phone: prospect.phone,
        employer: prospect.employer,
        occupation: prospect.occupation,
        wallet_address: prospect.wallet,
        created_at: new Date().toISOString()
      }));

      const { data, error } = await supabase
        .from('prospects')
        .insert(processedBatch);

      if (error) {
        console.error('Error inserting prospect batch:', error);
        throw error;
      }

      this.importedCounts.prospects += batch.length;
      console.log(`✅ Imported prospect batch ${i / batchSize + 1}: ${batch.length} records`);
    }
  }

  // Import KYC data
  async importKYC() {
    console.log('\n📥 Importing KYC verifications...');
    const kycPath = path.join(__dirname, 'exported-data', 'kyc.csv');
    const kycData = this.parseCSV(kycPath);

    console.log('Found', kycData.length, 'KYC records');

    const batchSize = 50;
    for (let i = 0; i < kycData.length; i += batchSize) {
      const batch = kycData.slice(i, i + batchSize);
      
      const processedBatch = batch.map(kyc => ({
        campaign_id: this.testCampaignId,
        unique_id: kyc.unique_id,
        first_name: kyc.first_name,
        last_name: kyc.last_name,
        kyc_passed: kyc.kyc_passed === '1' || kyc.kyc_passed === 'true',
        verified_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      }));

      const { data, error } = await supabase
        .from('kyc_verifications')
        .insert(processedBatch);

      if (error) {
        console.error('Error inserting KYC batch:', error);
        throw error;
      }

      this.importedCounts.kyc_verifications += batch.length;
      console.log(`✅ Imported KYC batch ${i / batchSize + 1}: ${batch.length} records`);
    }
  }

  // Verify imported data
  async verifyImport() {
    console.log('\n🔍 Verifying imported data...');

    for (const [table, expectedCount] of Object.entries(this.importedCounts)) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', this.testCampaignId);

      if (error) {
        console.error(`Error verifying ${table}:`, error);
        continue;
      }

      console.log(`📊 ${table}: ${count} records (expected: ${expectedCount})`);
      
      if (count === expectedCount) {
        console.log(`✅ ${table} import successful`);
      } else {
        console.log(`❌ ${table} import incomplete`);
      }
    }
  }

  // Main import process
  async import() {
    try {
      console.log('🚀 Starting CSV Data Import Process\n');
      console.log('This will import 515 records into 3 tables linked to test@dkdev.io\n');

      // Get test campaign
      await this.getTestCampaign();

      // Import all data
      await this.importDonors();
      await this.importProspects(); 
      await this.importKYC();

      // Verify import
      await this.verifyImport();

      console.log('\n✅ CSV DATA IMPORT COMPLETED SUCCESSFULLY!');
      console.log('📊 Import Summary:');
      console.log(`   - Donors: ${this.importedCounts.donors} records`);
      console.log(`   - Prospects: ${this.importedCounts.prospects} records`);
      console.log(`   - KYC Verifications: ${this.importedCounts.kyc_verifications} records`);
      console.log(`   - Total: ${Object.values(this.importedCounts).reduce((a, b) => a + b, 0)} records`);
      console.log(`   - Linked to Campaign: ${this.testCampaignId}`);
      console.log('   - Account: test@dkdev.io');
      
      console.log('\n🎯 Next Steps:');
      console.log('   - Data is now visible in admin panel');
      console.log('   - Data is linked to test@dkdev.io account');
      console.log('   - Access via frontend application');

    } catch (error) {
      console.error('❌ Import failed:', error);
      throw error;
    }
  }
}

// Run import
const importer = new CSVDataImporter();
importer.import().catch(console.error);