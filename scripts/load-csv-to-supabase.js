const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Load environment variables
require('dotenv').config({ path: '../.env' });

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://owjvgdzmmlrdtpjdxgka.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93anZnZHptbWxyZHRwamR4Z2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY4NTI4MTksImV4cCI6MjA0MjQyODgxOX0.dHyNtZfNzuaeBdrZiDzH4eMGYP4-FVWQd7F1Xf3VKz0';

class SupabaseDataLoader {
  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  // Helper function to read CSV file
  async readCSV(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', (error) => reject(error));
    });
  }

  // Load prospects data
  async loadProspects() {
    try {
      const prospectsData = await this.readCSV(
        '/Users/Danallovertheplace/crypto-campaign-unified/data/prospects.csv'
      );

      // Transform data to match Supabase schema
      const transformedData = prospectsData.map((row) => ({
        unique_id: row.unique_id,
        first_name: row.first_name,
        last_name: row.last_name,
        address_line_1: row.address_line_1,
        address_line_2: row.address_line_2 || null,
        city: row.city,
        state: row.state,
        zip: row.zip,
        phone: row.phone_number,
        employer: row.employer,
        occupation: row.occupation,
        wallet: row.wallet_address,
      }));

      const { data, error } = await this.supabase
        .from('campaign_prospects')
        .insert(transformedData);

      if (error) throw error;
      console.log(`✅ Successfully loaded ${transformedData.length} prospects`);
      return transformedData.length;
    } catch (error) {
      console.error('❌ Error loading prospects:', error);
      throw error;
    }
  }

  // Load donors data
  async loadDonors() {
    try {
      const donorsData = await this.readCSV(
        '/Users/Danallovertheplace/crypto-campaign-unified/data/donors.csv'
      );

      // Transform data to match Supabase schema
      const transformedData = donorsData.map((row) => ({
        unique_id: row.unique_id,
        first_name: row.first_name,
        last_name: row.last_name,
        address_line_1: row.address_line_1,
        address_line_2: row.address_line_2 || null,
        city: row.city,
        state: row.state,
        zip: row.zip,
        phone: row.phone_number,
        employer: row.employer,
        occupation: row.occupation,
        wallet: row.wallet_address,
        contribution_amount: parseFloat(row.contribution_amount),
        contribution_date: row.contribution_date,
      }));

      const { data, error } = await this.supabase.from('campaign_donors').insert(transformedData);

      if (error) throw error;
      console.log(`✅ Successfully loaded ${transformedData.length} donor contributions`);
      return transformedData.length;
    } catch (error) {
      console.error('❌ Error loading donors:', error);
      throw error;
    }
  }

  // Load KYC data
  async loadKYC() {
    try {
      const kycData = await this.readCSV(
        '/Users/Danallovertheplace/crypto-campaign-unified/data/kyc.csv'
      );

      // Transform data to match Supabase schema
      const transformedData = kycData.map((row) => ({
        unique_id: row.unique_id,
        first_name: row.first_name,
        last_name: row.last_name,
        kyc_passed: row.kyc_passed === 'Yes' || row.kyc_passed === 'yes' || row.kyc_passed === true,
      }));

      const { data, error } = await this.supabase.from('kyc').insert(transformedData);

      if (error) throw error;
      console.log(`✅ Successfully loaded ${transformedData.length} KYC records`);
      return transformedData.length;
    } catch (error) {
      console.error('❌ Error loading KYC:', error);
      throw error;
    }
  }

  // Verify data counts after loading
  async verifyDataCounts() {
    const tables = ['campaign_prospects', 'campaign_donors', 'kyc'];
    const results = {};

    for (const table of tables) {
      try {
        const { data, error, count } = await this.supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) throw error;
        results[table] = count;
      } catch (error) {
        console.error(`❌ Error checking ${table}:`, error);
        results[table] = 'Error';
      }
    }

    return results;
  }

  // Check for overlapping donor-prospects (should be 38)
  async checkDonorProspectOverlap() {
    try {
      // Get unique donor IDs
      const { data: donorIds, error: donorError } = await this.supabase
        .from('campaign_donors')
        .select('unique_id');

      if (donorError) throw donorError;

      const uniqueDonorIds = [...new Set(donorIds.map((d) => d.unique_id))];

      // Check how many of these donor IDs exist in prospects
      const { data: overlaps, error: overlapError } = await this.supabase
        .from('campaign_prospects')
        .select('unique_id')
        .in('unique_id', uniqueDonorIds);

      if (overlapError) throw overlapError;

      return overlaps.length;
    } catch (error) {
      console.error('❌ Error checking overlaps:', error);
      throw error;
    }
  }

  // Main execution function
  async loadAllData() {
    console.log('🚀 Starting data loading process...\n');

    try {
      // Load all data
      const prospectsCount = await this.loadProspects();
      const donorsCount = await this.loadDonors();
      const kycCount = await this.loadKYC();

      // Verify counts
      await this.verifyDataCounts();

      // Check overlaps
      await this.checkDonorProspectOverlap();

      console.log('\n✅ Data loading completed successfully!');
      console.log(
        `📈 Summary: ${prospectsCount} prospects, ${donorsCount} donations, ${kycCount} KYC records`
      );
    } catch (error) {
      console.error('\n❌ Data loading failed:', error);
      throw error;
    }
  }
}

// Execute the data loading
if (require.main === module) {
  const loader = new SupabaseDataLoader();
  loader
    .loadAllData()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}

module.exports = SupabaseDataLoader;
