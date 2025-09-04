const fs = require('fs');
const path = require('path');

async function updateFrontendABI() {
  console.log('📄 Updating frontend ABI and contract config...');

  // Read the compiled contract artifact
  const artifactPath = path.join(
    __dirname,
    '../artifacts/src/CampaignContributions.sol/CampaignContributions.json'
  );
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

  // Read deployment info
  const deploymentsDir = path.join(__dirname, '../deployments');
  const deploymentFiles = fs
    .readdirSync(deploymentsDir)
    .filter(
      (file) =>
        (file.startsWith('localhost') || file.startsWith('hardhat')) && file.endsWith('.json')
    )
    .sort();

  if (deploymentFiles.length === 0) {
    throw new Error('No deployment found for localhost');
  }

  const latestDeployment = deploymentFiles[deploymentFiles.length - 1];
  const deploymentInfo = JSON.parse(
    fs.readFileSync(path.join(deploymentsDir, latestDeployment), 'utf8')
  );

  console.log(`📍 Using deployment: ${latestDeployment}`);
  console.log(`📍 Contract address: ${deploymentInfo.contractAddress}`);

  // Create frontend config
  const frontendConfig = {
    address: deploymentInfo.contractAddress,
    abi: artifact.abi,
    bytecode: artifact.bytecode,
    networks: {
      localhost: {
        address: deploymentInfo.contractAddress,
        chainId: 31337,
      },
    },
    deployment: {
      network: deploymentInfo.network,
      chainId: deploymentInfo.chainId,
      deployer: deploymentInfo.deployer,
      blockNumber: deploymentInfo.blockNumber,
      deploymentTime: deploymentInfo.deploymentTime,
    },
  };

  // Update frontend contract config
  const frontendConfigPath = path.join(
    __dirname,
    '../../frontend/src/contracts/CampaignContributions.json'
  );

  // Ensure directory exists
  const frontendContractsDir = path.dirname(frontendConfigPath);
  if (!fs.existsSync(frontendContractsDir)) {
    fs.mkdirSync(frontendContractsDir, { recursive: true });
  }

  fs.writeFileSync(frontendConfigPath, JSON.stringify(frontendConfig, null, 2));
  console.log(`✅ Frontend config updated: ${frontendConfigPath}`);

  // Create contract-abi.js for frontend
  const contractAbiPath = path.join(__dirname, '../../frontend/src/lib/contract-abi.js');
  const contractAbiContent = `// Auto-generated contract configuration
// Generated at: ${new Date().toISOString()}

export const CAMPAIGN_CONTRACT_ABI = ${JSON.stringify(artifact.abi, null, 2)};

export const CONTRACT_CONFIG = {
  CONTRACT_ADDRESS: "${deploymentInfo.contractAddress}",
  NETWORK_ID: "${deploymentInfo.chainId}",
  NETWORK_NAME: "${deploymentInfo.network}",
  DEFAULT_ETH_PRICE_USD: 3000,
  MAX_CONTRIBUTION_USD: 3300
};

export default {
  abi: CAMPAIGN_CONTRACT_ABI,
  address: CONTRACT_CONFIG.CONTRACT_ADDRESS,
  config: CONTRACT_CONFIG
};`;

  fs.writeFileSync(contractAbiPath, contractAbiContent);
  console.log(`✅ Contract ABI updated: ${contractAbiPath}`);

  console.log('\n🎉 Frontend configuration updated successfully!');
  console.log('\n📋 Contract Details:');
  console.log(`   Address: ${deploymentInfo.contractAddress}`);
  console.log(`   Network: ${deploymentInfo.network} (${deploymentInfo.chainId})`);
  console.log(`   ABI Methods: ${artifact.abi.filter((item) => item.type === 'function').length}`);
  console.log(`   Events: ${artifact.abi.filter((item) => item.type === 'event').length}`);
}

updateFrontendABI()
  .then(() => console.log('✅ ABI update completed'))
  .catch((error) => {
    console.error('❌ ABI update failed:', error);
    process.exit(1);
  });
