import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class Web3Service {
  constructor() {
    this.provider = null;
    this.contract = null;
    this.contractAddress = null;
    this.contractABI = null;
    this.initialized = false;
  }

  async initialize(network = 'localhost') {
    try {
      // Initialize provider based on network
      if (network === 'localhost' || network === 'hardhat') {
        this.provider = new ethers.JsonRpcProvider('http://localhost:8545');
      } else if (network === 'sepolia') {
        this.provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
      } else if (network === 'mainnet') {
        this.provider = new ethers.JsonRpcProvider(process.env.MAINNET_RPC_URL);
      } else if (network === 'base') {
        this.provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
      } else if (network === 'baseSepolia') {
        this.provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
      } else {
        throw new Error(`Unsupported network: ${network}`);
      }

      // Load contract deployment info
      await this.loadContractInfo(network);

      // Initialize contract instance
      this.contract = new ethers.Contract(this.contractAddress, this.contractABI, this.provider);

      this.initialized = true;
      console.log(`✅ Web3Service initialized for ${network}`);
      console.log(`📍 Contract address: ${this.contractAddress}`);
    } catch (error) {
      console.error('❌ Failed to initialize Web3Service:', error);
      throw error;
    }
  }

  async loadContractInfo(network) {
    try {
      // Load deployment info
      const deploymentFile = path.join(__dirname, `../../contracts/deployments/${network}_*.json`);
      const deploymentFiles = await this.findDeploymentFile(network);

      if (!deploymentFiles.length) {
        throw new Error(`No deployment found for network: ${network}`);
      }

      const deploymentData = JSON.parse(fs.readFileSync(deploymentFiles[0], 'utf8'));
      this.contractAddress = deploymentData.contractAddress;

      // Load ABI
      const abiFile = path.join(
        __dirname,
        '../../frontend/src/contracts/CampaignContributions.json'
      );
      if (fs.existsSync(abiFile)) {
        const abiData = JSON.parse(fs.readFileSync(abiFile, 'utf8'));
        this.contractABI = abiData.abi;
      } else {
        throw new Error('Contract ABI file not found');
      }
    } catch (error) {
      console.error('❌ Failed to load contract info:', error);
      throw error;
    }
  }

  async findDeploymentFile(network) {
    const deploymentsDir = path.join(__dirname, '../../contracts/deployments');
    if (!fs.existsSync(deploymentsDir)) {
      return [];
    }

    const files = fs.readdirSync(deploymentsDir);
    return files
      .filter((file) => file.startsWith(network) && file.endsWith('.json'))
      .map((file) => path.join(deploymentsDir, file));
  }

  // Contract interaction methods
  async getCampaignStats() {
    this.ensureInitialized();

    try {
      const [totalReceived, uniqueContributors, maxContribution, currentEthPrice] =
        await this.contract.getCampaignStats();

      return {
        totalReceived: ethers.formatEther(totalReceived),
        uniqueContributors: Number(uniqueContributors),
        maxContribution: ethers.formatEther(maxContribution),
        currentEthPrice: ethers.formatUnits(currentEthPrice, 18),
        maxContributionUSD: 3300, // Fixed FEC limit
      };
    } catch (error) {
      console.error('❌ Failed to get campaign stats:', error);
      throw error;
    }
  }

  async getContributorInfo(address) {
    this.ensureInitialized();

    if (!ethers.isAddress(address)) {
      throw new Error('Invalid Ethereum address');
    }

    try {
      const [cumulativeAmount, remainingCapacity, isKYCVerified, hasContributedBefore] =
        await this.contract.getContributorInfo(address);

      return {
        cumulativeAmount: ethers.formatEther(cumulativeAmount),
        remainingCapacity: ethers.formatEther(remainingCapacity),
        isKYCVerified,
        hasContributedBefore,
        address,
      };
    } catch (error) {
      console.error('❌ Failed to get contributor info:', error);
      throw error;
    }
  }

  async canContribute(address, amountETH) {
    this.ensureInitialized();

    if (!ethers.isAddress(address)) {
      throw new Error('Invalid Ethereum address');
    }

    try {
      const amountWei = ethers.parseEther(amountETH.toString());
      const [canContribute, reason] = await this.contract.canContribute(address, amountWei);

      return {
        canContribute,
        reason,
        amountETH: amountETH.toString(),
        amountWei: amountWei.toString(),
      };
    } catch (error) {
      console.error('❌ Failed to check contribution eligibility:', error);
      throw error;
    }
  }

  async isKYCVerified(address) {
    this.ensureInitialized();

    if (!ethers.isAddress(address)) {
      throw new Error('Invalid Ethereum address');
    }

    try {
      return await this.contract.kycVerified(address);
    } catch (error) {
      console.error('❌ Failed to check KYC status:', error);
      throw error;
    }
  }

  async getMaxContributionWei() {
    this.ensureInitialized();

    try {
      const maxWei = await this.contract.getMaxContributionWei();
      return {
        wei: maxWei.toString(),
        eth: ethers.formatEther(maxWei),
        usd: 3300, // Fixed FEC limit
      };
    } catch (error) {
      console.error('❌ Failed to get max contribution:', error);
      throw error;
    }
  }

  // Event listening methods
  async listenToContributions(callback) {
    this.ensureInitialized();

    try {
      this.contract.on(
        'ContributionAccepted',
        (contributor, amount, cumulativeAmount, timestamp, transactionHash, event) => {
          const contributionData = {
            contributor,
            amount: ethers.formatEther(amount),
            cumulativeAmount: ethers.formatEther(cumulativeAmount),
            timestamp: new Date(Number(timestamp) * 1000),
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber,
          };

          callback(contributionData);
        }
      );

      this.contract.on('ContributionRejected', (contributor, amount, reason, timestamp, event) => {
        const rejectionData = {
          contributor,
          amount: ethers.formatEther(amount),
          reason,
          timestamp: new Date(Number(timestamp) * 1000),
          transactionHash: event.transactionHash,
          blockNumber: event.blockNumber,
        };

        callback(rejectionData, true); // true indicates rejection
      });

      console.log('✅ Started listening to contribution events');
    } catch (error) {
      console.error('❌ Failed to set up event listeners:', error);
      throw error;
    }
  }

  async stopListening() {
    if (this.contract) {
      this.contract.removeAllListeners();
      console.log('✅ Stopped listening to contract events');
    }
  }

  // Transaction monitoring
  async waitForTransaction(txHash) {
    this.ensureInitialized();

    try {
      const receipt = await this.provider.waitForTransaction(txHash);
      return {
        success: receipt.status === 1,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        effectiveGasPrice: receipt.effectiveGasPrice?.toString(),
      };
    } catch (error) {
      console.error('❌ Failed to wait for transaction:', error);
      throw error;
    }
  }

  // Network info
  async getNetworkInfo() {
    this.ensureInitialized();

    try {
      const network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();

      return {
        chainId: Number(network.chainId),
        name: network.name,
        currentBlock: blockNumber,
        contractAddress: this.contractAddress,
      };
    } catch (error) {
      console.error('❌ Failed to get network info:', error);
      throw error;
    }
  }

  ensureInitialized() {
    if (!this.initialized) {
      throw new Error('Web3Service not initialized. Call initialize() first.');
    }
  }

  // Cleanup
  async cleanup() {
    await this.stopListening();
    this.provider = null;
    this.contract = null;
    this.initialized = false;
    console.log('✅ Web3Service cleaned up');
  }
}

export default Web3Service;
