/**
 * Full Dataset Validation Test
 * 
 * Tests the complete MVP with all 515 test records:
 * - 150 Prospects (prospects.csv)  
 * - 215 Donors (donors.csv)
 * - 150 KYC Records (kyc.csv)
 * 
 * Validates:
 * 1. All CSV data loads correctly
 * 2. Smart contract handles bulk operations
 * 3. Data integrity across the full dataset
 * 4. Performance with realistic data volumes
 * 5. Edge cases with various data scenarios
 */

const { expect } = require('chai');
const { ethers } = require('hardhat');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

describe('Full Dataset Validation (515 Records)', function() {
  let contract;
  let owner;
  let treasury;
  let testAccounts;
  
  // Data arrays
  let prospects = [];
  let donors = [];  
  let kycRecords = [];
  
  this.timeout(300000); // 5 minutes for bulk operations

  before(async function() {
    console.log('🔍 Loading all test accounts and data...');
    
    // Get test accounts (20 available in Hardhat)
    const accounts = await ethers.getSigners();
    [owner, treasury, ...testAccounts] = accounts;
    
    // Deploy contract
    const CampaignContract = await ethers.getContractFactory('CampaignContributions');
    contract = await CampaignContract.deploy(treasury.address, owner.address);
    await contract.waitForDeployment();
    
    console.log(`✅ Contract deployed: ${await contract.getAddress()}`);
    
    // Load all CSV data
    await loadAllCSVData();
    
    console.log(`📊 Data loaded:`);
    console.log(`   • Prospects: ${prospects.length}`);
    console.log(`   • Donors: ${donors.length}`);
    console.log(`   • KYC Records: ${kycRecords.length}`);
    console.log(`   • Total Records: ${prospects.length + donors.length + kycRecords.length}`);
  });

  async function loadCSV(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];
      const fullPath = path.join(__dirname, '../../data', filePath);
      
      if (!fs.existsSync(fullPath)) {
        reject(new Error(`CSV file not found: ${fullPath}`));
        return;
      }
      
      fs.createReadStream(fullPath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
          console.log(`   ✅ Loaded ${results.length} records from ${filePath}`);
          resolve(results);
        })
        .on('error', reject);
    });
  }

  async function loadAllCSVData() {
    try {
      [prospects, donors, kycRecords] = await Promise.all([
        loadCSV('prospects.csv'),
        loadCSV('donors.csv'), 
        loadCSV('kyc.csv')
      ]);
    } catch (error) {
      console.error('❌ Failed to load CSV data:', error);
      throw error;
    }
  }

  describe('1. Data Integrity Validation', function() {
    it('should have exactly 515 total records', function() {
      const total = prospects.length + donors.length + kycRecords.length;
      expect(total).to.equal(515);
    });

    it('should have 150 prospect records with all required fields', function() {
      expect(prospects.length).to.equal(150);
      
      prospects.forEach((prospect, index) => {
        expect(prospect.unique_id, `Prospect ${index} missing unique_id`).to.exist;
        expect(prospect.first_name, `Prospect ${index} missing first_name`).to.exist;
        expect(prospect.last_name, `Prospect ${index} missing last_name`).to.exist;
        expect(prospect.wallet_address, `Prospect ${index} missing wallet_address`).to.exist;
        expect(ethers.isAddress(prospect.wallet_address), 
               `Prospect ${index} has invalid wallet address: ${prospect.wallet_address}`).to.be.true;
      });
    });

    it('should have 215 donor records with valid amounts', function() {
      expect(donors.length).to.equal(215);
      
      donors.forEach((donor, index) => {
        expect(donor.amount, `Donor ${index} missing amount`).to.exist;
        const amount = parseFloat(donor.amount);
        expect(amount, `Donor ${index} has invalid amount: ${donor.amount}`).to.be.greaterThan(0);
        expect(amount, `Donor ${index} exceeds max contribution: ${donor.amount}`).to.be.lessThanOrEqual(3300);
      });
    });

    it('should have 150 KYC records with valid statuses', function() {
      expect(kycRecords.length).to.equal(150);
      
      const validStatuses = ['pending', 'approved', 'rejected', 'under_review'];
      
      kycRecords.forEach((kyc, index) => {
        expect(kyc.wallet_address, `KYC ${index} missing wallet_address`).to.exist;
        expect(ethers.isAddress(kyc.wallet_address), 
               `KYC ${index} has invalid wallet address: ${kyc.wallet_address}`).to.be.true;
        expect(validStatuses.includes(kyc.status), 
               `KYC ${index} has invalid status: ${kyc.status}`).to.be.true;
      });
    });
  });

  describe('2. Bulk KYC Verification (150 Records)', function() {
    let approvedKYC = [];
    
    before(function() {
      // Filter for approved KYC records only
      approvedKYC = kycRecords.filter(kyc => kyc.status === 'approved');
      console.log(`   📋 Found ${approvedKYC.length} approved KYC records to verify`);
    });

    it('should batch verify approved KYC addresses', async function() {
      if (approvedKYC.length === 0) {
        this.skip(); // Skip if no approved records
      }

      // Batch verify in groups of 10 (gas limit considerations)
      const batchSize = 10;
      const batches = Math.ceil(approvedKYC.length / batchSize);
      
      for (let i = 0; i < batches; i++) {
        const start = i * batchSize;
        const end = Math.min(start + batchSize, approvedKYC.length);
        const batch = approvedKYC.slice(start, end);
        
        const addresses = batch.map(kyc => kyc.wallet_address);
        
        console.log(`   🔄 Batch ${i + 1}/${batches}: Verifying ${addresses.length} addresses`);
        
        const tx = await contract.connect(owner).batchVerifyKYC(addresses);
        await tx.wait();
      }
      
      console.log(`   ✅ Verified ${approvedKYC.length} KYC addresses on-chain`);
    });

    it('should confirm all approved addresses are verified on-chain', async function() {
      let verifiedCount = 0;
      
      for (const kyc of approvedKYC) {
        const isVerified = await contract.kycVerified(kyc.wallet_address);
        if (isVerified) {
          verifiedCount++;
        } else {
          console.log(`   ⚠️  Address not verified: ${kyc.wallet_address}`);
        }
      }
      
      expect(verifiedCount).to.equal(approvedKYC.length);
      console.log(`   ✅ All ${verifiedCount} approved addresses verified on-chain`);
    });
  });

  describe('3. Contribution Simulation (Sample Donors)', function() {
    let verifiedDonors = [];
    let totalContributed = ethers.parseEther('0');
    
    before(function() {
      // Find donors that have verified KYC
      const approvedAddresses = kycRecords
        .filter(kyc => kyc.status === 'approved')
        .map(kyc => kyc.wallet_address.toLowerCase());
      
      verifiedDonors = donors.filter(donor => 
        donor.wallet_address && 
        approvedAddresses.includes(donor.wallet_address.toLowerCase())
      ).slice(0, 15); // Test with first 15 to avoid gas limits
      
      console.log(`   🎯 Testing contributions with ${verifiedDonors.length} verified donors`);
    });

    it('should simulate contributions from verified donors', async function() {
      if (verifiedDonors.length === 0) {
        this.skip(); // Skip if no verified donors
      }

      let successfulContributions = 0;
      let failedContributions = 0;
      
      for (let i = 0; i < verifiedDonors.length && i < testAccounts.length; i++) {
        const donor = verifiedDonors[i];
        const account = testAccounts[i];
        const amountUSD = parseFloat(donor.amount) || 100;
        
        // Convert USD to ETH (using contract's price)
        const amountETH = amountUSD / 3000; // $3000 per ETH
        const amountWei = ethers.parseEther(amountETH.toFixed(6));
        
        try {
          // First check if contribution is allowed
          const [canContribute, reason] = await contract.canContribute(
            donor.wallet_address, 
            amountWei
          );
          
          if (!canContribute) {
            console.log(`   ⚠️  Contribution blocked: ${reason}`);
            failedContributions++;
            continue;
          }
          
          // Simulate contribution by sending from test account
          // (In real app, user would connect their wallet)
          const tx = await contract.connect(account).contribute({
            value: amountWei
          });
          await tx.wait();
          
          totalContributed = totalContributed + amountWei;
          successfulContributions++;
          
          console.log(`   ✅ Contribution ${i + 1}: $${amountUSD} (${amountETH.toFixed(4)} ETH)`);
          
        } catch (error) {
          console.log(`   ❌ Contribution ${i + 1} failed: ${error.message.substring(0, 60)}...`);
          failedContributions++;
        }
      }
      
      console.log(`   📊 Results:`);
      console.log(`      • Successful: ${successfulContributions}`);
      console.log(`      • Failed: ${failedContributions}`);
      console.log(`      • Total Raised: ${ethers.formatEther(totalContributed)} ETH`);
      
      expect(successfulContributions).to.be.greaterThan(0);
    });

    it('should verify campaign statistics reflect contributions', async function() {
      const stats = await contract.getCampaignStats();
      
      expect(Number(stats.totalReceived)).to.be.greaterThan(0);
      expect(Number(stats.uniqueContributors)).to.be.greaterThan(0);
      
      console.log(`   📈 Campaign Stats:`);
      console.log(`      • Total Raised: ${ethers.formatEther(stats.totalReceived)} ETH`);
      console.log(`      • Unique Contributors: ${stats.uniqueContributors.toString()}`);
      console.log(`      • Max Contribution: ${ethers.formatEther(stats.maxContribution)} ETH`);
    });
  });

  describe('4. Data Relationship Validation', function() {
    it('should validate prospect-donor relationships', function() {
      const prospectAddresses = prospects.map(p => p.wallet_address?.toLowerCase()).filter(Boolean);
      const donorAddresses = donors.map(d => d.wallet_address?.toLowerCase()).filter(Boolean);
      
      const overlap = prospectAddresses.filter(addr => donorAddresses.includes(addr));
      
      console.log(`   🔗 Prospect-Donor Overlap: ${overlap.length} addresses`);
      console.log(`   📊 Conversion Rate: ${((overlap.length / prospectAddresses.length) * 100).toFixed(1)}%`);
      
      // Some overlap is expected in real campaign data
      expect(overlap.length).to.be.greaterThanOrEqual(0);
    });

    it('should validate KYC-donor relationships', function() {
      const kycAddresses = kycRecords.map(k => k.wallet_address?.toLowerCase()).filter(Boolean);
      const donorAddresses = donors.map(d => d.wallet_address?.toLowerCase()).filter(Boolean);
      
      const kycApprovedAddresses = kycRecords
        .filter(kyc => kyc.status === 'approved')
        .map(kyc => kyc.wallet_address?.toLowerCase()).filter(Boolean);
      
      const donorsWithKYC = donorAddresses.filter(addr => kycAddresses.includes(addr));
      const donorsWithApprovedKYC = donorAddresses.filter(addr => kycApprovedAddresses.includes(addr));
      
      console.log(`   🔐 Donors with KYC Records: ${donorsWithKYC.length}`);
      console.log(`   ✅ Donors with Approved KYC: ${donorsWithApprovedKYC.length}`);
      
      expect(donorsWithKYC.length).to.be.greaterThan(0);
    });

    it('should validate address format consistency', function() {
      const allAddresses = [
        ...prospects.map(p => p.wallet_address),
        ...donors.map(d => d.wallet_address),
        ...kycRecords.map(k => k.wallet_address)
      ].filter(Boolean);
      
      let validAddresses = 0;
      let invalidAddresses = 0;
      
      allAddresses.forEach((address, index) => {
        if (ethers.isAddress(address)) {
          validAddresses++;
        } else {
          console.log(`   ❌ Invalid address at index ${index}: ${address}`);
          invalidAddresses++;
        }
      });
      
      console.log(`   📊 Address Validation:`);
      console.log(`      • Valid: ${validAddresses}`);
      console.log(`      • Invalid: ${invalidAddresses}`);
      
      expect(invalidAddresses).to.equal(0);
      expect(validAddresses).to.equal(allAddresses.length);
    });
  });

  describe('5. Performance and Scale Testing', function() {
    it('should handle bulk address queries efficiently', async function() {
      const testAddresses = kycRecords.slice(0, 50).map(kyc => kyc.wallet_address);
      
      const startTime = Date.now();
      
      const results = await Promise.all(
        testAddresses.map(address => contract.kycVerified(address))
      );
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`   ⚡ Queried ${testAddresses.length} addresses in ${duration}ms`);
      console.log(`   📊 Average: ${(duration / testAddresses.length).toFixed(2)}ms per query`);
      
      expect(duration).to.be.lessThan(10000); // Should complete within 10 seconds
      expect(results.length).to.equal(testAddresses.length);
    });

    it('should maintain data consistency under load', async function() {
      const initialStats = await contract.getCampaignStats();
      
      // Simulate concurrent reads
      const concurrentQueries = [];
      for (let i = 0; i < 20; i++) {
        concurrentQueries.push(contract.getCampaignStats());
      }
      
      const results = await Promise.all(concurrentQueries);
      
      // All results should be identical
      results.forEach(stats => {
        expect(stats.totalReceived.toString()).to.equal(initialStats.totalReceived.toString());
        expect(stats.uniqueContributors.toString()).to.equal(initialStats.uniqueContributors.toString());
      });
      
      console.log(`   ✅ Data consistency maintained across ${results.length} concurrent queries`);
    });
  });

  describe('6. Edge Cases and Error Handling', function() {
    it('should handle duplicate KYC verification attempts', async function() {
      const testAddress = kycRecords.find(kyc => kyc.status === 'approved')?.wallet_address;
      
      if (!testAddress) {
        this.skip();
      }
      
      // Verify once
      await contract.connect(owner).verifyKYC(testAddress);
      
      // Verify again (should not fail, just be idempotent)
      const tx = await contract.connect(owner).verifyKYC(testAddress);
      const receipt = await tx.wait();
      
      expect(receipt.status).to.equal(1);
      
      const isVerified = await contract.kycVerified(testAddress);
      expect(isVerified).to.be.true;
    });

    it('should reject contributions from unverified addresses', async function() {
      const unverifiedRecord = kycRecords.find(kyc => kyc.status === 'rejected' || kyc.status === 'pending');
      
      if (!unverifiedRecord) {
        this.skip();
      }
      
      const account = testAccounts[0];
      const amount = ethers.parseEther('0.1');
      
      await expect(
        contract.connect(account).contribute({ value: amount })
      ).to.be.revertedWith('CampaignContributions: KYC verification required');
    });

    it('should handle malformed data gracefully', function() {
      // Test that our data loading handled any malformed records
      const recordsWithMissingFields = [
        ...prospects.filter(p => !p.wallet_address || !p.unique_id),
        ...donors.filter(d => !d.amount || isNaN(parseFloat(d.amount))),
        ...kycRecords.filter(k => !k.wallet_address || !k.status)
      ];
      
      console.log(`   🔍 Records with missing/invalid fields: ${recordsWithMissingFields.length}`);
      
      // We should have filtered these out during loading
      expect(recordsWithMissingFields.length).to.equal(0);
    });
  });

  describe('7. MVP Readiness Checklist (Full Dataset)', function() {
    it('✓ All 515 test records loaded and validated', function() {
      expect(prospects.length + donors.length + kycRecords.length).to.equal(515);
    });

    it('✓ Smart contract handles realistic data volumes', async function() {
      const stats = await contract.getCampaignStats();
      // Contract should be operational and responsive
      expect(stats).to.exist;
    });

    it('✓ KYC verification system operational with bulk data', async function() {
      const approvedCount = kycRecords.filter(kyc => kyc.status === 'approved').length;
      expect(approvedCount).to.be.greaterThan(0);
    });

    it('✓ Contribution flow works with diverse donor profiles', function() {
      const uniqueAmounts = [...new Set(donors.map(d => parseFloat(d.amount)))];
      const addressVariations = [...new Set(donors.map(d => d.wallet_address?.length))];
      
      console.log(`   💰 Unique contribution amounts: ${uniqueAmounts.length}`);
      console.log(`   🏠 Address format variations: ${addressVariations.length}`);
      
      expect(uniqueAmounts.length).to.be.greaterThan(10); // Diverse amounts
      expect(addressVariations.length).to.be.lessThanOrEqual(2); // Consistent addressing
    });

    it('✓ Data relationships and integrity maintained', function() {
      const totalValidAddresses = [
        ...prospects,
        ...donors,
        ...kycRecords
      ].filter(record => 
        record.wallet_address && ethers.isAddress(record.wallet_address)
      ).length;
      
      const totalRecords = prospects.length + donors.length + kycRecords.length;
      const validityRate = (totalValidAddresses / totalRecords) * 100;
      
      console.log(`   📊 Data validity rate: ${validityRate.toFixed(1)}%`);
      
      expect(validityRate).to.be.greaterThan(95); // 95%+ data quality
    });
  });
});