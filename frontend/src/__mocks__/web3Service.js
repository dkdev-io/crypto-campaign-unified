import { vi } from 'vitest';

// Mock wallet connection data
const mockWalletData = {
  account: '0x742d35Cc6C4C5e5D0E9dF5F9B6A5e8a2c1B9D8e7',
  balance: '1.5678',
  network: {
    name: 'Ethereum Mainnet',
    chainId: '0x1',
  },
  isConnected: false,
};

// Mock transaction result
const mockTransactionResult = {
  success: true,
  txHash: '0xabc123def456ghi789jkl012mno345pqr678stu901vwx234yz',
  blockNumber: 18500000,
  gasUsed: '21000',
  ethAmount: 0.0333,
};

// Mock contributor info
const mockContributorInfo = {
  isKYCVerified: true,
  cumulativeAmount: 0.5,
  remainingCapacity: 1.0,
  contributionCount: 2,
};

// Mock web3Service
const web3Service = {
  // Initialization
  init: vi.fn(() => Promise.resolve(true)),

  // Wallet connection
  connectWallet: vi.fn(() =>
    Promise.resolve({
      success: true,
      account: mockWalletData.account,
      network: mockWalletData.network,
    })
  ),

  disconnectWallet: vi.fn(() => Promise.resolve()),

  // Account info
  getBalance: vi.fn(() => Promise.resolve(mockWalletData.balance)),
  getNetworkInfo: vi.fn(() => Promise.resolve(mockWalletData.network)),

  // Contributions
  canContribute: vi.fn(() =>
    Promise.resolve({
      canContribute: true,
      reason: null,
      remainingCapacity: 1.0,
    })
  ),

  contribute: vi.fn(() => Promise.resolve(mockTransactionResult)),

  getContributorInfo: vi.fn(() => Promise.resolve(mockContributorInfo)),

  // Utilities
  convertUSDToETH: vi.fn((usdAmount) => Promise.resolve(usdAmount / 3000)), // $3000 per ETH
  convertETHToUSD: vi.fn((ethAmount) => Promise.resolve(ethAmount * 3000)),

  // Event listeners
  setupEventListeners: vi.fn((onAccountChange, onNetworkChange) => {
    // Store callbacks for manual triggering in tests
    web3Service._onAccountChange = onAccountChange;
    web3Service._onNetworkChange = onNetworkChange;
  }),

  removeEventListeners: vi.fn(),

  // Test helpers (not part of actual service)
  _triggerAccountChange: (newAccount) => {
    if (web3Service._onAccountChange) {
      web3Service._onAccountChange(newAccount);
    }
  },

  _triggerNetworkChange: (chainId) => {
    if (web3Service._onNetworkChange) {
      web3Service._onNetworkChange(chainId);
    }
  },
};

// Configuration helpers for tests
export const configureWeb3Mock = {
  // Set wallet connection state
  setConnected: (connected = true) => {
    mockWalletData.isConnected = connected;
    if (connected) {
      web3Service.connectWallet.mockResolvedValue({
        success: true,
        account: mockWalletData.account,
        network: mockWalletData.network,
      });
    } else {
      web3Service.connectWallet.mockResolvedValue({
        success: false,
        error: 'User rejected connection',
      });
    }
  },

  // Set contribution eligibility
  setCanContribute: (canContribute = true, reason = null) => {
    web3Service.canContribute.mockResolvedValue({
      canContribute,
      reason,
      remainingCapacity: canContribute ? 1.0 : 0,
    });
  },

  // Set transaction result
  setTransactionResult: (success = true, error = null) => {
    if (success) {
      web3Service.contribute.mockResolvedValue(mockTransactionResult);
    } else {
      web3Service.contribute.mockRejectedValue(new Error(error || 'Transaction failed'));
    }
  },

  // Set KYC status
  setKYCStatus: (isVerified = true) => {
    web3Service.getContributorInfo.mockResolvedValue({
      ...mockContributorInfo,
      isKYCVerified: isVerified,
    });
  },

  // Set MetaMask availability
  setMetaMaskAvailable: (available = true) => {
    web3Service.init.mockResolvedValue(available);
    if (!available) {
      web3Service.connectWallet.mockRejectedValue(new Error('MetaMask not found'));
    }
  },

  // Reset all mocks
  reset: () => {
    vi.clearAllMocks();
    mockWalletData.isConnected = false;
    web3Service.connectWallet.mockResolvedValue({
      success: true,
      account: mockWalletData.account,
      network: mockWalletData.network,
    });
  },
};

export default web3Service;
export { mockWalletData, mockTransactionResult, mockContributorInfo };
