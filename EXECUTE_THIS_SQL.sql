-- =====================================================
-- CRITICAL: Run this SQL in Supabase Dashboard NOW  
-- =====================================================
-- URL: https://supabase.com/dashboard/project/kmepcdsklnnxokoimvzo/sql
-- This fixes the campaign setup workflow by adding missing columns

-- Add all missing columns to campaigns table
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

-- Update existing campaigns to have proper defaults
UPDATE campaigns 
SET 
    setup_step = COALESCE(setup_step, 7),
    setup_completed = COALESCE(setup_completed, true),
    setup_completed_at = COALESCE(setup_completed_at, created_at),
    terms_accepted = COALESCE(terms_accepted, true),
    terms_accepted_at = COALESCE(terms_accepted_at, created_at)
WHERE setup_step IS NULL OR setup_completed IS NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS campaigns_user_id_idx ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS campaigns_setup_step_idx ON campaigns(setup_step);
CREATE INDEX IF NOT EXISTS campaigns_setup_completed_idx ON campaigns(setup_completed);

-- Verify the fix
SELECT 
    'campaigns table now has ' || count(*) || ' columns' as status
FROM information_schema.columns 
WHERE table_name = 'campaigns' AND table_schema = 'public';