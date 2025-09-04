-- Enhance existing schema for referral tracking system
-- Supports 18 decimal precision for crypto amounts and comprehensive referral tracking

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Add referral fields to existing donors table
ALTER TABLE donors ADD COLUMN IF NOT EXISTS wallet_address VARCHAR(42) UNIQUE;
ALTER TABLE donors ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20) UNIQUE;
ALTER TABLE donors ADD COLUMN IF NOT EXISTS total_raised DECIMAL(28, 18) DEFAULT 0;
ALTER TABLE donors ADD COLUMN IF NOT EXISTS referral_count INTEGER DEFAULT 0;

-- Candidates table - political candidates with wallet addresses for receiving donations
CREATE TABLE IF NOT EXISTS candidates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    wallet_address VARCHAR(42) NOT NULL UNIQUE,
    campaign_goal DECIMAL(28, 18),
    total_raised DECIMAL(28, 18) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    campaign_start_date TIMESTAMP WITH TIME ZONE,
    campaign_end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add referral fields to existing donations table
ALTER TABLE donations ADD COLUMN IF NOT EXISTS referrer_id UUID REFERENCES donors(id) ON DELETE SET NULL;
ALTER TABLE donations ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20);
ALTER TABLE donations ADD COLUMN IF NOT EXISTS network VARCHAR(50) DEFAULT 'ethereum';
ALTER TABLE donations ADD COLUMN IF NOT EXISTS block_number BIGINT;
ALTER TABLE donations ADD COLUMN IF NOT EXISTS gas_used BIGINT;
ALTER TABLE donations ADD COLUMN IF NOT EXISTS gas_price DECIMAL(28, 18);
ALTER TABLE donations ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE;

-- Modify existing amount column to support crypto precision if needed
ALTER TABLE donations ALTER COLUMN amount TYPE DECIMAL(28, 18);

-- Add candidate_id column to donations if it doesn't exist, referencing campaigns for now
ALTER TABLE donations ADD COLUMN IF NOT EXISTS candidate_id UUID REFERENCES campaigns(id) ON DELETE CASCADE;

-- Create indexes for performance (use IF NOT EXISTS for existing tables)
CREATE INDEX IF NOT EXISTS idx_donors_wallet_address ON donors(wallet_address);
CREATE INDEX IF NOT EXISTS idx_donors_referral_code ON donors(referral_code);
CREATE INDEX IF NOT EXISTS idx_candidates_wallet_address ON candidates(wallet_address);
CREATE INDEX IF NOT EXISTS idx_candidates_active ON candidates(is_active);
CREATE INDEX IF NOT EXISTS idx_donations_candidate_id ON donations(candidate_id);
CREATE INDEX IF NOT EXISTS idx_donations_referrer_id ON donations(referrer_id);
CREATE INDEX IF NOT EXISTS idx_donations_referral_code ON donations(referral_code);
CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(status);
CREATE INDEX IF NOT EXISTS idx_donations_network ON donations(network);
CREATE INDEX IF NOT EXISTS idx_donations_date ON donations(donation_date DESC);

-- Analytical view for referral stats (using existing table schema)
CREATE OR REPLACE VIEW referral_stats AS
SELECT 
    d.id as donor_id,
    d.full_name as donor_name,
    d.email as donor_email,
    d.referral_code,
    COUNT(don.id) as total_referrals,
    COALESCE(SUM(CASE WHEN don.status = 'completed' THEN don.amount ELSE 0 END), 0) as total_raised_confirmed,
    COALESCE(SUM(don.amount), 0) as total_raised_all,
    COUNT(CASE WHEN don.status = 'completed' THEN 1 END) as confirmed_referrals,
    COUNT(CASE WHEN don.status = 'pending' THEN 1 END) as pending_referrals,
    COUNT(CASE WHEN don.status = 'failed' THEN 1 END) as failed_referrals,
    MAX(don.donation_date) as last_referral_date,
    d.created_at as donor_created_at
FROM donors d
LEFT JOIN donations don ON d.id = don.referrer_id
GROUP BY d.id, d.full_name, d.email, d.referral_code, d.created_at;

-- Analytical view for donor aggregate stats (using existing table schema)
CREATE OR REPLACE VIEW donor_aggregate_stats AS
SELECT 
    d.id as donor_id,
    d.full_name as donor_name,
    d.email as donor_email,
    d.wallet_address,
    d.referral_code,
    -- Own donations
    COUNT(own_donations.id) as own_donation_count,
    COALESCE(SUM(CASE WHEN own_donations.status = 'completed' THEN own_donations.amount ELSE 0 END), 0) as own_donations_confirmed,
    -- Referral stats
    COUNT(referral_donations.id) as referral_count,
    COALESCE(SUM(CASE WHEN referral_donations.status = 'completed' THEN referral_donations.amount ELSE 0 END), 0) as referral_amount_confirmed,
    -- Combined totals
    COALESCE(SUM(CASE WHEN own_donations.status = 'completed' THEN own_donations.amount ELSE 0 END), 0) + 
    COALESCE(SUM(CASE WHEN referral_donations.status = 'completed' THEN referral_donations.amount ELSE 0 END), 0) as total_impact,
    d.created_at as donor_created_at
FROM donors d
LEFT JOIN donations own_donations ON d.id = own_donations.donor_id
LEFT JOIN donations referral_donations ON d.id = referral_donations.referrer_id
GROUP BY d.id, d.full_name, d.email, d.wallet_address, d.referral_code, d.created_at;

-- Function to generate unique referral codes
CREATE OR REPLACE FUNCTION generate_unique_referral_code(donor_name TEXT)
RETURNS TEXT AS $$
DECLARE
    base_code TEXT;
    final_code TEXT;
    counter INTEGER := 0;
    max_attempts INTEGER := 100;
BEGIN
    -- Create base code from donor name (first 3 chars + 4 random chars)
    base_code := UPPER(LEFT(REGEXP_REPLACE(donor_name, '[^A-Za-z]', '', 'g'), 3));
    
    -- If name has less than 3 letters, pad with random chars
    IF LENGTH(base_code) < 3 THEN
        base_code := base_code || UPPER(SUBSTRING(MD5(random()::text), 1, 3 - LENGTH(base_code)));
    END IF;
    
    -- Add 4 random characters
    final_code := base_code || UPPER(SUBSTRING(MD5(random()::text), 1, 4));
    
    -- Check for uniqueness and increment if needed
    WHILE EXISTS (SELECT 1 FROM donors WHERE referral_code = final_code) AND counter < max_attempts LOOP
        counter := counter + 1;
        final_code := base_code || UPPER(SUBSTRING(MD5(random()::text || counter::text), 1, 4));
    END LOOP;
    
    -- If we couldn't find a unique code after max attempts, use a UUID-based approach
    IF counter >= max_attempts THEN
        final_code := 'REF' || UPPER(SUBSTRING(MD5(uuid_generate_v4()::text), 1, 4));
    END IF;
    
    RETURN final_code;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to update donor totals when donations change (using existing schema)
CREATE OR REPLACE FUNCTION update_donor_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- Update referrer totals if this donation has a referrer
    IF NEW.referrer_id IS NOT NULL AND NEW.status = 'completed' THEN
        UPDATE donors 
        SET 
            total_raised = (
                SELECT COALESCE(SUM(amount), 0) 
                FROM donations 
                WHERE referrer_id = NEW.referrer_id AND status = 'completed'
            ),
            referral_count = (
                SELECT COUNT(*) 
                FROM donations 
                WHERE referrer_id = NEW.referrer_id AND status = 'completed'
            ),
            updated_at = NOW()
        WHERE id = NEW.referrer_id;
    END IF;
    
    -- Update candidate totals (using campaigns table for now)
    IF NEW.candidate_id IS NOT NULL THEN
        UPDATE campaigns 
        SET 
            current_amount = (
                SELECT COALESCE(SUM(amount), 0) 
                FROM donations 
                WHERE candidate_id = NEW.candidate_id AND status = 'completed'
            ),
            updated_at = NOW()
        WHERE id = NEW.candidate_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for donation updates (using existing status column)
CREATE TRIGGER trigger_update_totals
    AFTER INSERT OR UPDATE OF status ON donations
    FOR EACH ROW
    EXECUTE FUNCTION update_donor_totals();

-- Function to validate referral codes
CREATE OR REPLACE FUNCTION validate_referral_code(code TEXT)
RETURNS TABLE(is_valid BOOLEAN, donor_id UUID, donor_name TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        EXISTS(SELECT 1 FROM donors WHERE referral_code = code) as is_valid,
        d.id as donor_id,
        d.name as donor_name
    FROM donors d
    WHERE d.referral_code = code
    LIMIT 1;
    
    -- If no results, return false
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT;
    END IF;
END;
$$ LANGUAGE plpgsql;