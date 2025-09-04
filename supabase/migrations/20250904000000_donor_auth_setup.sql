-- Complete donor authentication setup migration
-- This migration sets up everything needed for donor auth to work

-- Create donor types
CREATE TYPE donor_type AS ENUM ('individual', 'organization');
CREATE TYPE donation_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- Create basic campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    email TEXT,
    user_id UUID,
    wallet_address TEXT,
    goal_amount DECIMAL(10,2) DEFAULT 0,
    current_amount DECIMAL(10,2) DEFAULT 0,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create donors table
CREATE TABLE donors (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    address JSONB,
    donor_type donor_type NOT NULL DEFAULT 'individual',
    email_verified BOOLEAN DEFAULT TRUE,
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
    notification_preferences JSONB DEFAULT '{"email": true, "sms": false, "push": false}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(donor_id)
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

-- Enable RLS
ALTER TABLE donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE donor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for donors
CREATE POLICY "Users can insert own donor record" ON donors
    FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Donors can view own record" ON donors
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Donors can update own record" ON donors
    FOR UPDATE USING (auth.uid() = id);

-- Create RLS policies for donor_profiles
CREATE POLICY "Users can insert own profile" ON donor_profiles
    FOR INSERT WITH CHECK (auth.uid() = donor_id);
CREATE POLICY "Donors can view own profile" ON donor_profiles
    FOR SELECT USING (auth.uid() = donor_id);
CREATE POLICY "Donors can update own profile" ON donor_profiles
    FOR UPDATE USING (auth.uid() = donor_id);

-- Create RLS policies for donations
CREATE POLICY "Anyone can insert donations" ON donations
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Donors can view own donations" ON donations
    FOR SELECT USING (auth.uid() = donor_id);

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Create the test@dkdev.io user in auth.users with correct password
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'authenticated',
    'authenticated',
    'test@dkdev.io',
    crypt('TestDonor123!', gen_salt('bf')),
    NOW(),
    NULL,
    NULL,
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"user_type":"donor","full_name":"Test Donor Account"}'::jsonb,
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    encrypted_password = EXCLUDED.encrypted_password,
    email_confirmed_at = NOW(),
    raw_user_meta_data = EXCLUDED.raw_user_meta_data;

-- Create the corresponding donor record
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
    full_name = EXCLUDED.full_name,
    email_verified = true;

-- Create the donor profile
INSERT INTO donor_profiles (donor_id, bio)
SELECT 
    id,
    'Test donor account for development'
FROM auth.users 
WHERE email = 'test@dkdev.io'
ON CONFLICT (donor_id) DO UPDATE SET
    bio = EXCLUDED.bio;

-- Verify the setup
SELECT 
    'Setup complete!' as status,
    u.email,
    u.email_confirmed_at IS NOT NULL as email_confirmed,
    d.full_name,
    d.email_verified,
    dp.id IS NOT NULL as has_profile
FROM auth.users u
LEFT JOIN donors d ON d.id = u.id
LEFT JOIN donor_profiles dp ON dp.donor_id = u.id
WHERE u.email = 'test@dkdev.io';