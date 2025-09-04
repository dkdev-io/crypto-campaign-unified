# 🚨 URGENT: Fix Campaigns Table

The campaigns table is missing critical columns needed for the setup wizard to work. This is preventing campaign setup from functioning properly.

## Quick Fix (2 minutes)

### Option 1: Via Supabase Dashboard (RECOMMENDED)

1. **Open Supabase SQL Editor:**
   https://supabase.com/dashboard/project/kmepcdsklnnxokoimvzo/sql

2. **Copy and paste this SQL:**

```sql
-- Fix campaigns table for setup wizard
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS user_id UUID,
ADD COLUMN IF NOT EXISTS user_full_name TEXT,
ADD COLUMN IF NOT EXISTS fec_committee_id TEXT,
ADD COLUMN IF NOT EXISTS committee_name TEXT,
ADD COLUMN IF NOT EXISTS committee_confirmed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS bank_account_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS bank_account_name TEXT,
ADD COLUMN IF NOT EXISTS bank_last_four TEXT,
ADD COLUMN IF NOT EXISTS plaid_account_id TEXT,
ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS terms_ip_address TEXT,
ADD COLUMN IF NOT EXISTS setup_step INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS setup_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS setup_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS website_analyzed TEXT,
ADD COLUMN IF NOT EXISTS style_analysis JSONB,
ADD COLUMN IF NOT EXISTS applied_styles JSONB,
ADD COLUMN IF NOT EXISTS styles_applied BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS embed_code TEXT,
ADD COLUMN IF NOT EXISTS embed_generated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Update existing campaigns
UPDATE campaigns
SET
    setup_step = 7,
    setup_completed = true,
    setup_completed_at = created_at,
    terms_accepted = true,
    terms_accepted_at = created_at
WHERE setup_completed IS NULL OR setup_completed = false;
```

3. **Click "Run" button**

4. **Verify success** - You should see "Success. No rows returned"

### Option 2: Via Supabase CLI (if you have access token)

```bash
# Set your access token
export SUPABASE_ACCESS_TOKEN="your-token-here"

# Link project
npx supabase link --project-ref kmepcdsklnnxokoimvzo

# Push migration
npx supabase db push
```

## What This Fixes

✅ Adds all missing columns required by SetupWizard.jsx
✅ Updates existing campaigns to have valid defaults
✅ Enables the complete campaign setup workflow
✅ Fixes "column not found" errors

## After Running

The campaign setup at `/setup` will now work properly with all 7 steps:

1. Campaign Information
2. Committee Search
3. Bank Connection
4. Website Style Matching
5. Style Confirmation
6. Terms Agreement
7. Embed Code Generation

## Files Already Created

- `supabase/migrations/20250903_fix_campaigns_table.sql` - Migration file
- `FIX_CAMPAIGNS_TABLE.sql` - Raw SQL to copy
- This file - Instructions

## Why This Happened

The campaigns table was created with minimal columns but the SetupWizard component expects many more fields for the complete onboarding flow. This SQL adds all missing columns.
