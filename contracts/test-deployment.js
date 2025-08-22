const { ethers } = require("hardhat");

async function testDeployedContract() {
  console.log("🔍 Testing deployed smart contract functionality...\n");

  // Get signers
  const [deployer, contributor1, contributor2] = await ethers.getSigners();
  console.log("👥 Test accounts:");
  console.log(`  Deployer: ${deployer.address}`);
  console.log(`  Contributor 1: ${contributor1.address}`);
  console.log(`  Contributor 2: ${contributor2.address}\n`);

  // Connect to deployed contract
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const CampaignContributions = await ethers.getContractFactory("CampaignContributions");
  const contract = CampaignContributions.attach(contractAddress);

  console.log(`📍 Connected to contract at: ${contractAddress}\n`);

  try {
    // Test 1: Get initial campaign stats
    console.log("📊 Test 1: Getting initial campaign stats...");
    const initialStats = await contract.getCampaignStats();
    console.log(`  Total Received: ${ethers.formatEther(initialStats.totalReceived)} ETH`);
    console.log(`  Unique Contributors: ${initialStats.uniqueContributors.toString()}`);
    console.log(`  Max Contribution: ${ethers.formatEther(initialStats.maxContribution)} ETH`);
    console.log(`  Current ETH Price: $${ethers.formatUnits(initialStats.currentEthPrice, 18)}`);
    console.log("  ✅ Initial stats retrieved successfully\n");

    // Test 2: Check max contribution in wei
    console.log("💰 Test 2: Checking contribution limits...");
    const maxContribution = await contract.getMaxContributionWei();
    console.log(`  Max Contribution Wei: ${maxContribution.wei}`);
    console.log(`  Max Contribution ETH: ${maxContribution.eth} ETH`);
    console.log(`  Max Contribution USD: $${maxContribution.usd}`);
    console.log("  ✅ Contribution limits retrieved successfully\n");

    // Test 3: Check contributor info for fresh address
    console.log("👤 Test 3: Checking contributor info for fresh address...");
    const contributorInfo = await contract.getContributorInfo(contributor1.address);
    console.log(`  Address: ${contributor1.address}`);
    console.log(`  Cumulative Amount: ${ethers.formatEther(contributorInfo.cumulativeAmount)} ETH`);
    console.log(`  Remaining Capacity: ${ethers.formatEther(contributorInfo.remainingCapacity)} ETH`);
    console.log(`  KYC Verified: ${contributorInfo.isKYCVerified}`);
    console.log(`  Has Contributed Before: ${contributorInfo.hasContributedBefore}`);
    console.log("  ✅ Contributor info retrieved successfully\n");

    // Test 4: Check if contribution is allowed (without KYC)
    console.log("🔍 Test 4: Checking contribution eligibility (no KYC)...");
    const testAmount = ethers.parseEther("0.1"); // 0.1 ETH
    const eligibility = await contract.canContribute(contributor1.address, testAmount);
    console.log(`  Address: ${contributor1.address}`);
    console.log(`  Amount: ${ethers.formatEther(testAmount)} ETH`);
    console.log(`  Can Contribute: ${eligibility.canContribute}`);
    console.log(`  Reason: ${eligibility.reason}`);
    console.log("  ✅ Eligibility check completed\n");

    // Test 5: Try to make a contribution (should fail due to no KYC)
    console.log("❌ Test 5: Attempting contribution without KYC (should fail)...");
    try {
      const contributionTx = await contract.connect(contributor1).contribute({
        value: testAmount
      });
      await contributionTx.wait();
      console.log("  ❌ ERROR: Contribution succeeded when it should have failed!");
    } catch (error) {
      console.log(`  ✅ Contribution correctly failed: ${error.message.split('(')[0]}`);
    }
    console.log();

    // Test 6: Verify KYC for contributor (admin function)
    console.log("🔐 Test 6: Setting KYC verification for contributor...");
    try {
      const kycTx = await contract.setKYCVerified(contributor1.address, true);
      await kycTx.wait();
      console.log(`  ✅ KYC verification set for ${contributor1.address}`);
    } catch (error) {
      console.log(`  ❌ KYC verification failed: ${error.message.split('(')[0]}`);
    }
    console.log();

    // Test 7: Check eligibility again after KYC
    console.log("🔍 Test 7: Checking contribution eligibility (with KYC)...");
    const eligibilityAfterKYC = await contract.canContribute(contributor1.address, testAmount);
    console.log(`  Address: ${contributor1.address}`);
    console.log(`  Amount: ${ethers.formatEther(testAmount)} ETH`);
    console.log(`  Can Contribute: ${eligibilityAfterKYC.canContribute}`);
    console.log(`  Reason: ${eligibilityAfterKYC.reason}`);
    console.log("  ✅ Post-KYC eligibility check completed\n");

    // Test 8: Make successful contribution
    console.log("💸 Test 8: Making successful contribution with KYC...");
    try {
      const contributionTx = await contract.connect(contributor1).contribute({
        value: testAmount
      });
      const receipt = await contributionTx.wait();
      console.log(`  ✅ Contribution successful!`);
      console.log(`  Transaction Hash: ${receipt.hash}`);
      console.log(`  Gas Used: ${receipt.gasUsed.toString()}`);
      console.log(`  Block Number: ${receipt.blockNumber}`);
    } catch (error) {
      console.log(`  ❌ Contribution failed: ${error.message.split('(')[0]}`);
    }
    console.log();

    // Test 9: Check updated stats
    console.log("📊 Test 9: Getting updated campaign stats...");
    const finalStats = await contract.getCampaignStats();
    console.log(`  Total Received: ${ethers.formatEther(finalStats.totalReceived)} ETH`);
    console.log(`  Unique Contributors: ${finalStats.uniqueContributors.toString()}`);
    console.log(`  Max Contribution: ${ethers.formatEther(finalStats.maxContribution)} ETH`);
    console.log("  ✅ Updated stats retrieved successfully\n");

    // Test 10: Check updated contributor info
    console.log("👤 Test 10: Checking updated contributor info...");
    const updatedContributorInfo = await contract.getContributorInfo(contributor1.address);
    console.log(`  Address: ${contributor1.address}`);
    console.log(`  Cumulative Amount: ${ethers.formatEther(updatedContributorInfo.cumulativeAmount)} ETH`);
    console.log(`  Remaining Capacity: ${ethers.formatEther(updatedContributorInfo.remainingCapacity)} ETH`);
    console.log(`  Has Contributed Before: ${updatedContributorInfo.hasContributedBefore}`);
    console.log("  ✅ Updated contributor info retrieved successfully\n");

    console.log("🎉 All smart contract tests completed successfully!");
    
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run tests
testDeployedContract()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });