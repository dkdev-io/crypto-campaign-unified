# 🚀 Crypto Campaign Unified

> **Consolidated cryptocurrency campaign donation system with Web3 integration and multi-platform sync support**

A production-ready platform for FEC-compliant political campaign donations using cryptocurrency, featuring smart contract integration, KYC verification, comprehensive audit trails, and seamless multi-platform development workflow.

## ✨ Features

- **🔗 Smart Contract Integration** - FEC-compliant contribution limits ($3,300)
- **🛡️ KYC Verification** - Built-in identity verification system  
- **💰 Multi-Network Support** - Ethereum, Base, and testnets
- **📊 Real-time Analytics** - Campaign statistics and contribution tracking
- **🔒 Security First** - Rate limiting, input validation, comprehensive logging
- **📱 Responsive Design** - Mobile-optimized donation interface
- **⚡ Lightning Fast** - Optimized for performance and user experience
- **🔄 Multi-Platform Sync** - Seamless development across Lovable, Replit, and Local

## 🔄 Multi-Platform Sync Workflow

This project supports development across **Lovable**, **Replit**, and **Local** environments with automatic two-way synchronization through GitHub.

### Quick Start

1. **Initial Setup** (run once):
   ```bash
   ./sync-setup.sh
   # OR
   npm run sync:setup
   ```

2. **Before Working** (always run first):
   ```bash
   ./sync-start.sh
   # OR
   npm run sync:start
   ```

3. **After Changes** (save your work):
   ```bash
   ./sync-save.sh
   # OR
   npm run sync:save
   ```

4. **Fix Conflicts** (if needed):
   ```bash
   ./sync-fix.sh
   # OR
   npm run sync:fix
   ```

## 🏗️ Unified Project Structure

```
crypto-campaign-unified/
├── contracts/              # Smart contracts (Solidity + Hardhat)
│   ├── src/               # Contract source code  
│   ├── deploy/            # Deployment scripts
│   ├── test/              # Smart contract tests
│   └── hardhat.config.js  # Hardhat configuration
├── frontend/              # React application
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── setup/     # Campaign setup wizard
│   │   │   └── DonorForm.jsx # Main donation form
│   │   ├── hooks/         # Custom React hooks (useWeb3)
│   │   └── lib/           # Web3 integration, Supabase
│   ├── public/            # Static assets
│   └── package.json       # Frontend dependencies
├── backend/               # Express API server
│   ├── src/
│   │   ├── routes/        # API endpoints
│   │   └── services/      # Business logic (Web3Service)
│   └── package.json       # Backend dependencies
├── src/                   # Legacy structure (for compatibility)
│   ├── components/        # Original components
│   └── lib/              # Original libraries
├── tests/                 # End-to-end tests (Playwright)
│   ├── unit/              # Unit tests
│   ├── integration/       # Integration tests
│   └── e2e/               # E2E test scenarios
├── scripts/               # Automation scripts
│   └── automation/        # Release, versioning, boundaries
├── docs/                  # Documentation
├── sync-*.sh              # Multi-platform sync scripts
├── package.json           # Root workspace configuration
└── README.md              # This file
```

## 🚀 Installation & Setup

### Prerequisites
- Node.js 18+
- Git
- MetaMask or compatible Web3 wallet

### Installation

```bash
# Clone the repository
git clone https://github.com/dkdev-io/crypto-campaign-unified.git
cd crypto-campaign-unified

# Install all dependencies (uses workspaces)
npm run install:all

# Set up environment variables
cp contracts/.env.example contracts/.env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit .env files with your configuration
```

### Development

```bash
# Start local blockchain (terminal 1)
npm run node

# Deploy contracts to local network (terminal 2)
npm run deploy:local

# Start development servers (terminal 3)
npm run dev
```

Visit `http://localhost:5173` to see the application.

## 🔧 Environment Setup

### Smart Contracts (.env in /contracts/)
```bash
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
MAINNET_RPC_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
PRIVATE_KEY=your_deployer_private_key
ETHERSCAN_API_KEY=your_etherscan_api_key
BASESCAN_API_KEY=your_basescan_api_key
```

### Backend (.env in /backend/)
```bash
PORT=3001
NODE_ENV=development
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
WEB3_NETWORK=localhost
```

### Frontend (.env in /frontend/)
```bash
VITE_API_URL=http://localhost:3001
VITE_CONTRACT_ADDRESS_LOCAL=0x5FbDB2315678afecb367f032d93F642f64180aa3
VITE_CONTRACT_ADDRESS_SEPOLIA=your_sepolia_contract_address
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:contracts      # Smart contract tests
npm run test:frontend       # Frontend unit tests
npm run test:e2e           # End-to-end tests

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

## 🌐 Platform Integration

### Lovable
- Automatically syncs with GitHub
- Pull latest: `npm run sync:start`
- Push changes: `npm run sync:save`
- Focus on UI/UX development

### Replit
- Manual GitHub sync required
- Use sync scripts for two-way sync
- Handles environment differences
- Best for smart contract development

### Local Development
- Full git control
- All sync scripts available
- Best for complex conflict resolution
- Complete development environment

## 🚀 Deployment

### Testnet Deployment
```bash
# Deploy to Sepolia testnet
npm run deploy:testnet

# Verify contract
npm run verify
```

### Production Deployment
```bash
# Deploy to mainnet (use with extreme caution)
npm run deploy:mainnet

# Build production frontend
npm run build

# Start production servers
npm run start:prod
```

## 📚 API Documentation

### Campaign Endpoints
- `GET /api/campaign/stats` - Get campaign statistics
- `GET /api/campaign/info` - Get campaign information

### Contribution Endpoints  
- `POST /api/contributions/check` - Check contribution eligibility
- `GET /api/contributions/contributor/:address` - Get contributor info
- `POST /api/contributions/transaction/monitor` - Monitor transaction

### KYC Endpoints
- `POST /api/kyc/verify` - Submit KYC verification
- `GET /api/kyc/status/:address` - Check KYC status

## 🔒 Security Features

- **Smart Contract Security**: OpenZeppelin standards, reentrancy protection
- **API Security**: Rate limiting, input validation, CORS protection
- **Data Security**: Environment variable protection, secure key management
- **Network Security**: Multi-network support with automatic detection

## 🔧 Troubleshooting

### Common Issues

1. **"Not a git repository"**
   - Run: `npm run sync:setup`

2. **Push rejected**
   - Run: `npm run sync:start` then `npm run sync:save`

3. **Merge conflicts**
   - Run: `npm run sync:fix`

4. **Authentication failed**
   - Check GitHub credentials
   - Use personal access token if needed

### Platform-Specific Notes

- **Lovable**: May auto-format code, commit before major changes
- **Replit**: Environment resets may require `npm install`
- **Local**: Full control, use for complex debugging

## 📊 Sync Status

The sync scripts provide clear status indicators:
- ✅ **Green**: Success
- ⚠️ **Yellow**: Warning or action needed  
- ❌ **Red**: Error requiring attention
- 🔄 **Blue**: In progress

## 🤝 Contributing

1. Fork the repository
2. Run `npm run sync:setup` with your fork URL
3. Use the sync workflow for all changes
4. Submit pull requests from feature branches

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenZeppelin for smart contract standards
- Hardhat for development framework
- Wagmi for Web3 React hooks
- Playwright for E2E testing

---

**⚡ Built with Claude Code** - Unified development environment for Web3 applications