// Demo mode service for Web3 functionality when no wallet is connected

class Web3DemoService {
  constructor() {
    this.isDemoMode = true;
    this.mockAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8';
    this.mockBalance = '1000000000000000000'; // 1 ETH in wei
  }

  // Mock wallet connection
  async connect() {
    return {
      address: this.mockAddress,
      network: 'Demo Network',
      chainId: 1337
    };
  }

  // Mock balance check
  async getBalance(address) {
    return this.mockBalance;
  }

  // Mock transaction
  async sendTransaction(to, amount) {
    return {
      hash: '0x' + Math.random().toString(16).substr(2, 64),
      from: this.mockAddress,
      to: to,
      value: amount,
      status: 'success',
      blockNumber: Math.floor(Math.random() * 1000000),
      timestamp: Date.now()
    };
  }

  // Mock contract interaction
  async callContract(contractAddress, method, params) {
    return {
      success: true,
      data: 'Demo response',
      transactionHash: '0x' + Math.random().toString(16).substr(2, 64)
    };
  }

  // Mock donation transaction
  async makeDonation(campaignId, amount) {
    return {
      success: true,
      transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
      campaignId: campaignId,
      amount: amount,
      donor: this.mockAddress,
      timestamp: Date.now(),
      message: 'Demo donation completed successfully'
    };
  }

  // Check if wallet is connected
  isConnected() {
    return true; // Always true in demo mode
  }

  // Get current account
  getCurrentAccount() {
    return this.mockAddress;
  }

  // Mock network info
  getNetworkInfo() {
    return {
      name: 'Demo Network',
      chainId: 1337,
      currency: 'ETH',
      explorerUrl: '#'
    };
  }
}

export const web3DemoService = new Web3DemoService();