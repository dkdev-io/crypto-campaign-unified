#!/usr/bin/env node
import { referralSystem } from '../lib/referralSystem.js';

/**
 * Comprehensive Test Script for Referral System
 * Tests donor creation, referral codes, donation recording, and stats retrieval
 */

// Test configuration
const TEST_CONFIG = {
  donors: [
    { email: 'alice@example.com', name: 'Alice Johnson', walletAddress: '0x742d35Cc6639C0532fEb1F71ae89d1DB5fdB73f6' },
    { email: 'bob@example.com', name: 'Bob Smith', phone: '555-0123' },
    { email: 'charlie@example.com', name: 'Charlie Brown', walletAddress: '0x8ba1f109551bD432803012645Hac136c30c7g89C' },
  ],
  candidates: [
    { 
      name: 'Senator Jane Doe', 
      description: 'Progressive candidate for climate action',
      walletAddress: '0x1234567890123456789012345678901234567890',
      campaignGoal: '100000.0'
    },
    {
      name: 'Mayor John Smith',
      description: 'Local government reform advocate',
      walletAddress: '0x0987654321098765432109876543210987654321',
      campaignGoal: '50000.0'
    }
  ],
  donations: [
    { donorIndex: 0, candidateIndex: 0, amount: '500.0', referralCode: null },
    { donorIndex: 1, candidateIndex: 0, amount: '250.0', referralCode: null }, // Will use Alice's referral code
    { donorIndex: 2, candidateIndex: 1, amount: '1000.0', referralCode: null }, // Will use Bob's referral code
  ]
};

// Test state
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

let createdDonors = [];
let createdCandidates = [];
let createdDonations = [];

/**
 * Test helper functions
 */
function logTest(testName, passed, details = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${testName}`);
  } else {
    testResults.failed++;
    console.error(`❌ ${testName}: ${details}`);
    testResults.errors.push({ test: testName, details });
  }
}

function logSection(sectionName) {
  console.log(`\n🔬 ${sectionName}`);
  console.log('='.repeat(50));
}

/**
 * Test Functions
 */

async function testDonorCreation() {
  logSection('Testing Donor Creation & Referral Code Generation');
  
  for (let i = 0; i < TEST_CONFIG.donors.length; i++) {
    const donorData = TEST_CONFIG.donors[i];
    
    try {
      const donor = await referralSystem.createOrGetDonor(donorData);
      createdDonors.push(donor);
      
      // Test: Donor was created
      logTest(`Create donor ${donorData.name}`, !!donor.id, 'Donor ID not generated');
      
      // Test: Email matches
      logTest(`Email matches for ${donorData.name}`, donor.email === donorData.email.toLowerCase());
      
      // Test: Referral code was generated
      logTest(`Referral code generated for ${donorData.name}`, !!donor.referral_code && donor.referral_code.length > 0);
      
      // Test: Referral code format (should be uppercase, 7 chars)
      const codeFormatValid = /^[A-Z0-9]{7}$/.test(donor.referral_code);
      logTest(`Referral code format valid for ${donorData.name}`, codeFormatValid, `Got: ${donor.referral_code}`);
      
      console.log(`   Donor: ${donor.full_name} | Code: ${donor.referral_code} | ID: ${donor.id}`);
      
    } catch (error) {
      logTest(`Create donor ${donorData.name}`, false, error.message);
      testResults.errors.push({ test: `Create donor ${donorData.name}`, error: error.message });
    }
  }
}

async function testReferralCodeValidation() {
  logSection('Testing Referral Code Validation');
  
  if (createdDonors.length === 0) {
    logTest('Referral code validation', false, 'No donors created to test with');
    return;
  }
  
  // Test valid referral codes
  for (const donor of createdDonors) {
    try {
      const validation = await referralSystem.validateReferralCode(donor.referral_code);
      
      logTest(`Validate existing code ${donor.referral_code}`, validation.isValid === true);
      logTest(`Correct donor returned for ${donor.referral_code}`, validation.donor?.id === donor.id);
      
    } catch (error) {
      logTest(`Validate code ${donor.referral_code}`, false, error.message);
    }
  }
  
  // Test invalid referral code
  try {
    const invalidValidation = await referralSystem.validateReferralCode('INVALID123');
    logTest('Invalid referral code returns false', invalidValidation.isValid === false);
  } catch (error) {
    logTest('Invalid referral code validation', false, error.message);
  }
  
  // Test empty/null referral code
  try {
    const emptyValidation = await referralSystem.validateReferralCode('');
    logTest('Empty referral code returns false', emptyValidation.isValid === false);
  } catch (error) {
    logTest('Empty referral code validation', false, error.message);
  }
}

async function testCandidateCreation() {
  logSection('Testing Candidate/Campaign Creation');
  
  // First check if we already have campaigns/candidates
  try {
    const existingCandidates = await referralSystem.getCandidates();
    console.log(`   Found ${existingCandidates.length} existing candidates/campaigns`);
    
    if (existingCandidates.length > 0) {
      createdCandidates = existingCandidates.slice(0, 2); // Use first 2
      logTest('Use existing candidates', true);
      
      createdCandidates.forEach(candidate => {
        console.log(`   Candidate: ${candidate.name} | ID: ${candidate.id}`);
      });
      
      return;
    }
  } catch (error) {
    console.log('   No existing candidates found, will need to create some manually');
  }
  
  // For this test, we'll just mark this as a note since we can't create campaigns via the referral system
  logTest('Note: Manual candidate creation needed', true, 'Use admin interface to create campaigns/candidates');
}

async function testDonationRecording() {
  logSection('Testing Donation Recording with Referral Attribution');
  
  if (createdDonors.length < 2) {
    logTest('Donation recording', false, 'Need at least 2 donors for referral testing');
    return;
  }
  
  if (createdCandidates.length === 0) {
    logTest('Donation recording', false, 'Need at least 1 candidate/campaign to donate to');
    return;
  }
  
  // Set up referral relationships
  TEST_CONFIG.donations[1].referralCode = createdDonors[0].referral_code; // Bob uses Alice's code
  TEST_CONFIG.donations[2].referralCode = createdDonors[1].referral_code; // Charlie uses Bob's code
  
  for (let i = 0; i < TEST_CONFIG.donations.length; i++) {
    const donationConfig = TEST_CONFIG.donations[i];
    const donor = createdDonors[donationConfig.donorIndex];
    const candidate = createdCandidates[donationConfig.candidateIndex % createdCandidates.length];
    
    try {
      const donation = await referralSystem.recordDonation({
        donorData: {
          email: donor.email,
          name: donor.full_name,
          walletAddress: donor.wallet_address
        },
        candidateId: candidate.id,
        amount: donationConfig.amount,
        transactionHash: `0x${Date.now().toString(16)}${i.toString().padStart(4, '0')}`, // Mock tx hash
        referralCode: donationConfig.referralCode,
        network: 'ethereum',
        currency: 'ETH'
      });
      
      createdDonations.push(donation);
      
      // Test: Donation was created
      logTest(`Record donation from ${donor.full_name}`, !!donation.id);
      
      // Test: Correct amount
      logTest(`Correct amount for donation ${i + 1}`, donation.amount === donationConfig.amount);
      
      // Test: Referral attribution
      if (donationConfig.referralCode) {
        const expectedReferrer = createdDonors.find(d => d.referral_code === donationConfig.referralCode);
        logTest(`Referral attribution for donation ${i + 1}`, donation.referrer_id === expectedReferrer.id);
        logTest(`Referral code stored for donation ${i + 1}`, donation.referral_code === donationConfig.referralCode);
      } else {
        logTest(`No referral for donation ${i + 1}`, !donation.referrer_id);
      }
      
      console.log(`   Donation: $${donation.amount} from ${donor.full_name} to ${candidate.name} ${donation.referral_code ? `(via ${donation.referral_code})` : ''}`);
      
    } catch (error) {
      logTest(`Record donation from ${donor.full_name}`, false, error.message);
    }
  }
}

async function testStatsRetrieval() {
  logSection('Testing Statistics Retrieval');
  
  if (createdDonors.length === 0) {
    logTest('Stats retrieval', false, 'No donors to test stats with');
    return;
  }
  
  // Test referral stats for each donor
  for (const donor of createdDonors) {
    try {
      const stats = await referralSystem.getReferralStats(donor.id);
      
      logTest(`Get referral stats for ${donor.full_name}`, !!stats);
      logTest(`Stats contain donor info for ${donor.full_name}`, stats.donor_name === donor.full_name);
      logTest(`Stats contain referral code for ${donor.full_name}`, stats.referral_code === donor.referral_code);
      
      console.log(`   ${donor.full_name}: ${stats.total_referrals} referrals, $${stats.total_raised_confirmed} raised`);
      
      // Test aggregate stats
      const aggregateStats = await referralSystem.getDonorAggregateStats(donor.id);
      logTest(`Get aggregate stats for ${donor.full_name}`, !!aggregateStats);
      
      console.log(`   ${donor.full_name}: ${aggregateStats.own_donation_count} own donations, ${aggregateStats.referral_count} referrals, $${aggregateStats.total_impact} total impact`);
      
    } catch (error) {
      logTest(`Get stats for ${donor.full_name}`, false, error.message);
    }
  }
}

async function testDonationStatusUpdate() {
  logSection('Testing Donation Status Updates');
  
  if (createdDonations.length === 0) {
    logTest('Donation status update', false, 'No donations to test with');
    return;
  }
  
  // Test confirming a donation
  const donation = createdDonations[0];
  try {
    const updatedDonation = await referralSystem.updateDonationStatus(
      donation.id, 
      'completed',
      {
        block_number: 12345678,
        gas_used: 21000,
        gas_price: '20000000000' // 20 gwei
      }
    );
    
    logTest('Update donation to completed', updatedDonation.status === 'completed');
    logTest('Block number updated', updatedDonation.block_number === 12345678);
    logTest('Confirmation timestamp set', !!updatedDonation.confirmed_at);
    
    console.log(`   Updated donation ${donation.id} to completed status`);
    
  } catch (error) {
    logTest('Update donation status', false, error.message);
  }
}

/**
 * Main test execution
 */
async function runTests() {
  console.log('🚀 Starting Referral System Tests');
  console.log('='.repeat(80));
  
  try {
    await testDonorCreation();
    await testReferralCodeValidation();
    await testCandidateCreation();
    await testDonationRecording();
    await testStatsRetrieval();
    await testDonationStatusUpdate();
    
    // Final summary
    console.log('\n📊 Test Results Summary');
    console.log('='.repeat(50));
    console.log(`Total tests: ${testResults.total}`);
    console.log(`Passed: ${testResults.passed} ✅`);
    console.log(`Failed: ${testResults.failed} ❌`);
    console.log(`Success rate: ${Math.round((testResults.passed / testResults.total) * 100)}%`);
    
    if (testResults.failed > 0) {
      console.log('\n❌ Failed Tests:');
      testResults.errors.forEach(error => {
        console.log(`   - ${error.test}: ${error.details || error.error}`);
      });
    }
    
    if (testResults.passed === testResults.total) {
      console.log('\n🎉 All tests passed! The referral system is working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Check the errors above.');
    }
    
    // Output created data for manual verification
    if (createdDonors.length > 0 || createdDonations.length > 0) {
      console.log('\n📋 Created Data (for manual verification):');
      console.log('Donors:', createdDonors.map(d => ({ 
        id: d.id, 
        name: d.full_name, 
        email: d.email, 
        referralCode: d.referral_code 
      })));
      
      if (createdDonations.length > 0) {
        console.log('Donations:', createdDonations.map(d => ({ 
          id: d.id, 
          amount: d.amount, 
          status: d.status, 
          referralCode: d.referral_code,
          referrerId: d.referrer_id
        })));
      }
    }
    
  } catch (error) {
    console.error('\n💥 Test execution failed:', error);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(error => {
    console.error('Failed to run tests:', error);
    process.exit(1);
  });
}

export { runTests, testResults };