# 🚀 Crypto Campaign Unified

> **Consolidated cryptocurrency campaign donation system with Web3 integration**

A production-ready platform for FEC-compliant political campaign donations using cryptocurrency, featuring smart contract integration, KYC verification, and comprehensive audit trails.

## ✨ Features

- **🔗 Smart Contract Integration** - FEC-compliant contribution limits ($3,300)
- **🛡️ KYC Verification** - Built-in identity verification system  
- **💰 Multi-Network Support** - Ethereum, Base, and testnets
- **📊 Real-time Analytics** - Campaign statistics and contribution tracking
- **🔒 Security First** - Rate limiting, input validation, comprehensive logging
- **📱 Responsive Design** - Mobile-optimized donation interface
- **⚡ Lightning Fast** - Optimized for performance and user experience

## 🏗️ Project Structure

```
crypto-campaign-unified/
├── contracts/          # Smart contracts (Solidity)
│   ├── src/           # Contract source code
│   ├── deploy/        # Deployment scripts
│   └── test/          # Contract tests
├── frontend/          # React application
│   ├── src/           # Source code
│   ├── public/        # Static assets
│   └── config/        # Configuration
├── backend/           # Express API server
│   ├── api/           # API routes
│   ├── services/      # Business logic
│   └── middleware/    # Express middleware
├── tests/             # End-to-end tests
│   ├── unit/          # Unit tests
│   ├── integration/   # Integration tests
│   └── e2e/           # Playwright E2E tests
├── scripts/           # Automation scripts
└── docs/              # Documentation
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Git
- MetaMask or compatible Web3 wallet

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/crypto-campaign-unified.git
cd crypto-campaign-unified

# Install all dependencies
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

Visit `http://localhost:3000` to see the application.

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

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenZeppelin for smart contract standards
- Hardhat for development framework
- Wagmi for Web3 React hooks
- Playwright for E2E testing

---

**⚡ Built with Claude Code** - Unified development environment for Web3 applications