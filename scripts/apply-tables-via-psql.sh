#!/bin/bash

# This script applies the donor tables migration using direct database connection

echo "🚀 Applying donor tables migration to Supabase"
echo ""
echo "Since the tables don't exist in kmepcdsklnnxokoimvzo project,"
echo "we need to create them via Supabase Dashboard SQL Editor."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "MANUAL STEPS REQUIRED:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Open Supabase SQL Editor:"
echo "   https://app.supabase.com/project/kmepcdsklnnxokoimvzo/sql/new"
echo ""
echo "2. Copy the SQL from this file:"
echo "   scripts/apply-donor-migrations.sql"
echo ""
echo "3. Paste and run in SQL Editor"
echo ""
echo "4. After running, test registration again"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Or use this simplified SQL to create just the essential tables:"
echo ""

cat << 'EOF'
-- Create minimal donor tables for testing
CREATE TABLE IF NOT EXISTS donors (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    donor_type TEXT DEFAULT 'individual',
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS donor_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    donor_id UUID NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(donor_id)
);

-- Enable RLS
ALTER TABLE donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE donor_profiles ENABLE ROW LEVEL SECURITY;

-- Create basic policies
CREATE POLICY "Users can insert own donor record" ON donors
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own donor record" ON donors
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own donor record" ON donors
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can manage own profile" ON donor_profiles
    FOR ALL USING (auth.uid() = donor_id);

-- Grant permissions
GRANT ALL ON donors TO anon, authenticated;
GRANT ALL ON donor_profiles TO anon, authenticated;

-- Insert the test donor we just created
INSERT INTO donors (id, email, full_name, phone, donor_type)
VALUES (
    'a6dd2983-3dd4-4e0d-b3f6-17d38772ff32',
    'test@dkdev.io',
    'Test Donor Account',
    '555-0123',
    'individual'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO donor_profiles (donor_id)
VALUES ('a6dd2983-3dd4-4e0d-b3f6-17d38772ff32')
ON CONFLICT (donor_id) DO NOTHING;

-- Verify
SELECT * FROM donors WHERE email = 'test@dkdev.io';
EOF

echo ""
echo "Copy the SQL above and run it in the Supabase SQL Editor!"
echo ""