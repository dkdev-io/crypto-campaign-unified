-- Create form_submissions table
CREATE TABLE IF NOT EXISTS form_submissions (
  id BIGSERIAL PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id),
  
  -- Donor Information
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  
  -- Address Information
  address VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(2) NOT NULL,
  zip_code VARCHAR(10) NOT NULL,
  
  -- Contribution Information
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50) DEFAULT 'crypto',
  contributor_wallet VARCHAR(255),
  transaction_hash VARCHAR(255),
  
  -- Employment Information (FEC Required)
  employer VARCHAR(255),
  occupation VARCHAR(255),
  
  -- FEC Compliance
  contribution_type VARCHAR(50) DEFAULT 'individual',
  is_us_citizen BOOLEAN DEFAULT true,
  is_prohibited_source BOOLEAN DEFAULT false,
  acknowledgment_signed BOOLEAN DEFAULT true,
  
  -- Metadata
  form_version VARCHAR(10) DEFAULT '1.0',
  user_agent TEXT,
  ip_address INET,
  
  -- Timestamps
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_form_submissions_campaign_id ON form_submissions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_email ON form_submissions(email);
CREATE INDEX IF NOT EXISTS idx_form_submissions_submitted_at ON form_submissions(submitted_at);
CREATE INDEX IF NOT EXISTS idx_form_submissions_transaction_hash ON form_submissions(transaction_hash);

-- RLS policies
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (for public forms)
CREATE POLICY "Anyone can insert form submissions" ON form_submissions
  FOR INSERT WITH CHECK (true);

-- Allow reading submissions (adjust for production)
CREATE POLICY "Allow read form submissions" ON form_submissions
  FOR SELECT USING (true);