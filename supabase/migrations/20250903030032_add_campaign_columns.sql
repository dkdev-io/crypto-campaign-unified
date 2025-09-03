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