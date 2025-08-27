-- Combined migration script for donor system
-- Run this in Supabase Dashboard SQL Editor

-- Drop existing objects if they exist (for clean setup)
DROP TABLE IF EXISTS donor_tax_receipts CASCADE;
DROP TABLE IF EXISTS donor_saved_campaigns CASCADE;
DROP TABLE IF EXISTS donations CASCADE;
DROP TABLE IF EXISTS donor_profiles CASCADE;
DROP TABLE IF EXISTS donors CASCADE;
DROP TYPE IF EXISTS donor_type CASCADE;
DROP TYPE IF EXISTS donation_status CASCADE;

-- Create enum types
CREATE TYPE donor_type AS ENUM ('individual', 'organization');
CREATE TYPE donation_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- Create donors table
CREATE TABLE donors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    address JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    email_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    donor_type donor_type NOT NULL DEFAULT 'individual'
);

-- Create donor_profiles table
CREATE TABLE donor_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    donor_id UUID NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
    bio TEXT,
    interests TEXT[],
    donation_preferences JSONB DEFAULT '{}',
    tax_id TEXT,
    preferred_payment_methods TEXT[],
    notification_preferences JSONB DEFAULT '{"email": true, "sms": false, "push": false}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(donor_id)
);

-- Check if campaigns table exists before creating donations table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'campaigns') THEN
        CREATE TABLE campaigns (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    END IF;
END $$;

-- Create donations table
CREATE TABLE IF NOT EXISTS donations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    donor_id UUID REFERENCES donors(id) ON DELETE SET NULL,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    currency TEXT NOT NULL DEFAULT 'USD',
    crypto_currency TEXT,
    transaction_hash TEXT,
    status donation_status NOT NULL DEFAULT 'pending',
    donation_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_anonymous BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create donor_saved_campaigns table
CREATE TABLE donor_saved_campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    donor_id UUID NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    saved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(donor_id, campaign_id)
);

-- Create donor_tax_receipts table
CREATE TABLE donor_tax_receipts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    donor_id UUID NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
    donation_id UUID NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
    receipt_number TEXT UNIQUE NOT NULL,
    issue_date DATE NOT NULL,
    tax_year INTEGER NOT NULL,
    receipt_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(donation_id)
);

-- Add indexes for performance
CREATE INDEX idx_donors_email ON donors(email);
CREATE INDEX idx_donors_active ON donors(is_active);
CREATE INDEX idx_donations_donor ON donations(donor_id);
CREATE INDEX idx_donations_campaign ON donations(campaign_id);
CREATE INDEX idx_donations_status ON donations(status);
CREATE INDEX idx_donations_date ON donations(donation_date);
CREATE INDEX idx_donor_saved_campaigns_donor ON donor_saved_campaigns(donor_id);
CREATE INDEX idx_donor_saved_campaigns_campaign ON donor_saved_campaigns(campaign_id);
CREATE INDEX idx_tax_receipts_donor ON donor_tax_receipts(donor_id);
CREATE INDEX idx_tax_receipts_year ON donor_tax_receipts(tax_year);

-- Create update trigger for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_donors_updated_at BEFORE UPDATE ON donors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_donor_profiles_updated_at BEFORE UPDATE ON donor_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_donations_updated_at BEFORE UPDATE ON donations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE donor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE donor_saved_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE donor_tax_receipts ENABLE ROW LEVEL SECURITY;

-- Donors table policies
-- Allow anyone to insert (for registration)
CREATE POLICY "Enable insert for registration" ON donors
    FOR INSERT WITH CHECK (true);

-- Donors can view their own record
CREATE POLICY "Donors can view own record" ON donors
    FOR SELECT USING (auth.uid() = id);

-- Donors can update their own record
CREATE POLICY "Donors can update own record" ON donors
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Donor profiles policies
-- Allow authenticated users to insert their profile
CREATE POLICY "Donors can insert own profile" ON donor_profiles
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Donors can view own profile" ON donor_profiles
    FOR SELECT USING (donor_id = auth.uid());

CREATE POLICY "Donors can update own profile" ON donor_profiles
    FOR UPDATE USING (donor_id = auth.uid())
    WITH CHECK (donor_id = auth.uid());

-- Donations policies
CREATE POLICY "Donors can view own donations" ON donations
    FOR SELECT USING (donor_id = auth.uid());

CREATE POLICY "Enable donation insertion" ON donations
    FOR INSERT WITH CHECK (true);

-- Donor saved campaigns policies
CREATE POLICY "Donors can manage own saved campaigns" ON donor_saved_campaigns
    FOR ALL USING (donor_id = auth.uid())
    WITH CHECK (donor_id = auth.uid());

-- Tax receipts policies
CREATE POLICY "Donors can view own tax receipts" ON donor_tax_receipts
    FOR SELECT USING (donor_id = auth.uid());

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Verify tables were created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('donors', 'donor_profiles', 'donations', 'donor_saved_campaigns', 'donor_tax_receipts')
ORDER BY table_name;