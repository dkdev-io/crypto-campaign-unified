# Web3 Security Fixes and Code Recommendations

## 🔴 CRITICAL FIX 1: Remove Hardcoded API Key

**Current Issue**: FEC API key exposed in client-side code

### Fix Implementation:

**Step 1**: Update environment variables
```bash
# Add to frontend/.env
VITE_FEC_API_KEY=F7QA9sKDcXZOjuqz2nk7DzZXLenyzf3GEYaZqpFD
```

**Step 2**: Update FEC config to use environment variable
```javascript
// frontend/src/lib/fec-config.js
const FEC_CONFIG = {
  // Use environment variable instead of hardcoded key
  API_KEY: import.meta.env.VITE_FEC_API_KEY || '',
  
  BASE_URL: 'https://api.open.fec.gov/v1',
  // ... rest of config
};

// Add validation
if (!FEC_CONFIG.API_KEY && import.meta.env.MODE === 'production') {
  console.error('FEC API key not configured');
}
```

## 🔴 CRITICAL FIX 2: Resolve Git Conflicts

**Issue**: Unresolved merge conflicts in package.json

### Commands to fix:
```bash
cd /Users/Danallovertheplace/crypto-campaign-unified
git checkout HEAD -- package.json
git add package.json
git commit -m "Resolve merge conflicts in package.json"
```

## 🟡 HIGH PRIORITY FIX 1: Dynamic Contract Configuration

**Issue**: Hardcoded contract address pointing to localhost

### Enhanced Contract Configuration:

```javascript
// frontend/src/lib/contract-config.js
const getNetworkConfig = (networkId) => {
  const configs = {
    // Local development
    '31337': {
      CONTRACT_ADDRESS: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
      NETWORK_NAME: 'Hardhat Local',
      RPC_URL: 'http://localhost:8545'
    },
    // Sepolia testnet
    '11155111': {
      CONTRACT_ADDRESS: import.meta.env.VITE_SEPOLIA_CONTRACT_ADDRESS,
      NETWORK_NAME: 'Sepolia Testnet',
      RPC_URL: import.meta.env.VITE_SEPOLIA_RPC_URL
    },
    // Base Sepolia
    '84532': {
      CONTRACT_ADDRESS: import.meta.env.VITE_BASE_SEPOLIA_CONTRACT_ADDRESS,
      NETWORK_NAME: 'Base Sepolia',
      RPC_URL: 'https://sepolia.base.org'
    },
    // Base Mainnet
    '8453': {
      CONTRACT_ADDRESS: import.meta.env.VITE_BASE_CONTRACT_ADDRESS,
      NETWORK_NAME: 'Base Mainnet',
      RPC_URL: 'https://mainnet.base.org'
    }
  };

  const config = configs[networkId];
  if (!config) {
    throw new Error(`Unsupported network: ${networkId}`);
  }
  
  // Validate contract address exists
  if (!config.CONTRACT_ADDRESS || config.CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') {
    throw new Error(`Contract address not configured for network ${networkId}`);
  }
  
  return config;
};

export { getNetworkConfig };
```

## 🟡 HIGH PRIORITY FIX 2: Improved Error Handling

### Enhanced Web3 Service Error Handling:

```javascript
// frontend/src/lib/web3-errors.js
export class Web3Error extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'Web3Error';
    this.code = code;
    this.details = details;
  }
}

export const WEB3_ERROR_CODES = {
  WALLET_NOT_FOUND: 'WALLET_NOT_FOUND',
  WALLET_LOCKED: 'WALLET_LOCKED',
  WRONG_NETWORK: 'WRONG_NETWORK',
  TRANSACTION_REJECTED: 'TRANSACTION_REJECTED',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  CONTRACT_ERROR: 'CONTRACT_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR'
};

export const getUserFriendlyError = (error) => {
  if (error.code === 4001) {
    return {
      title: 'Transaction Rejected',
      message: 'You rejected the transaction in your wallet.',
      action: 'Please approve the transaction to continue.'
    };
  }
  
  if (error.code === -32002) {
    return {
      title: 'Wallet Busy',
      message: 'Your wallet already has a pending request.',
      action: 'Please check your wallet and approve or reject pending requests.'
    };
  }
  
  if (error.message?.includes('insufficient funds')) {
    return {
      title: 'Insufficient Balance',
      message: 'You don\'t have enough ETH for this transaction.',
      action: 'Please add more ETH to your wallet and try again.'
    };
  }
  
  // Default error
  return {
    title: 'Transaction Failed',
    message: 'An unexpected error occurred.',
    action: 'Please try again or contact support if the issue persists.',
    details: error.message
  };
};
```

### Enhanced Web3 Service with Better Error Handling:

```javascript
// Enhanced contribute method with better error handling
async contribute(amountInETH) {
  try {
    if (!this.contract || !this.signer) {
      throw new Web3Error('Contract or signer not initialized', WEB3_ERROR_CODES.CONTRACT_ERROR);
    }

    // Validate network first
    const isCorrectNetwork = await this.checkNetwork();
    if (!isCorrectNetwork) {
      throw new Web3Error('Please switch to the correct network', WEB3_ERROR_CODES.WRONG_NETWORK);
    }

    const amountInWei = ethers.parseEther(amountInETH.toString());
    
    // Check balance
    const balance = await this.provider.getBalance(this.account);
    if (balance < amountInWei) {
      throw new Web3Error('Insufficient balance for contribution', WEB3_ERROR_CODES.INSUFFICIENT_FUNDS);
    }

    // Pre-flight checks
    const eligibility = await this.canContribute(this.account, amountInETH);
    if (!eligibility.canContribute) {
      throw new Web3Error(`Contribution not allowed: ${eligibility.reason}`, WEB3_ERROR_CODES.CONTRACT_ERROR);
    }

    // Estimate gas with better error handling
    let gasEstimate;
    try {
      gasEstimate = await this.contract.contribute.estimateGas({
        value: amountInWei
      });
    } catch (gasError) {
      throw new Web3Error('Failed to estimate gas. Transaction may fail.', WEB3_ERROR_CODES.CONTRACT_ERROR, gasError);
    }

    // Send transaction with timeout
    const tx = await Promise.race([
      this.contract.contribute({
        value: amountInWei,
        gasLimit: gasEstimate * 120n / 100n
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Transaction timeout')), 60000)
      )
    ]);

    // Wait for confirmation with timeout
    const receipt = await Promise.race([
      tx.wait(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Confirmation timeout')), 300000)
      )
    ]);

    if (receipt.status !== 1) {
      throw new Web3Error('Transaction failed during execution', WEB3_ERROR_CODES.TRANSACTION_REJECTED);
    }

    return {
      success: true,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      effectiveGasPrice: receipt.effectiveGasPrice?.toString()
    };

  } catch (error) {
    const friendlyError = getUserFriendlyError(error);
    
    return {
      success: false,
      error: friendlyError.message,
      code: error.code || WEB3_ERROR_CODES.CONTRACT_ERROR,
      userFriendlyError: friendlyError
    };
  }
}
```

## 🟡 HIGH PRIORITY FIX 3: Network Switching Without Page Reload

```javascript
// Enhanced network change handling
setupEventListeners(onAccountChange, onNetworkChange) {
  if (window.ethereum) {
    window.ethereum.on('accountsChanged', (accounts) => {
      console.log('🔄 Account changed:', accounts[0]);
      if (accounts.length === 0) {
        this.disconnectWallet();
      } else {
        this.account = accounts[0];
        // Reinitialize contract with new account
        this.initializeContractWithNewAccount(accounts[0]);
      }
      if (onAccountChange) onAccountChange(accounts[0]);
    });

    window.ethereum.on('chainChanged', async (chainId) => {
      console.log('🔄 Network changed:', chainId);
      
      try {
        // Don't reload page, handle gracefully
        const networkId = parseInt(chainId, 16).toString();
        const networkConfig = getNetworkConfig(networkId);
        
        // Update provider and contract
        this.provider = new ethers.BrowserProvider(window.ethereum);
        if (this.account) {
          this.signer = await this.provider.getSigner();
          this.contract = new ethers.Contract(
            networkConfig.CONTRACT_ADDRESS,
            CAMPAIGN_CONTRACT_ABI,
            this.signer
          );
        }
        
        if (onNetworkChange) {
          onNetworkChange({
            chainId: networkId,
            name: networkConfig.NETWORK_NAME,
            supported: true
          });
        }
        
      } catch (error) {
        console.error('❌ Unsupported network:', error);
        if (onNetworkChange) {
          onNetworkChange({
            chainId: parseInt(chainId, 16).toString(),
            name: 'Unknown Network',
            supported: false,
            error: error.message
          });
        }
      }
    });
  }
}

async initializeContractWithNewAccount(account) {
  if (this.provider && account) {
    try {
      this.signer = await this.provider.getSigner();
      if (this.contractAddress) {
        this.contract = new ethers.Contract(
          this.contractAddress,
          CAMPAIGN_CONTRACT_ABI,
          this.signer
        );
      }
    } catch (error) {
      console.error('Failed to reinitialize contract with new account:', error);
    }
  }
}
```

## 🟡 HIGH PRIORITY FIX 4: Multi-Wallet Support

```javascript
// frontend/src/lib/wallet-providers.js
export const WALLET_TYPES = {
  METAMASK: 'metamask',
  WALLETCONNECT: 'walletconnect',
  COINBASE: 'coinbase'
};

export class WalletManager {
  constructor() {
    this.currentWallet = null;
    this.provider = null;
  }

  async detectWallets() {
    const wallets = [];
    
    // MetaMask
    if (window.ethereum?.isMetaMask) {
      wallets.push({
        type: WALLET_TYPES.METAMASK,
        name: 'MetaMask',
        icon: '/icons/metamask.svg',
        available: true
      });
    }
    
    // Coinbase Wallet
    if (window.ethereum?.isCoinbaseWallet) {
      wallets.push({
        type: WALLET_TYPES.COINBASE,
        name: 'Coinbase Wallet',
        icon: '/icons/coinbase.svg',
        available: true
      });
    }
    
    // WalletConnect - always available
    wallets.push({
      type: WALLET_TYPES.WALLETCONNECT,
      name: 'WalletConnect',
      icon: '/icons/walletconnect.svg',
      available: true
    });
    
    return wallets;
  }

  async connectWallet(walletType) {
    switch (walletType) {
      case WALLET_TYPES.METAMASK:
        return this.connectMetaMask();
      case WALLET_TYPES.WALLETCONNECT:
        return this.connectWalletConnect();
      case WALLET_TYPES.COINBASE:
        return this.connectCoinbase();
      default:
        throw new Error(`Unsupported wallet type: ${walletType}`);
    }
  }

  async connectMetaMask() {
    if (!window.ethereum?.isMetaMask) {
      throw new Error('MetaMask not found');
    }
    
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    });
    
    this.provider = new ethers.BrowserProvider(window.ethereum);
    this.currentWallet = WALLET_TYPES.METAMASK;
    
    return accounts[0];
  }
  
  // Add WalletConnect and Coinbase implementations
}
```

## 📋 Implementation Priority

1. **Immediate (Today)**:
   - Fix hardcoded FEC API key
   - Resolve Git merge conflicts
   - Add basic error handling

2. **This Week**:
   - Implement dynamic contract configuration
   - Add network switching without reload
   - Improve transaction error messages

3. **Next Week**:
   - Add multi-wallet support
   - Implement comprehensive monitoring
   - Add transaction retry mechanisms

4. **Next Sprint**:
   - Add advanced security features
   - Implement audit logging
   - Optimize performance

Each fix should be implemented with proper testing and staged deployment to avoid introducing new issues.