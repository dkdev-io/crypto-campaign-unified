# 📁 Crypto Campaign Unified - Project Structure

## 🏗️ Directory Hierarchy

```
crypto-campaign-unified/
│
├── 📂 frontend/                    # React Frontend Application
│   ├── 📁 src/
│   │   ├── 📁 components/         # React Components
│   │   │   ├── AdminPanel.jsx
│   │   │   ├── CampaignWizard.jsx
│   │   │   ├── DonationWidget.jsx
│   │   │   ├── NavigationWrapper.jsx
│   │   │   └── ...
│   │   ├── 📁 contexts/           # React Context Providers
│   │   │   ├── AuthContext.jsx
│   │   │   └── CampaignContext.jsx
│   │   ├── 📁 hooks/              # Custom React Hooks
│   │   │   ├── useAuth.js
│   │   │   └── useCampaign.js
│   │   ├── 📁 pages/              # Page Components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Landing.jsx
│   │   │   └── ...
│   │   ├── 📁 services/           # API Service Layers
│   │   │   ├── api.js
│   │   │   ├── campaignService.js
│   │   │   └── supabase.js
│   │   ├── 📁 styles/             # CSS Styles
│   │   │   ├── index.css
│   │   │   └── components/
│   │   ├── App.jsx                # Main App Component
│   │   ├── main.jsx               # Entry Point
│   │   └── Router.jsx             # Routing Configuration
│   ├── 📁 public/                 # Static Assets
│   ├── 📁 dist/                   # Build Output
│   ├── index.html                 # HTML Template
│   ├── package.json               # Frontend Dependencies
│   └── vite.config.js             # Vite Configuration
│
├── 📂 backend/                     # Node.js Backend Application
│   ├── 📁 src/
│   │   ├── 📁 routes/             # API Routes
│   │   │   ├── 📁 api/
│   │   │   │   ├── campaigns.js
│   │   │   │   ├── donations.js
│   │   │   │   └── users.js
│   │   │   ├── 📁 admin/
│   │   │   └── 📁 webhooks/
│   │   ├── 📁 services/           # Business Logic
│   │   │   ├── campaignService.js
│   │   │   ├── donationService.js
│   │   │   └── emailService.js
│   │   ├── 📁 middleware/         # Express Middleware
│   │   │   ├── auth.js
│   │   │   ├── errorHandler.js
│   │   │   └── validation.js
│   │   ├── 📁 database/           # Database Layer
│   │   │   ├── 📁 migrations/
│   │   │   └── connection.js
│   │   ├── 📁 utils/              # Utility Functions
│   │   │   ├── logger.js
│   │   │   └── helpers.js
│   │   └── server.js              # Server Entry Point
│   ├── 📁 tests/                  # Backend Tests
│   ├── package.json               # Backend Dependencies
│   └── .env                       # Environment Variables
│
├── 📂 supabase/                    # Supabase Configuration
│   ├── 📁 migrations/             # Database Migrations
│   │   ├── 20250903_create_all_tables.sql
│   │   ├── 20250903023905_create_users_table.sql
│   │   └── ...
│   ├── 📁 functions/              # Edge Functions
│   ├── config.toml                # Supabase Config
│   └── seed.sql                   # Database Seeding
│
├── 📂 contracts/                   # Smart Contracts (Solidity)
│   ├── 📁 src/                    # Contract Source
│   │   └── CryptoCampaign.sol
│   ├── 📁 test/                   # Contract Tests
│   ├── 📁 scripts/                # Deployment Scripts
│   ├── 📁 deploy/                 # Deployment Artifacts
│   └── hardhat.config.js          # Hardhat Configuration
│
├── 📂 scripts/                     # Utility Scripts
│   ├── direct-db-verify.js        # Database Verification
│   ├── verify-via-api.js          # API Testing
│   ├── force-fix-campaigns.js     # Data Fixes
│   └── md                         # Markdown Command
│
├── 📂 tests/                       # Integration Tests
│   ├── puppeteer-auth-test.js     # E2E Auth Testing
│   ├── verify-auth-working.js     # Auth Verification
│   └── smart-contract-testing-plan.md
│
├── 📂 docs/                        # Documentation
│   ├── API_DOCUMENTATION.md       # API Reference
│   ├── DEPLOYMENT_GUIDE.md        # Deployment Instructions
│   ├── SUPABASE-ACCESS-GUIDE.md   # Supabase Setup
│   └── PROJECT_STRUCTURE.md       # This File
│
├── 📂 api/                         # API Endpoints (Legacy?)
│   └── 📁 campaign/
│
├── 📂 archive/                     # Archived Code
│   └── 📁 cleanup-20250902/
│
├── 📂 .claude/                     # Claude AI Configuration
│   └── 📁 hooks/                  # Claude Hooks
│
├── 📂 .claude-flow/                # Claude Flow Config
│   └── 📁 metrics/                # Performance Metrics
│
├── 📄 package.json                 # Root Dependencies
├── 📄 CLAUDE.md                    # AI Agent Instructions
├── 📄 README.md                    # Project README
├── 📄 .env                         # Root Environment Variables
├── 📄 .gitignore                   # Git Ignore Rules
└── 📄 vercel.json                  # Vercel Deployment Config
```

## 🔑 Key File Locations

### Frontend Files

- **Entry Point**: `frontend/src/main.jsx`
- **App Component**: `frontend/src/App.jsx`
- **Auth Context**: `frontend/src/contexts/AuthContext.jsx`
- **API Service**: `frontend/src/services/api.js`
- **Supabase Client**: `frontend/src/services/supabase.js`

### Backend Files

- **Server Entry**: `backend/src/server.js`
- **Campaign Routes**: `backend/src/routes/api/campaigns.js`
- **Auth Middleware**: `backend/src/middleware/auth.js`
- **Campaign Service**: `backend/src/services/campaignService.js`

### Database Files

- **Main Migration**: `supabase/migrations/20250903_create_all_tables.sql`
- **User Tables**: `supabase/migrations/20250903023905_create_users_table.sql`

### Configuration Files

- **Frontend Config**: `frontend/vite.config.js`
- **Backend Config**: `backend/.env`
- **Supabase Config**: `supabase/config.toml`
- **Contract Config**: `contracts/hardhat.config.js`

## 🚀 Port Allocations

| Service         | Port  | Status      |
| --------------- | ----- | ----------- |
| Frontend (Vite) | 5173  | Development |
| Backend API     | 3001  | Development |
| Supabase Studio | 54323 | Local       |
| Supabase API    | 54321 | Local       |

## 📦 Package Structure

### Root Package

- Main orchestration
- Script commands
- Dev dependencies

### Frontend Package (`frontend/package.json`)

- React 18
- Vite
- React Router
- Supabase Client
- Tailwind CSS

### Backend Package (`backend/package.json`)

- Express
- Supabase Admin
- CORS
- Dotenv
- Body Parser

### Contracts Package (`contracts/package.json`)

- Hardhat
- Ethers
- OpenZeppelin
- Testing tools

## 🔄 Data Flow

1. **User Interface** (Frontend)
   - React components in `frontend/src/components/`
   - State management via Context API
   - API calls through service layer

2. **API Layer** (Backend)
   - Express routes in `backend/src/routes/`
   - Middleware for auth/validation
   - Service layer for business logic

3. **Database** (Supabase)
   - PostgreSQL with RLS
   - Migrations in `supabase/migrations/`
   - Real-time subscriptions

4. **Blockchain** (Contracts)
   - Smart contracts in `contracts/src/`
   - Deployment scripts
   - Test coverage

## 🎯 Agent Quick Reference

When working on:

- **Frontend UI** → Look in `frontend/src/components/`
- **API Endpoints** → Check `backend/src/routes/api/`
- **Database Schema** → Review `supabase/migrations/`
- **Authentication** → See `frontend/src/contexts/AuthContext.jsx`
- **Smart Contracts** → Work in `contracts/src/`
- **Testing** → Use `tests/` for integration, component folders for unit tests
- **Documentation** → Update files in `docs/`

## 🚨 Important Notes

1. **NEVER** save files to root directory
2. **ALWAYS** use appropriate subdirectories
3. **CHECK** for existing implementations before creating new ones
4. **UPDATE** this structure document when adding major components
5. **FOLLOW** the established patterns in each section
