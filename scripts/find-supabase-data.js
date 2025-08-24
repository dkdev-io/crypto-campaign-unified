#!/usr/bin/env node

/**
 * Supabase Data Discovery Agent
 * Searches for prospects, donors, and KYC data in Supabase database
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://kmepcdsklnnxokoimvzo.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDYyNDgsImV4cCI6MjA3MTEyMjI0OH0.7fa_fy4aWlz0PZvwC90X1r_6UMHzBujnN0fIngva1iI';

class SupabaseDataFinder {
  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    this.findings = [];
  }

  async searchAllTables() {
    console.log('🔍 Searching Supabase for Campaign Data...\n');
    
    // List of possible table names to check
    const tableNames = [
      'prospects',
      'donors', 
      'kyc',
      'campaign_prospects',
      'campaign_donors',
      'donor_prospects',
      'test_prospects',
      'test_donors',
      'form_submissions',
      'contributions',
      'user_data',
      'people',
      'contacts',
      'campaign_data'
    ];

    for (const tableName of tableNames) {
      await this.checkTable(tableName);
    }

    this.generateReport();
  }

  async checkTable(tableName) {
    try {
      console.log(`🔍 Checking table: ${tableName}`);
      
      // Try to get schema info first
      const { data, error, count } = await this.supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        if (error.message.includes('does not exist')) {
          console.log(`   ❌ Table '${tableName}' does not exist`);
        } else {
          console.log(`   ⚠️  Table '${tableName}': ${error.message}`);
        }
        return;
      }

      console.log(`   ✅ Table '${tableName}' exists with ${count} records`);

      if (count > 0) {
        // Get sample data to analyze structure
        const { data: sampleData, error: sampleError } = await this.supabase
          .from(tableName)
          .select('*')
          .limit(3);

        if (sampleData && sampleData.length > 0) {
          const sample = sampleData[0];
          const fields = Object.keys(sample);
          
          // Check if this looks like our campaign data
          const isProspectLike = this.hasProspectFields(fields);
          const isDonorLike = this.hasDonorFields(fields);
          const isKycLike = this.hasKycFields(fields);

          const finding = {
            tableName,
            recordCount: count,
            fields,
            sampleData: sampleData.slice(0, 2), // First 2 records
            analysis: {
              isProspectLike,
              isDonorLike, 
              isKycLike,
              hasUniqueIds: fields.includes('unique_id'),
              hasWalletAddress: fields.includes('wallet_address'),
              hasNames: fields.includes('first_name') && fields.includes('last_name'),
              hasEmployment: fields.includes('employer') && fields.includes('occupation'),
              hasContributionAmount: fields.includes('contribution_amount') || fields.includes('amount'),
              hasKycStatus: fields.includes('kyc_status')
            }
          };

          this.findings.push(finding);

          console.log(`   📊 Sample fields: ${fields.slice(0, 8).join(', ')}${fields.length > 8 ? '...' : ''}`);
          
          if (isProspectLike) console.log(`   🎯 MATCHES PROSPECT PATTERN`);
          if (isDonorLike) console.log(`   💰 MATCHES DONOR PATTERN`);
          if (isKycLike) console.log(`   ✋ MATCHES KYC PATTERN`);
        }
      }

    } catch (error) {
      console.log(`   💥 Error checking '${tableName}': ${error.message}`);
    }
  }

  hasProspectFields(fields) {
    const requiredFields = ['first_name', 'last_name', 'phone_number', 'employer', 'occupation', 'city', 'state'];
    return requiredFields.every(field => fields.includes(field));
  }

  hasDonorFields(fields) {
    const requiredFields = ['first_name', 'last_name', 'contribution_amount'];
    const optionalFields = ['wallet_address', 'transaction_hash', 'amount'];
    
    const hasRequired = requiredFields.every(field => fields.includes(field));
    const hasOptional = optionalFields.some(field => fields.includes(field));
    
    return hasRequired || hasOptional;
  }

  hasKycFields(fields) {
    return fields.includes('kyc_status') || 
           fields.includes('first_name') && fields.includes('last_name') && fields.length <= 5;
  }

  async countDonorProspects() {
    console.log('\n🔍 Searching for Donor-Prospect Overlap...\n');

    const prospectTables = this.findings.filter(f => f.analysis.isProspectLike);
    const donorTables = this.findings.filter(f => f.analysis.isDonorLike);

    if (prospectTables.length === 0 || donorTables.length === 0) {
      console.log('❌ Cannot find both prospect and donor tables to calculate overlap');
      return;
    }

    for (const prospectTable of prospectTables) {
      for (const donorTable of donorTables) {
        await this.calculateOverlap(prospectTable.tableName, donorTable.tableName);
      }
    }
  }

  async calculateOverlap(prospectTableName, donorTableName) {
    try {
      console.log(`🔗 Checking overlap between '${prospectTableName}' and '${donorTableName}'`);

      // Get all unique IDs from prospects
      const { data: prospects, error: pError } = await this.supabase
        .from(prospectTableName)
        .select('unique_id, first_name, last_name');

      if (pError) {
        console.log(`   ❌ Error loading prospects: ${pError.message}`);
        return;
      }

      // Get all unique IDs from donors
      const { data: donors, error: dError } = await this.supabase
        .from(donorTableName)
        .select('unique_id, first_name, last_name');

      if (dError) {
        console.log(`   ❌ Error loading donors: ${dError.message}`);
        return;
      }

      // Calculate overlap
      const prospectIds = new Set(prospects.map(p => p.unique_id));
      const donorIds = new Set(donors.map(d => d.unique_id));
      
      const overlappingIds = [...donorIds].filter(id => prospectIds.has(id));
      
      console.log(`   📊 Prospects: ${prospects.length}`);
      console.log(`   📊 Unique Donors: ${donorIds.size}`);
      console.log(`   🎯 Donor-Prospects: ${overlappingIds.length}`);

      if (overlappingIds.length > 0) {
        console.log(`   📝 First 5 overlapping IDs: ${overlappingIds.slice(0, 5).join(', ')}`);
        
        // Show names of overlapping people
        const overlappingPeople = prospects.filter(p => overlappingIds.includes(p.unique_id));
        console.log(`   👥 Examples:`);
        overlappingPeople.slice(0, 3).forEach(person => {
          console.log(`      - ${person.first_name} ${person.last_name} (${person.unique_id})`);
        });
      }

    } catch (error) {
      console.log(`   💥 Error calculating overlap: ${error.message}`);
    }
  }

  async analyzeContributions(donorTableName) {
    try {
      console.log(`\n💰 Analyzing Contributions in '${donorTableName}'`);

      const { data: donors, error } = await this.supabase
        .from(donorTableName)
        .select('unique_id, contribution_amount, amount');

      if (error) {
        console.log(`   ❌ Error: ${error.message}`);
        return;
      }

      const amountField = donors[0].contribution_amount ? 'contribution_amount' : 'amount';
      const amounts = donors.map(d => parseFloat(d[amountField])).filter(a => !isNaN(a));

      if (amounts.length === 0) {
        console.log(`   ⚠️  No valid contribution amounts found`);
        return;
      }

      const total = amounts.reduce((sum, amt) => sum + amt, 0);
      const max = Math.max(...amounts);
      const min = Math.min(...amounts);
      const avg = total / amounts.length;

      // Count special categories
      const exactly3300 = amounts.filter(a => a === 3300).length;
      const under50 = amounts.filter(a => a < 50).length;
      const over3299 = amounts.filter(a => a > 3299).length;

      console.log(`   📊 Total Contributions: ${donors.length}`);
      console.log(`   💰 Total Amount: $${total.toFixed(2)}`);
      console.log(`   💰 Average: $${avg.toFixed(2)}`);
      console.log(`   💰 Range: $${min.toFixed(2)} - $${max.toFixed(2)}`);
      console.log(`   🎯 Exactly $3,300: ${exactly3300}`);
      console.log(`   🎯 Under $50: ${under50}`);
      console.log(`   🎯 Over $3,299: ${over3299}`);

    } catch (error) {
      console.log(`   💥 Error analyzing contributions: ${error.message}`);
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📋 SUPABASE DATA DISCOVERY REPORT');
    console.log('='.repeat(60));

    if (this.findings.length === 0) {
      console.log('❌ No relevant campaign data tables found');
      return;
    }

    console.log(`\n✅ Found ${this.findings.length} potential data tables:\n`);

    for (const finding of this.findings) {
      console.log(`📊 Table: ${finding.tableName}`);
      console.log(`   Records: ${finding.recordCount}`);
      console.log(`   Fields: ${finding.fields.length} (${finding.fields.slice(0, 6).join(', ')}...)`);
      
      const analysis = finding.analysis;
      if (analysis.isProspectLike) console.log(`   🎯 PROSPECT DATA DETECTED`);
      if (analysis.isDonorLike) console.log(`   💰 DONOR DATA DETECTED`);
      if (analysis.isKycLike) console.log(`   ✋ KYC DATA DETECTED`);
      
      console.log('');
    }

    // Run additional analysis
    this.runAdditionalAnalysis();
  }

  async runAdditionalAnalysis() {
    await this.countDonorProspects();
    
    // Analyze contributions for donor-like tables
    const donorTables = this.findings.filter(f => f.analysis.isDonorLike);
    for (const table of donorTables) {
      await this.analyzeContributions(table.tableName);
    }
  }
}

// CLI execution
async function main() {
  const finder = new SupabaseDataFinder();
  
  try {
    await finder.searchAllTables();
  } catch (error) {
    console.error('💥 Discovery failed:', error);
  }
}

if (require.main === module) {
  main();
}

module.exports = SupabaseDataFinder;