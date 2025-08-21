// Campaign Contributions Contract ABI
// Generated from CampaignContributions.sol

export const CAMPAIGN_CONTRACT_ABI = [
  // Constructor
  {
    "inputs": [
      {"internalType": "address", "name": "_campaignTreasury", "type": "address"},
      {"internalType": "address", "name": "_initialOwner", "type": "address"}
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  
  // Main contribution function
  {
    "inputs": [],
    "name": "contribute",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  
  // KYC functions
  {
    "inputs": [{"internalType": "address", "name": "_contributor", "type": "address"}],
    "name": "verifyKYC",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  
  {
    "inputs": [{"internalType": "address[]", "name": "_contributors", "type": "address[]"}],
    "name": "batchVerifyKYC",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  
  // View functions
  {
    "inputs": [{"internalType": "address", "name": "_contributor", "type": "address"}],
    "name": "getRemainingContributionCapacity",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  
  {
    "inputs": [
      {"internalType": "address", "name": "_contributor", "type": "address"},
      {"internalType": "uint256", "name": "_amount", "type": "uint256"}
    ],
    "name": "canContribute",
    "outputs": [
      {"internalType": "bool", "name": "canContribute", "type": "bool"},
      {"internalType": "string", "name": "reason", "type": "string"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  
  {
    "inputs": [{"internalType": "address", "name": "_contributor", "type": "address"}],
    "name": "getContributorInfo",
    "outputs": [
      {"internalType": "uint256", "name": "cumulativeAmount", "type": "uint256"},
      {"internalType": "uint256", "name": "remainingCapacity", "type": "uint256"},
      {"internalType": "bool", "name": "isKYCVerified", "type": "bool"},
      {"internalType": "bool", "name": "hasContributedBefore", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  
  {
    "inputs": [],
    "name": "getMaxContributionWei",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  
  {
    "inputs": [],
    "name": "getCampaignStats",
    "outputs": [
      {"internalType": "uint256", "name": "totalReceived", "type": "uint256"},
      {"internalType": "uint256", "name": "uniqueContributors", "type": "uint256"},
      {"internalType": "uint256", "name": "maxContribution", "type": "uint256"},
      {"internalType": "uint256", "name": "currentEthPrice", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  
  // State variables (view functions)
  {
    "inputs": [],
    "name": "campaignTreasury",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  
  {
    "inputs": [],
    "name": "totalContributionsReceived",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  
  {
    "inputs": [{"internalType": "address", "name": "", "type": "address"}],
    "name": "kycVerified",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  
  {
    "inputs": [{"internalType": "address", "name": "", "type": "address"}],
    "name": "cumulativeContributions",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  
  // Events
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "contributor", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "cumulativeAmount", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256"},
      {"indexed": true, "internalType": "bytes32", "name": "transactionHash", "type": "bytes32"}
    ],
    "name": "ContributionAccepted",
    "type": "event"
  },
  
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "contributor", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"},
      {"indexed": false, "internalType": "string", "name": "reason", "type": "string"},
      {"indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256"}
    ],
    "name": "ContributionRejected",
    "type": "event"
  },
  
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "contributor", "type": "address"},
      {"indexed": false, "internalType": "bool", "name": "verified", "type": "bool"},
      {"indexed": true, "internalType": "address", "name": "verifier", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256"}
    ],
    "name": "KYCStatusUpdated",
    "type": "event"
  },
  
  // Receive function
  {
    "stateMutability": "payable",
    "type": "receive"
  }
];

// Contract configuration
export const CONTRACT_CONFIG = {
  // You'll need to update these with your deployed contract details
  CONTRACT_ADDRESS: process.env.VITE_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',
  NETWORK_ID: process.env.VITE_NETWORK_ID || '11155111', // Sepolia testnet
  NETWORK_NAME: process.env.VITE_NETWORK_NAME || 'Sepolia',
  RPC_URL: process.env.VITE_RPC_URL || 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY',
  
  // FEC limits
  MAX_CONTRIBUTION_USD: 3300,
  DEFAULT_ETH_PRICE_USD: 3000,
  
  // Gas settings
  GAS_LIMIT: 300000,
  GAS_PRICE: '20000000000' // 20 gwei
};

export default { CAMPAIGN_CONTRACT_ABI, CONTRACT_CONFIG };