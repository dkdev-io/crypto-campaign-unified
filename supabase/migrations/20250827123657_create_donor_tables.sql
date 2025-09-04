-- Create donor tables in kmepcdsklnnxokoimvzo project

-- Drop existing tables if any
DROP TABLE IF EXISTS donor_tax_receipts CASCADE;
DROP TABLE IF EXISTS donor_saved_campaigns CASCADE;
DROP TABLE IF EXISTS donations CASCADE;
DROP TABLE IF EXISTS donor_profiles CASCADE;
DROP TABLE IF EXISTS donors CASCADE;
DROP TYPE IF EXISTS donor_type CASCADE;
DROP TYPE IF EXISTS donation_status CASCADE;

-- Create types
CREATE TYPE donor_type AS ENUM ('individual', 'organization');
CREATE TYPE donation_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- Create donors table
CREATE TABLE donors (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    address JSONB,
    donor_type donor_type NOT NULL DEFAULT 'individual',
    email_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
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

-- Create campaigns table if not exists
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create donations table
CREATE TABLE donations (
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

-- Enable RLS
ALTER TABLE donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE donor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE donor_saved_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE donor_tax_receipts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can insert own donor record" ON donors
    FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Donors can view own record" ON donors
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Donors can update own record" ON donors
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON donor_profiles
    FOR INSERT WITH CHECK (auth.uid() = donor_id);
CREATE POLICY "Donors can view own profile" ON donor_profiles
    FOR SELECT USING (auth.uid() = donor_id);
CREATE POLICY "Donors can update own profile" ON donor_profiles
    FOR UPDATE USING (auth.uid() = donor_id);

CREATE POLICY "Anyone can insert donations" ON donations
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Donors can view own donations" ON donations
    FOR SELECT USING (auth.uid() = donor_id);

CREATE POLICY "Donors manage own saved campaigns" ON donor_saved_campaigns
    FOR ALL USING (auth.uid() = donor_id);
CREATE POLICY "Donors view own tax receipts" ON donor_tax_receipts
    FOR SELECT USING (auth.uid() = donor_id);

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Insert test donor record (using consistent UUID with email verification migration)
INSERT INTO donors (id, email, full_name, phone, donor_type)
SELECT 
    id,
    email,
    'Test Donor Account',
    '555-0123',
    'individual'
FROM auth.users 
WHERE email = 'test@dkdev.io'
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;

-- Insert donor profile using the same UUID
INSERT INTO donor_profiles (donor_id, bio)
SELECT 
    id,
    'Test donor account'
FROM auth.users 
WHERE email = 'test@dkdev.io'
ON CONFLICT (donor_id) DO NOTHING;

-- Verify
SELECT 'Tables created successfully!' as status;