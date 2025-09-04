const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('🚀 Starting CampaignContributions deployment...');

  // Get deployment parameters from environment
  const campaignTreasury =
    process.env.CAMPAIGN_TREASURY || '0x1234567890123456789012345678901234567890';
  const initialOwner = process.env.INITIAL_OWNER || '0x1234567890123456789012345678901234567890';

  // Validate addresses
  if (!ethers.isAddress(campaignTreasury)) {
    throw new Error('Invalid CAMPAIGN_TREASURY address');
  }
  if (!ethers.isAddress(initialOwner)) {
    throw new Error('Invalid INITIAL_OWNER address');
  }

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const network = await ethers.provider.getNetwork();

  console.log('📋 Deployment Configuration:');
  console.log(`  Network: ${network.name} (${network.chainId})`);
  console.log(`  Deployer: ${deployerAddress}`);
  console.log(`  Campaign Treasury: ${campaignTreasury}`);
  console.log(`  Initial Owner: ${initialOwner}`);

  // Check deployer balance
  const balance = await ethers.provider.getBalance(deployerAddress);
  console.log(`  Deployer Balance: ${ethers.formatEther(balance)} ETH`);

  if (balance < ethers.parseEther('0.01')) {
    throw new Error('Insufficient balance for deployment (need at least 0.01 ETH)');
  }

  // Deploy the contract
  console.log('\\n📦 Deploying CampaignContributions contract...');

  const CampaignContributions = await ethers.getContractFactory('CampaignContributions');

  // Estimate gas
  const deploymentData = CampaignContributions.interface.encodeDeploy([
    campaignTreasury,
    initialOwner,
  ]);
  const estimatedGas = await ethers.provider.estimateGas({
    data: CampaignContributions.bytecode + deploymentData.slice(2),
  });

  console.log(`  Estimated Gas: ${estimatedGas.toString()}`);

  const contract = await CampaignContributions.deploy(campaignTreasury, initialOwner);
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log(`✅ Contract deployed to: ${contractAddress}`);

  // Get deployment transaction
  const deploymentTx = contract.deploymentTransaction();
  if (deploymentTx) {
    console.log(`  Deployment TX: ${deploymentTx.hash}`);
    console.log(`  Gas Used: ${deploymentTx.gasLimit.toString()}`);
    console.log(`  Gas Price: ${ethers.formatUnits(deploymentTx.gasPrice || 0n, 'gwei')} gwei`);
  }

  // Verify contract state
  console.log('\\n🔍 Verifying initial contract state...');

  const maxContribution = await contract.getMaxContributionWei();
  const ethPrice = await contract.ethPriceUSD();
  const treasuryAddress = await contract.campaignTreasury();
  const owner = await contract.owner();

  console.log(`  Max Contribution: ${ethers.formatEther(maxContribution)} ETH`);
  console.log(`  ETH Price: $${ethers.formatUnits(ethPrice, 18)}`);
  console.log(`  Treasury: ${treasuryAddress}`);
  console.log(`  Owner: ${owner}`);

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: Number(network.chainId),
    contractAddress: contractAddress,
    deployerAddress: deployerAddress,
    campaignTreasury: campaignTreasury,
    initialOwner: initialOwner,
    deploymentBlock: deploymentTx?.blockNumber,
    deploymentTxHash: deploymentTx?.hash,
    timestamp: new Date().toISOString(),
    gasUsed: deploymentTx?.gasLimit.toString(),
    gasPrice: deploymentTx?.gasPrice?.toString(),
    maxContribution: maxContribution.toString(),
    ethPriceUSD: ethPrice.toString(),
  };

  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save deployment info to file
  const deploymentFile = path.join(deploymentsDir, `${network.name}_${network.chainId}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`📄 Deployment info saved to: ${deploymentFile}`);

  // Generate ABI file for frontend
  const abiDir = path.join(__dirname, '../../frontend/src/contracts');
  if (!fs.existsSync(abiDir)) {
    fs.mkdirSync(abiDir, { recursive: true });
  }

  const artifact = await ethers.getContractAt('CampaignContributions', contractAddress);
  const abiData = {
    address: contractAddress,
    abi: CampaignContributions.interface.fragments
      .map((fragment) => fragment.format('json'))
      .map(JSON.parse),
  };

  const abiFile = path.join(abiDir, 'CampaignContributions.json');
  fs.writeFileSync(abiFile, JSON.stringify(abiData, null, 2));
  console.log(`📄 ABI saved to: ${abiFile}`);

  // Final deployment summary
  console.log('\\n🎉 Deployment Complete!');
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Network: ${network.name}`);
  console.log(`Block Explorer: ${getBlockExplorerUrl(network.chainId, contractAddress)}`);

  if (
    network.chainId === 1n ||
    network.chainId === 11155111n ||
    network.chainId === 8453n ||
    network.chainId === 84532n
  ) {
    console.log('\\n📝 Next steps:');
    console.log('1. Verify contract on block explorer:');
    console.log(
      `   npx hardhat verify --network ${network.name} ${contractAddress} "${campaignTreasury}" "${initialOwner}"`
    );
    console.log('2. Update frontend environment variables with contract address');
    console.log('3. Test contract functionality on testnet before mainnet use');
  }

  return contractAddress;
}

function getBlockExplorerUrl(chainId, address) {
  const explorers = {
    1: `https://etherscan.io/address/${address}`,
    11155111: `https://sepolia.etherscan.io/address/${address}`,
    8453: `https://basescan.org/address/${address}`,
    84532: `https://sepolia.basescan.org/address/${address}`,
    31337: `Local network - no explorer`,
  };

  return explorers[Number(chainId)] || `Unknown network`;
}

// Handle both direct execution and module import
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Deployment failed:');
      console.error(error);
      process.exit(1);
    });
}

module.exports = { main };
