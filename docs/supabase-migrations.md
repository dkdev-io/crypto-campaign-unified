# Supabase Table Creation Instructions

Since we cannot create tables programmatically with the anon key, you have two options:

## Option 1: Supabase Dashboard (Easiest)

1. Go to: https://supabase.com/dashboard/project/kmepcdsklnnxokoimvzo/sql
2. Click "New Query"
3. Copy and paste the SQL below
4. Click "Run"

## Option 2: Supabase CLI (If you have it installed)

```bash
supabase db push
```

## SQL to Run:

```sql
-- Create form_submissions table if it doesn't exist
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

-- RLS policies (adjust based on your security requirements)
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (for public forms)
CREATE POLICY "Anyone can insert form submissions" ON form_submissions
  FOR INSERT WITH CHECK (true);

-- Allow authenticated users to read submissions for their campaigns
CREATE POLICY "Users can read their campaign submissions" ON form_submissions
  FOR SELECT USING (
    campaign_id IN (
      SELECT id FROM campaigns WHERE email = auth.jwt() ->> 'email'
    ) OR
    true -- For testing, allow all reads. Remove this line in production
  );

-- Also create error_logs table while we're at it
CREATE TABLE IF NOT EXISTS error_logs (
  id BIGSERIAL PRIMARY KEY,
  error_type VARCHAR(100) NOT NULL,
  error_message TEXT,
  user_agent TEXT,
  url TEXT,
  search_term TEXT,
  metadata JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_error_logs_type ON error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON error_logs(timestamp);
```

## Direct Link to SQL Editor:

https://supabase.com/dashboard/project/kmepcdsklnnxokoimvzo/sql/new
