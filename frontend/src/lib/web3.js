import { ethers } from 'ethers';
import { CAMPAIGN_CONTRACT_ABI, CONTRACT_CONFIG } from './contract-abi.js';

class Web3Service {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.account = null;
    this.isConnected = false;
  }

  // Initialize Web3 connection
  async init() {
    try {
      if (typeof window.ethereum !== 'undefined') {
        this.provider = new ethers.BrowserProvider(window.ethereum);
        console.log('✅ Web3 provider initialized');
        return true;
      } else {
        console.error('❌ MetaMask not found');
        return false;
      }
    } catch (error) {
      console.error('❌ Web3 initialization failed:', error);
      return false;
    }
  }

  // Connect wallet (MetaMask)
  async connectWallet() {
    try {
      if (!this.provider) {
        throw new Error('Web3 provider not initialized');
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      this.account = accounts[0];
      this.signer = await this.provider.getSigner();
      this.isConnected = true;

      // Initialize contract
      if (CONTRACT_CONFIG.CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000') {
        this.contract = new ethers.Contract(
          CONTRACT_CONFIG.CONTRACT_ADDRESS,
          CAMPAIGN_CONTRACT_ABI,
          this.signer
        );
      }

      console.log('✅ Wallet connected:', this.account);

      // Check network
      await this.checkNetwork();

      return {
        success: true,
        account: this.account,
        network: await this.getNetworkInfo()
      };

    } catch (error) {
      console.error('❌ Wallet connection failed:', error);
      this.isConnected = false;
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Disconnect wallet
  async disconnectWallet() {
    this.account = null;
    this.signer = null;
    this.contract = null;
    this.isConnected = false;
    console.log('👋 Wallet disconnected');
  }

  // Check if correct network
  async checkNetwork() {
    try {
      const network = await this.provider.getNetwork();
      const chainId = network.chainId.toString();
      
      if (chainId !== CONTRACT_CONFIG.NETWORK_ID) {
        console.warn(`⚠️ Wrong network. Expected: ${CONTRACT_CONFIG.NETWORK_NAME} (${CONTRACT_CONFIG.NETWORK_ID}), Got: ${chainId}`);
        return false;
      }
      
      console.log(`✅ Connected to ${CONTRACT_CONFIG.NETWORK_NAME}`);
      return true;
    } catch (error) {
      console.error('❌ Network check failed:', error);
      return false;
    }
  }

  // Get network information
  async getNetworkInfo() {
    try {
      const network = await this.provider.getNetwork();
      return {
        chainId: network.chainId.toString(),
        name: network.name
      };
    } catch (error) {
      console.error('❌ Failed to get network info:', error);
      return null;
    }
  }

  // Get account balance
  async getBalance() {
    try {
      if (!this.account || !this.provider) {
        throw new Error('Wallet not connected');
      }

      const balance = await this.provider.getBalance(this.account);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('❌ Failed to get balance:', error);
      return '0';
    }
  }

  // Check if address has KYC verification
  async checkKYCStatus(address) {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const isVerified = await this.contract.kycVerified(address);
      console.log(`🔍 KYC Status for ${address}:`, isVerified);
      return isVerified;
    } catch (error) {
      console.error('❌ Failed to check KYC status:', error);
      return false;
    }
  }

  // Get contributor information
  async getContributorInfo(address) {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const info = await this.contract.getContributorInfo(address);
      return {
        cumulativeAmount: ethers.formatEther(info.cumulativeAmount),
        remainingCapacity: ethers.formatEther(info.remainingCapacity),
        isKYCVerified: info.isKYCVerified,
        hasContributedBefore: info.hasContributedBefore
      };
    } catch (error) {
      console.error('❌ Failed to get contributor info:', error);
      return null;
    }
  }

  // Check if contribution is allowed
  async canContribute(address, amountInETH) {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const amountInWei = ethers.parseEther(amountInETH.toString());
      const result = await this.contract.canContribute(address, amountInWei);
      
      return {
        canContribute: result.canContribute,
        reason: result.reason
      };
    } catch (error) {
      console.error('❌ Failed to check contribution eligibility:', error);
      return {
        canContribute: false,
        reason: error.message
      };
    }
  }

  // Make a contribution
  async contribute(amountInETH) {
    try {
      if (!this.contract || !this.signer) {
        throw new Error('Contract or signer not initialized');
      }

      console.log(`💰 Contributing ${amountInETH} ETH...`);

      const amountInWei = ethers.parseEther(amountInETH.toString());
      
      // Check if contribution is allowed first
      const eligibility = await this.canContribute(this.account, amountInETH);
      if (!eligibility.canContribute) {
        throw new Error(`Contribution not allowed: ${eligibility.reason}`);
      }

      // Estimate gas
      const gasEstimate = await this.contract.contribute.estimateGas({
        value: amountInWei
      });

      // Send transaction
      const tx = await this.contract.contribute({
        value: amountInWei,
        gasLimit: gasEstimate * 120n / 100n // Add 20% buffer
      });

      console.log('📤 Transaction sent:', tx.hash);

      // Wait for confirmation
      const receipt = await tx.wait();
      console.log('✅ Transaction confirmed:', receipt.hash);

      return {
        success: true,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };

    } catch (error) {
      console.error('❌ Contribution failed:', error);
      return {
        success: false,
        error: error.message,
        code: error.code
      };
    }
  }

  // Get campaign statistics
  async getCampaignStats() {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const stats = await this.contract.getCampaignStats();
      return {
        totalReceived: ethers.formatEther(stats.totalReceived),
        uniqueContributors: stats.uniqueContributors.toString(),
        maxContribution: ethers.formatEther(stats.maxContribution),
        currentEthPrice: ethers.formatUnits(stats.currentEthPrice, 18)
      };
    } catch (error) {
      console.error('❌ Failed to get campaign stats:', error);
      return null;
    }
  }

  // Convert USD to ETH based on contract's ETH price
  async convertUSDToETH(usdAmount) {
    try {
      if (!this.contract) {
        // Use default price if contract not available
        return usdAmount / CONTRACT_CONFIG.DEFAULT_ETH_PRICE_USD;
      }

      const stats = await this.getCampaignStats();
      const ethPriceUSD = parseFloat(stats.currentEthPrice);
      return usdAmount / ethPriceUSD;
    } catch (error) {
      console.error('❌ Failed to convert USD to ETH:', error);
      return usdAmount / CONTRACT_CONFIG.DEFAULT_ETH_PRICE_USD;
    }
  }

  // Listen for account changes
  setupEventListeners(onAccountChange, onNetworkChange) {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        console.log('🔄 Account changed:', accounts[0]);
        if (accounts.length === 0) {
          this.disconnectWallet();
        } else {
          this.account = accounts[0];
        }
        if (onAccountChange) onAccountChange(accounts[0]);
      });

      window.ethereum.on('chainChanged', (chainId) => {
        console.log('🔄 Network changed:', chainId);
        if (onNetworkChange) onNetworkChange(chainId);
        // Reload to ensure proper network handling
        window.location.reload();
      });
    }
  }

  // Remove event listeners
  removeEventListeners() {
    if (window.ethereum) {
      window.ethereum.removeAllListeners('accountsChanged');
      window.ethereum.removeAllListeners('chainChanged');
    }
  }
}

// Create singleton instance
export const web3Service = new Web3Service();

// Export for direct usage
export default web3Service;