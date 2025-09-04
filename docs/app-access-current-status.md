# Current App Access Status - September 3, 2025

## 🎯 IMMEDIATE PRIORITIES

1. **CRITICAL**: Email policy now enforced - only test@dkdev.io allowed
2. **URGENT**: 515+ CSV records need integration to Supabase
3. **HIGH**: Migration files need evaluation and application

## 📱 Application Access Points

### Frontend Application

- **Location**: `/Users/Danallovertheplace/crypto-campaign-unified/frontend/`
- **Port**: 5173 (Vite development server)
- **Start Command**: `cd frontend && npm run dev`
- **Status**: CONFIGURED
- **Access URL**: http://localhost:5173

### Backend API

- **Location**: `/Users/Danallovertheplace/crypto-campaign-unified/backend/`
- **Port**: 3001
- **Start Command**: `cd backend && npm start`
- **Status**: CONFIGURED
- **API Base URL**: http://localhost:3001

### Database Access

- **Supabase Console**: https://supabase.com/dashboard/project/kmepcdsklnnxokoimvzo
- **Direct Connection**: postgresql://postgres:SenecaCrypto2024!@db.kmepcdsklnnxokoimvzo.supabase.co:5432/postgres
- **Status**: ACTIVE - 24 campaign records, email policy enforced

## 🧪 Testing Credentials

- **Email**: test@dkdev.io (ONLY approved test email)
- **Password**: admin123
- **Status**: Confirmed working in donor workflow

## 📊 Data Assets Status

### Active Database Tables

- **campaigns**: 24 records (4 consolidated test campaigns + 20 real)
- **contributions**: 0 records (empty table)
- **Other tables**: Exist but empty

### Unused Data Assets (READY FOR INTEGRATION)

- **Location**: `/Users/Danallovertheplace/crypto-campaign-unified/scripts/exported-data/`
- **campaign_donors.csv**: 215 realistic donor records
- **campaign_prospects.csv**: 150 prospect records
- **kyc.csv**: 150 KYC verification records
- **Status**: CSV files ready for import with proper integration scripts

### Migration Files (NEED EVALUATION)

- **Location**: `/Users/Danallovertheplace/crypto-campaign-unified/supabase/migrations/`
- **Analytics Testing**: 20250826_analytics_testing_validation.sql
- **Security Testing**: 20250826_security_testing_validation.sql
- **Multi-User System**: 20250826_test_multiuser_system.sql
- **Status**: Not applied, need evaluation for relevance

## 🛡️ PROTECTION SYSTEMS ACTIVE

- **Email Policy**: Enforced - only test@dkdev.io allowed
- **Data Integration Guardrails**: Active in CLAUDE.md
- **Session Documentation**: Required for handoff
- **Git Auto-sync**: Functioning

## 🔧 Quick Start Commands

```bash
# Start Frontend
cd frontend && npm run dev

# Start Backend (separate terminal)
cd backend && npm start

# Check Database Status
node -e "console.log('Database accessible at Supabase console')"

# Verify Test Email Policy
node -e "/* Check campaigns table for test emails */"
```

## 📁 Key File Locations

- **Project Root**: /Users/Danallovertheplace/crypto-campaign-unified/
- **Frontend Source**: /frontend/src/
- **Backend Source**: /backend/src/
- **Documentation**: /docs/
- **Test Data**: /scripts/exported-data/
- **Migrations**: /supabase/migrations/

## ⚠️ CRITICAL REMINDERS

- **NEVER create new test emails** - use test@dkdev.io only
- **Check for data integration** before creating new test data
- **Follow new guardrails** in CLAUDE.md for any data work
- **Document session changes** for proper handoff

**Last Updated**: September 3, 2025, 21:30
**Status**: READY FOR DEVELOPMENT with critical protections in place
