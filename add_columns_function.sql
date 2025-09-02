-- Create function to add missing columns to campaigns table
CREATE OR REPLACE FUNCTION add_missing_campaign_columns()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Add missing columns
  EXECUTE 'ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS user_id UUID';
  EXECUTE 'ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS user_full_name TEXT';
  EXECUTE 'ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS fec_committee_id TEXT';
  EXECUTE 'ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS committee_name TEXT';
  EXECUTE 'ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS committee_confirmed BOOLEAN DEFAULT false';
  EXECUTE 'ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS bank_account_verified BOOLEAN DEFAULT false';
  EXECUTE 'ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS bank_account_name TEXT';
  EXECUTE 'ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS bank_last_four TEXT';
  EXECUTE 'ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS plaid_account_id TEXT';
  EXECUTE 'ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT false';
  EXECUTE 'ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ';
  EXECUTE 'ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS terms_ip_address TEXT';
  EXECUTE 'ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS setup_step INTEGER DEFAULT 1';
  EXECUTE 'ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS setup_completed BOOLEAN DEFAULT false';
  EXECUTE 'ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS setup_completed_at TIMESTAMPTZ';
  EXECUTE 'ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS website_analyzed TEXT';
  EXECUTE 'ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS style_analysis JSONB';
  EXECUTE 'ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS applied_styles JSONB';
  EXECUTE 'ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS styles_applied BOOLEAN DEFAULT false';
  EXECUTE 'ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS embed_code TEXT';
  EXECUTE 'ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS embed_generated_at TIMESTAMPTZ';
  EXECUTE 'ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS description TEXT';
  
  -- Update existing campaigns
  UPDATE campaigns 
  SET 
      setup_step = 7,
      setup_completed = true,
      setup_completed_at = created_at,
      terms_accepted = true,
      terms_accepted_at = created_at
  WHERE setup_completed IS NULL OR setup_completed = false;
  
  RETURN 'Successfully added all missing columns to campaigns table';
END;
$$;