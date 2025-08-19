// Smart Contract Deployment Script
// Deploy the CampaignContributions contract with proper configuration

const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 Deploying CampaignContributions contract...");

    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log("📝 Deploying with account:", deployer.address);
    console.log("💰 Account balance:", (await deployer.getBalance()).toString());

    // Deploy the contract
    const CampaignContributions = await ethers.getContractFactory("CampaignContributions");
    
    // Constructor parameters
    const campaignTreasury = deployer.address; // Set to campaign treasury address
    const initialEthPrice = ethers.utils.parseUnits("3000", 18); // $3000 per ETH
    
    console.log("📦 Deploying contract with parameters:");
    console.log("   Campaign Treasury:", campaignTreasury);
    console.log("   Initial ETH Price:", ethers.utils.formatUnits(initialEthPrice, 18), "USD");
    
    const contract = await CampaignContributions.deploy(campaignTreasury, initialEthPrice);
    await contract.deployed();

    console.log("✅ CampaignContributions deployed to:", contract.address);
    console.log("🔗 Transaction hash:", contract.deployTransaction.hash);
    
    // Verify deployment
    console.log("\n🔍 Verifying deployment...");
    const maxContribution = await contract.maxContributionWei();
    const treasury = await contract.campaignTreasury();
    const ethPrice = await contract.ethPriceUSD();
    
    console.log("   Max Contribution (wei):", maxContribution.toString());
    console.log("   Max Contribution (ETH):", ethers.utils.formatEther(maxContribution));
    console.log("   Campaign Treasury:", treasury);
    console.log("   ETH Price (USD):", ethers.utils.formatUnits(ethPrice, 18));
    
    // Save deployment info
    const deploymentInfo = {
        network: network.name,
        contractAddress: contract.address,
        deployerAddress: deployer.address,
        transactionHash: contract.deployTransaction.hash,
        blockNumber: contract.deployTransaction.blockNumber,
        campaignTreasury: treasury,
        maxContributionWei: maxContribution.toString(),
        ethPriceUSD: ethPrice.toString(),
        deployedAt: new Date().toISOString()
    };

    console.log("\n💾 Deployment information:");
    console.log(JSON.stringify(deploymentInfo, null, 2));
    
    // Save to file for frontend integration
    const fs = require('fs');
    fs.writeFileSync(
        './deployment.json',
        JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log("✅ Deployment complete! Contract ready for contributions.");
    console.log("\n📋 Next Steps:");
    console.log("1. Update frontend with contract address:", contract.address);
    console.log("2. Add KYC verifiers using addKYCVerifier()");
    console.log("3. Test contribution flow");
    console.log("4. Verify contract on Etherscan if on mainnet");
    
    return contract.address;
}

// Handle errors
main()
    .then((contractAddress) => {
        console.log(`\n🎉 Deployment successful: ${contractAddress}`);
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });