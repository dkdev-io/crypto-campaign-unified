-- Create campaigns table with all required columns
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic campaign info
  email VARCHAR(255) NOT NULL,
  campaign_name VARCHAR(255) NOT NULL,
  website VARCHAR(500),
  wallet_address VARCHAR(100) NOT NULL,
  max_donation_limit DECIMAL(10,2) DEFAULT 3300,
  suggested_amounts INTEGER[] DEFAULT ARRAY[25, 50, 100, 250],
  theme_color VARCHAR(7) DEFAULT '#2a2a72',
  supported_cryptos TEXT[] DEFAULT ARRAY['ETH', 'BTC'],
  status VARCHAR(50) DEFAULT 'active',
  
  -- Setup wizard columns
  user_id UUID,
  user_full_name TEXT,
  fec_committee_id TEXT,
  committee_name TEXT,
  committee_confirmed BOOLEAN DEFAULT false,
  bank_account_verified BOOLEAN DEFAULT false,
  bank_account_name TEXT,
  bank_last_four TEXT,
  plaid_account_id TEXT,
  terms_accepted BOOLEAN DEFAULT false,
  terms_accepted_at TIMESTAMPTZ,
  terms_ip_address TEXT,
  setup_step INTEGER DEFAULT 1,
  setup_completed BOOLEAN DEFAULT false,
  setup_completed_at TIMESTAMPTZ,
  website_analyzed TEXT,
  style_analysis JSONB,
  applied_styles JSONB,
  styles_applied BOOLEAN DEFAULT false,
  embed_code TEXT,
  embed_generated_at TIMESTAMPTZ,
  description TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS campaigns_user_id_idx ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS campaigns_email_idx ON campaigns(email);
CREATE INDEX IF NOT EXISTS campaigns_setup_step_idx ON campaigns(setup_step);
CREATE INDEX IF NOT EXISTS campaigns_created_at_idx ON campaigns(created_at);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_campaigns_updated_at ON campaigns;
CREATE TRIGGER update_campaigns_updated_at
    BEFORE UPDATE ON campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();