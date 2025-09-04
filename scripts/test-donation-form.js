#!/usr/bin/env node
import { referralSystem } from '../lib/referralSystem.js';

/**
 * Test script to verify DonationForm integration points
 * Tests the APIs that the DonationForm component uses
 */

async function testDonationFormIntegration() {
  console.log('🧪 Testing DonationForm Integration Points');
  console.log('='.repeat(60));

  let testResults = {
    total: 0,
    passed: 0,
    failed: 0
  };

  function logTest(name, passed, details = '') {
    testResults.total++;
    if (passed) {
      testResults.passed++;
      console.log(`✅ ${name}`);
    } else {
      testResults.failed++;
      console.error(`❌ ${name}: ${details}`);
    }
    if (details && passed) {
      console.log(`   ${details}`);
    }
  }

  try {
    // Test 1: Create a test donor for referral testing
    console.log('\n📝 Setting up test donor with referral code...');
    const testDonor = await referralSystem.createOrGetDonor({
      email: 'test-referrer@example.com',
      name: 'Alice Johnson',
      walletAddress: '0x742d35Cc6639C0532fEb1F71ae89d1DB5fdB73f6'
    });

    logTest('Create test donor with referral code', !!testDonor.referral_code, 
      `Created donor: ${testDonor.full_name}, Referral code: ${testDonor.referral_code}`);

    // Test 2: Validate the referral code (what DonationForm does on page load)
    console.log('\n🔍 Testing referral code validation...');
    const validation = await referralSystem.validateReferralCode(testDonor.referral_code);
    
    logTest('Validate referral code', validation.isValid === true, 
      `Code ${testDonor.referral_code} validated for ${validation.donor?.name}`);

    // Test 3: Test invalid referral code
    const invalidValidation = await referralSystem.validateReferralCode('INVALID123');
    logTest('Reject invalid referral code', invalidValidation.isValid === false);

    // Test 4: Get candidates (what DonationForm loads for campaign selection)
    console.log('\n🗳️  Testing candidate/campaign loading...');
    const candidates = await referralSystem.getCandidates();
    
    logTest('Load available candidates', candidates.length > 0, 
      `Found ${candidates.length} candidates: ${candidates.slice(0, 2).map(c => c.name).join(', ')}`);

    // Test 5: Record a donation with referral attribution (main form submission)
    console.log('\n💰 Testing donation recording with referral attribution...');
    const targetCandidate = candidates[0];
    
    const donation = await referralSystem.recordDonation({
      donorData: {
        email: 'form-donor@example.com',
        name: 'Bob Smith',
        walletAddress: '0x8ba1f109551bD432803012645Hac136c30c7g89C'
      },
      candidateId: targetCandidate.id,
      amount: '0.5',
      transactionHash: '0x' + Date.now().toString(16) + '1234567890abcdef',
      referralCode: testDonor.referral_code,
      network: 'ethereum',
      currency: 'ETH'
    });

    logTest('Record donation with referral attribution', !!donation.id, 
      `Donation ID: ${donation.id}, Amount: ${donation.amount} ETH, Referrer: ${donation.referrer_id}`);

    // Test 6: Update donation status (what happens after 3-second delay)
    console.log('\n⏰ Testing donation status update...');
    const updatedDonation = await referralSystem.updateDonationStatus(
      donation.id,
      'completed',
      {
        block_number: 18123456,
        gas_used: 21000,
        gas_price: '20000000000'
      }
    );

    logTest('Update donation to completed status', updatedDonation.status === 'completed', 
      `Status: ${updatedDonation.status}, Block: ${updatedDonation.block_number}`);

    // Test 7: Verify referral stats updated
    console.log('\n📊 Testing referral stats (what shows in success screen)...');
    const referralStats = await referralSystem.getReferralStats(testDonor.id);
    
    logTest('Referral stats show attribution', referralStats.total_referrals > 0, 
      `${referralStats.donor_name} has ${referralStats.total_referrals} referrals worth $${referralStats.total_raised_confirmed}`);

    // Test 8: Test donation without referral (normal form submission)
    console.log('\n💳 Testing donation without referral...');
    const normalDonation = await referralSystem.recordDonation({
      donorData: {
        email: 'normal-donor@example.com',
        name: 'Charlie Brown',
        walletAddress: null // Optional field
      },
      candidateId: targetCandidate.id,
      amount: '1.0',
      transactionHash: '0x' + Date.now().toString(16) + 'abcdef1234567890',
      referralCode: null, // No referral
      network: 'ethereum',
      currency: 'ETH'
    });

    logTest('Record donation without referral', !!normalDonation.id && !normalDonation.referrer_id, 
      `Donation ID: ${normalDonation.id}, No referrer (as expected)`);

    // Summary
    console.log('\n📈 Test Results Summary');
    console.log('='.repeat(40));
    console.log(`Total tests: ${testResults.total}`);
    console.log(`Passed: ${testResults.passed} ✅`);
    console.log(`Failed: ${testResults.failed} ❌`);
    console.log(`Success rate: ${Math.round((testResults.passed / testResults.total) * 100)}%`);

    if (testResults.passed === testResults.total) {
      console.log('\n🎉 All integration tests passed!');
      console.log('The DonationForm component should work correctly with the APIs.');
      console.log('\n💡 To test the DonationForm UI:');
      console.log(`1. Navigate to /donation-demo in your React app`);
      console.log(`2. Try a normal donation`);
      console.log(`3. Try with referral: ?ref=${testDonor.referral_code}`);
      console.log(`4. Watch the 3-second confirmation simulation`);
    } else {
      console.log('\n⚠️  Some tests failed. The DonationForm may not work correctly.');
    }

    // Output test data for manual verification
    console.log('\n📋 Test Data Created:');
    console.log(`Referrer: ${testDonor.full_name} (${testDonor.referral_code})`);
    console.log(`Test donations: 2 donations recorded`);
    console.log(`Available candidates: ${candidates.length}`);

  } catch (error) {
    console.error('\n💥 Test execution failed:', error);
    testResults.failed++;
  }

  return testResults;
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testDonationFormIntegration().catch(error => {
    console.error('Failed to run integration tests:', error);
    process.exit(1);
  });
}

export { testDonationFormIntegration };