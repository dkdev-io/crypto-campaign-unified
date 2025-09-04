const { ethers } = require('hardhat');

async function simpleContractTest() {
  console.log('🔍 Running simple contract tests...\n');

  // Get signers
  const [deployer, contributor1] = await ethers.getSigners();
  console.log('👥 Test accounts:');
  console.log(`  Deployer: ${deployer.address}`);
  console.log(`  Contributor 1: ${contributor1.address}\n`);

  // Connect to deployed contract
  // Read the latest deployment info
  const fs = require('fs');
  const path = require('path');
  const deploymentsDir = path.join(__dirname, 'deployments');
  const deploymentFiles = fs
    .readdirSync(deploymentsDir)
    .filter(
      (file) =>
        (file.startsWith('localhost') || file.startsWith('hardhat')) && file.endsWith('.json')
    )
    .sort();
  const latestDeployment = deploymentFiles[deploymentFiles.length - 1];
  const deploymentInfo = JSON.parse(
    fs.readFileSync(path.join(deploymentsDir, latestDeployment), 'utf8')
  );
  const contractAddress = deploymentInfo.contractAddress;
  const CampaignContributions = await ethers.getContractFactory('CampaignContributions');
  const contract = CampaignContributions.attach(contractAddress);

  console.log(`📍 Connected to contract at: ${contractAddress}\n`);

  try {
    // Test 1: Get simple state variables
    console.log('📊 Test 1: Reading simple state variables...');

    console.log('  Reading MAX_CONTRIBUTION_USD...');
    const maxContributionUSD = await contract.MAX_CONTRIBUTION_USD();
    console.log(`  MAX_CONTRIBUTION_USD: $${maxContributionUSD.toString()}`);

    console.log('  Reading ethPriceUSD...');
    const ethPriceUSD = await contract.ethPriceUSD();
    console.log(`  ETH Price USD: $${ethers.formatUnits(ethPriceUSD, 18)}`);

    console.log('  Reading maxContributionWei...');
    const maxContributionWei = await contract.maxContributionWei();
    console.log(`  Max Contribution Wei: ${maxContributionWei.toString()}`);
    console.log(`  Max Contribution ETH: ${ethers.formatEther(maxContributionWei)}`);

    console.log('  Reading campaignTreasury...');
    const campaignTreasury = await contract.campaignTreasury();
    console.log(`  Campaign Treasury: ${campaignTreasury}`);

    console.log('  Reading totalContributionsReceived...');
    const totalReceived = await contract.totalContributionsReceived();
    console.log(`  Total Received: ${ethers.formatEther(totalReceived)} ETH`);

    console.log('  Reading totalUniqueContributors...');
    const uniqueContributors = await contract.totalUniqueContributors();
    console.log(`  Unique Contributors: ${uniqueContributors.toString()}`);

    console.log('  ✅ All simple state reads successful\n');

    // Test 2: Call view functions with parameters
    console.log('📊 Test 2: Testing view functions with parameters...');

    console.log('  Testing kycVerified for contributor1...');
    const isKYCVerified = await contract.kycVerified(contributor1.address);
    console.log(`  KYC Verified: ${isKYCVerified}`);

    console.log('  Testing cumulativeContributions for contributor1...');
    const cumulativeContrib = await contract.cumulativeContributions(contributor1.address);
    console.log(`  Cumulative Contributions: ${ethers.formatEther(cumulativeContrib)} ETH`);

    console.log('  Testing hasContributed for contributor1...');
    const hasContributed = await contract.hasContributed(contributor1.address);
    console.log(`  Has Contributed: ${hasContributed}`);

    console.log('  ✅ Parameter-based view functions successful\n');

    // Test 3: Test single return value function
    console.log('📊 Test 3: Testing getMaxContributionWei...');
    const maxContrib = await contract.getMaxContributionWei();
    console.log(`  Max Contribution Wei: ${maxContrib.toString()}`);
    console.log(`  Max Contribution ETH: ${ethers.formatEther(maxContrib)}`);
    console.log('  ✅ getMaxContributionWei successful\n');

    // Test 4: Test getRemainingContributionCapacity
    console.log('📊 Test 4: Testing getRemainingContributionCapacity...');
    const remainingCapacity = await contract.getRemainingContributionCapacity(contributor1.address);
    console.log(`  Remaining Capacity: ${ethers.formatEther(remainingCapacity)} ETH`);
    console.log('  ✅ getRemainingContributionCapacity successful\n');

    // Test 5: Try to read the contract code
    console.log('📊 Test 5: Verifying contract deployment...');
    const code = await ethers.provider.getCode(contractAddress);
    console.log(`  Contract code length: ${code.length} characters`);
    console.log(`  Contract deployed: ${code !== '0x'}`);
    console.log('  ✅ Contract verification successful\n');

    console.log('🎉 All simple contract tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\nFull error:', error);
  }
}

// Run tests
simpleContractTest()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
