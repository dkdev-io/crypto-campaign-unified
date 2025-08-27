# MVP Data Flow Documentation

## Overview
This document describes the complete data flow for the Crypto Campaign MVP, demonstrating how all components work together to create a functioning donation platform.

## System Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Frontend (UI)  │────▶│  Smart Contract │────▶│  Blockchain     │
│  React + Vite   │     │  (Ethereum)     │     │  (Base/Sepolia) │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │
│    Supabase     │     │  Mock KYC Data  │
│   (User Auth)   │     │    (Testing)    │
│                 │     │                 │
└─────────────────┘     └─────────────────┘
```

## Data Flow Steps

### 1. Smart Contract Initialization
- **Contract Address**: `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512` (local)
- **Network**: Hardhat Local (Chain ID: 31337)
- **Treasury Address**: Configured at deployment
- **Max Contribution**: $3,300 USD (converted to ETH)

### 2. User Registration Flow
```
User → Frontend → Supabase Auth → Database
                     ↓
              Email Verification
                     ↓
               Account Created
```

**Data Stored**:
- Email address
- Password (hashed)
- User ID (UUID)
- Registration timestamp
- Email verification status

### 3. KYC Verification (Mock for MVP)
```
Admin → Admin Dashboard → Smart Contract
            ↓
    verifyKYC(address)
            ↓
    Address Whitelisted
```

**Current Implementation**:
- Admin manually verifies addresses
- No external KYC API integration (future enhancement)
- Verification stored on-chain

### 4. Contribution Flow

#### 4.1 Pre-Contribution Checks
```javascript
// Frontend checks
1. User authenticated? → Check Supabase session
2. Wallet connected? → Check MetaMask connection
3. Correct network? → Verify chain ID
4. KYC verified? → Call contract.kycVerified(address)
5. Within limits? → Call contract.canContribute(address, amount)
```

#### 4.2 Contribution Transaction
```javascript
// Transaction flow
1. User enters amount in USD
2. Frontend converts USD → ETH using contract price
3. User confirms transaction in MetaMask
4. Contract.contribute() called with ETH value
5. Contract validates:
   - KYC status
   - Amount within per-transaction limit ($3,300)
   - Amount within cumulative limit ($3,300)
6. If valid:
   - ETH transferred to treasury
   - Event emitted: ContributionAccepted
7. If invalid:
   - Transaction reverted
   - Event emitted: ContributionRejected
```

#### 4.3 Post-Contribution
```javascript
// Data recording
1. Transaction hash recorded
2. Contribution amount stored on-chain
3. Cumulative amount updated
4. Campaign statistics updated
5. Frontend shows success confirmation
```

### 5. Data Storage Locations

#### On-Chain (Smart Contract)
- KYC verification status
- Contribution amounts
- Cumulative totals per address
- Campaign statistics
- Treasury address
- ETH price for conversions

#### Off-Chain (Supabase)
- User profiles
- Email addresses
- Authentication tokens
- Session data
- UI preferences

#### Local Storage (Browser)
- Wallet connection state
- Selected network
- User preferences
- Recent transaction hashes

### 6. Admin Dashboard Data

The admin dashboard displays real-time data from multiple sources:

```javascript
// Data sources
const dashboardData = {
  // From Smart Contract
  totalRaised: contract.totalContributionsReceived(),
  uniqueDonors: contract.totalUniqueContributors(),
  ethPrice: contract.ethPriceUSD(),
  
  // From Supabase
  totalUsers: supabase.from('users').count(),
  verifiedUsers: supabase.from('users').where('kyc_status', 'verified'),
  
  // Calculated
  conversionRate: (verifiedUsers / totalUsers) * 100,
  averageContribution: totalRaised / uniqueDonors
}
```

## Testing the Complete Flow

### Prerequisites
1. Hardhat node running: `npx hardhat node`
2. Contract deployed: `npm run deploy:local`
3. Frontend running: `npm run dev:frontend` (port 3100)
4. Admin credentials available

### Test Sequence
1. **Start Services**
   ```bash
   # Terminal 1: Blockchain
   npx hardhat node
   
   # Terminal 2: Deploy Contract
   npm run deploy:local
   
   # Terminal 3: Frontend
   cd frontend && npm run dev
   ```

2. **User Registration**
   - Navigate to http://localhost:3100
   - Click "Sign Up"
   - Enter email and password
   - Verify email (check console for mock verification)

3. **Admin KYC Approval**
   - Login as admin
   - Navigate to Admin Dashboard
   - Find user's wallet address
   - Click "Verify KYC"

4. **Make Contribution**
   - Connect MetaMask wallet
   - Enter contribution amount (max $3,300)
   - Confirm transaction
   - View success confirmation

5. **Verify Data**
   - Check contract: `getCampaignStats()`
   - Check user info: `getContributorInfo(address)`
   - View admin dashboard statistics

## API Endpoints (Backend)

```javascript
// Authentication
POST /api/auth/register
POST /api/auth/login
POST /api/auth/verify-email

// User Management
GET  /api/users/profile
PUT  /api/users/profile
GET  /api/users/kyc-status

// Contributions
POST /api/contributions/create
GET  /api/contributions/history
GET  /api/contributions/receipt/:id

// Admin
GET  /api/admin/stats
POST /api/admin/verify-kyc
GET  /api/admin/users
GET  /api/admin/contributions
```

## Security Considerations

### Smart Contract Security
- Reentrancy protection via OpenZeppelin
- Pausable in case of emergency
- Owner-only admin functions
- Input validation on all functions

### Frontend Security
- Content Security Policy headers
- XSS protection via React
- CORS configuration
- Environment variable protection

### Data Security
- Passwords hashed with bcrypt
- JWT tokens for authentication
- SSL/TLS for all connections
- No sensitive data in localStorage

## MVP Limitations & Future Enhancements

### Current MVP Limitations
1. Mock KYC data (no real verification API)
2. No fiat payment processing (crypto only)
3. Basic email verification (no 2FA)
4. Manual admin verification process
5. Single campaign support

### Planned Enhancements (Post-MVP)
1. **Real KYC Integration**
   - Jumio or Onfido API
   - Automated verification
   - Document upload

2. **Payment Processing**
   - Stripe Connect for fiat
   - ACH transfers
   - Credit card processing

3. **Enhanced Security**
   - Two-factor authentication
   - Multi-sig treasury
   - Advanced fraud detection

4. **FEC Compliance**
   - Automated reporting
   - Contribution limit enforcement
   - Donor information collection

5. **Multi-Campaign Support**
   - Campaign creation wizard
   - Multiple treasury addresses
   - Campaign-specific limits

## Deployment Checklist

### Local Development
- [x] Hardhat node running
- [x] Contract deployed
- [x] Frontend connected to local node
- [x] MetaMask configured for localhost
- [x] Test accounts funded

### Testnet Deployment
- [ ] Deploy to Base Sepolia
- [ ] Update contract address in frontend
- [ ] Configure Alchemy/Infura RPC
- [ ] Test with testnet ETH
- [ ] Verify contract on Etherscan

### Production Deployment
- [ ] Security audit completed
- [ ] KYC API integrated
- [ ] Payment gateway configured
- [ ] SSL certificates installed
- [ ] Monitoring configured
- [ ] Backup procedures in place

## Troubleshooting

### Common Issues

1. **MetaMask Not Connecting**
   - Check network (should be localhost:8545)
   - Reset account in MetaMask settings
   - Clear browser cache

2. **Transaction Failing**
   - Verify KYC status
   - Check contribution limits
   - Ensure sufficient ETH for gas

3. **Frontend Not Loading Contract Data**
   - Verify contract address in config
   - Check ABI is up to date
   - Ensure Web3 provider initialized

4. **Admin Functions Not Working**
   - Verify admin wallet address
   - Check owner permissions on contract
   - Ensure correct network selected

## Support & Resources

- **Documentation**: `/docs` directory
- **Tests**: `npm test` for all test suites
- **Contract Tests**: `cd contracts && npx hardhat test`
- **Frontend Tests**: `cd frontend && npm test`
- **Integration Tests**: `npm run test:e2e`

## Conclusion

The MVP demonstrates a complete, functional crypto donation platform with:
- ✅ Smart contract for contribution management
- ✅ User authentication and authorization
- ✅ Mock KYC verification system
- ✅ Real-time contribution tracking
- ✅ Admin dashboard with analytics
- ✅ Secure transaction flow
- ✅ Comprehensive testing suite

The system is ready for demonstration and further development into a production-ready platform.