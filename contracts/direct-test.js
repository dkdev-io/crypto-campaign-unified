const hre = require("hardhat");
const { ethers } = hre;

async function directContractTest() {
  console.log("🔍 Direct contract test with known address...\n");
  
  // Ensure we're using localhost network
  console.log("🌐 Network:", hre.network.name);
  console.log("🔗 Provider URL:", hre.network.config.url || "default");

  // Direct connection to known working address
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  
  const [deployer, contributor1] = await ethers.getSigners();
  console.log("👥 Test accounts:");
  console.log(`  Deployer: ${deployer.address}`);
  console.log(`  Contributor 1: ${contributor1.address}\n`);

  // Connect to contract at known address
  const CampaignContributions = await ethers.getContractFactory("CampaignContributions");
  const contract = CampaignContributions.attach(contractAddress);

  console.log(`📍 Connected to contract at: ${contractAddress}\n`);

  try {
    console.log("🔍 Checking contract code...");
    const code = await ethers.provider.getCode(contractAddress);
    console.log(`  Contract code length: ${code.length}`);
    console.log(`  Contract exists: ${code !== '0x'}\n`);

    console.log("📊 Test 1: Reading MAX_CONTRIBUTION_USD...");
    const maxContributionUSD = await contract.MAX_CONTRIBUTION_USD();
    console.log(`  MAX_CONTRIBUTION_USD: $${maxContributionUSD.toString()}\n`);

    console.log("📊 Test 2: Reading ethPriceUSD...");
    const ethPriceUSD = await contract.ethPriceUSD();
    console.log(`  ETH Price USD: $${ethers.formatUnits(ethPriceUSD, 18)}\n`);

    console.log("📊 Test 3: Reading maxContributionWei...");
    const maxContributionWei = await contract.maxContributionWei();
    console.log(`  Max Contribution Wei: ${maxContributionWei.toString()}`);
    console.log(`  Max Contribution ETH: ${ethers.formatEther(maxContributionWei)}\n`);

    console.log("🎉 All tests passed!");

  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.log("\nFull error:", error);
  }
}

directContractTest()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });