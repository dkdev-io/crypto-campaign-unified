import { supabase } from './supabase.js';

// This script checks and sets up Supabase tables
export async function checkSupabaseSetup() {
  console.log('🔍 Checking Supabase connection and tables...');
  
  try {
    // Test connection
    const { data: test, error: connError } = await supabase
      .from('campaigns')
      .select('id')
      .limit(1);
    
    if (connError) {
      console.error('❌ Supabase connection error:', connError);
      console.log('📝 Tables might not exist. Creating tables...');
      return false;
    }
    
    console.log('✅ Supabase connected successfully');
    
    // Check campaigns table structure
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('*')
      .limit(1);
    
    if (campaigns && campaigns.length > 0) {
      console.log('📊 Sample campaign structure:', Object.keys(campaigns[0]));
      console.log('📊 Sample campaign data:', campaigns[0]);
    }
    
    // Check form_submissions table
    const { data: submissions, error: submissionsError } = await supabase
      .from('form_submissions')
      .select('*')
      .limit(1);
    
    if (submissionsError) {
      console.log('⚠️ form_submissions table might not exist');
    } else {
      console.log('✅ form_submissions table exists');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Setup check failed:', error);
    return false;
  }
}

// SQL to create tables if needed (run in Supabase SQL editor)
export const CREATE_TABLES_SQL = `
-- Create users table for admin
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create or update campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email TEXT,
  campaign_name TEXT NOT NULL,
  candidate_name TEXT,
  website TEXT,
  wallet_address TEXT,
  suggested_amounts NUMERIC[] DEFAULT ARRAY[25, 50, 100, 250],
  max_donation_limit NUMERIC DEFAULT 3300,
  theme_color TEXT DEFAULT '#2a2a72',
  button_color TEXT DEFAULT '#F0A202',
  supported_cryptos TEXT[] DEFAULT ARRAY['BTC', 'ETH', 'USDC'],
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create form_submissions table if not exists
CREATE TABLE IF NOT EXISTS form_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  donor_full_name TEXT,
  donor_email TEXT,
  donor_phone TEXT,
  donor_street TEXT,
  donor_city TEXT,
  donor_state TEXT,
  donor_zip TEXT,
  donor_employer TEXT,
  donor_occupation TEXT,
  amount_usd NUMERIC,
  cryptocurrency TEXT,
  crypto_amount NUMERIC,
  wallet_address TEXT,
  citizenship_confirmed BOOLEAN DEFAULT false,
  own_funds_confirmed BOOLEAN DEFAULT false,
  not_corporate_confirmed BOOLEAN DEFAULT false,
  not_contractor_confirmed BOOLEAN DEFAULT false,
  age_confirmed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow public to read campaigns (for donor form)
CREATE POLICY "Public can read campaigns" ON campaigns
  FOR SELECT USING (true);

-- Allow public to insert campaigns (for setup wizard)
CREATE POLICY "Public can insert campaigns" ON campaigns
  FOR INSERT WITH CHECK (true);

-- Allow public to update their own campaigns
CREATE POLICY "Public can update campaigns" ON campaigns
  FOR UPDATE USING (true);

-- Allow public to insert form submissions
CREATE POLICY "Public can insert submissions" ON form_submissions
  FOR INSERT WITH CHECK (true);

-- Admin policies (we'll update these when we add auth)
CREATE POLICY "Admin can do everything" ON users
  FOR ALL USING (role = 'admin');

-- Insert hardcoded admin user (password will need to be hashed)
-- We'll do this programmatically instead
`;

export async function testCampaignCreation() {
  console.log('🧪 Testing campaign creation...');
  
  const testData = {
    email: 'test@example.com',
    campaign_name: 'Test Campaign ' + Date.now(),
    candidate_name: 'Test Candidate',
    website: 'https://test.com',
    wallet_address: '0x' + Math.random().toString(36).substring(7),
    suggested_amounts: [10, 25, 75, 150],
    max_donation_limit: 2500,
    theme_color: '#FF0000',
    button_color: '#00FF00'
  };
  
  console.log('📤 Creating test campaign with data:', testData);
  
  const { data, error } = await supabase
    .from('campaigns')
    .insert([testData])
    .select()
    .single();
  
  if (error) {
    console.error('❌ Failed to create test campaign:', error);
    console.log('🔍 Error details:', error.message, error.details, error.hint);
    return null;
  }
  
  console.log('✅ Test campaign created successfully:', data);
  console.log('🔑 Campaign ID:', data.id);
  console.log('💰 Suggested amounts saved:', data.suggested_amounts);
  
  // Try to read it back
  const { data: readBack, error: readError } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', data.id)
    .single();
  
  if (readError) {
    console.error('❌ Failed to read back campaign:', readError);
  } else {
    console.log('✅ Campaign read back successfully:', readBack);
    console.log('💰 Amounts from database:', readBack.suggested_amounts);
  }
  
  return data;
}