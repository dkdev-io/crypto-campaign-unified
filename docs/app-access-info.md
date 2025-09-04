# App Access Information - September 3, 2025

## 📱 Application Status

### Current Applications

- **Frontend (React)**: Location `/Users/Danallovertheplace/crypto-campaign-unified/frontend/`
  - Port: 5173 (Vite dev server)
  - Status: CONFIGURED
  - Access: `npm run dev` in frontend directory

- **Backend (Node.js)**: Location `/Users/Danallovertheplace/crypto-campaign-unified/backend/`
  - Port: 3001
  - Status: CONFIGURED
  - Access: `npm start` in backend directory

### Database Access

- **Supabase Console**: https://supabase.com/dashboard/project/kmepcdsklnnxokoimvzo
- **Database**: postgresql://postgres:SenecaCrypto2024!@db.kmepcdsklnnxokoimvzo.supabase.co:5432/postgres
- **Status**: ACTIVE - 2 tables with data, 6+ empty tables

### Key File Locations

- **Project Root**: /Users/Danallovertheplace/crypto-campaign-unified/
- **Configuration**: .env files in root and backend
- **Documentation**: /docs/ directory
- **Test Data**: /scripts/exported-data/ (515+ unused CSV records)

## 🗂️ Data Assets

### Available Test Data (Not Integrated)

- campaign_donors.csv: 215 records
- campaign_prospects.csv: 150 records
- kyc.csv: 150 records
- Location: `/scripts/exported-data/`

### Database Tables

- campaigns: 24 active records
- contributions: 0 records (empty)
- Other tables: Exist but empty

## 🎯 Quick Start Commands

```bash
# Frontend
cd frontend && npm run dev

# Backend
cd backend && npm start

# Database Access
# Use Supabase dashboard or connection string above
```

**Last Updated**: September 3, 2025
**Session**: Data integration analysis and prevention guardrails
