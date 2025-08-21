-- Enhanced Contribution Tracking Schema for Campaign System
-- This creates comprehensive tables for tracking all types of donations

-- ============================================================================
-- 1. UPDATE CAMPAIGNS TABLE - Add fields for contribution tracking
-- ============================================================================

ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS committee_name TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS fec_committee_id TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS contribution_count INTEGER DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS total_raised DECIMAL(10,2) DEFAULT 0;

-- ============================================================================
-- 2. CREATE CONTRIBUTIONS TABLE - Main contribution tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS contributions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Campaign & Transaction Info
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    transaction_code TEXT UNIQUE NOT NULL,
    
    -- Donor Information
    donor_full_name TEXT NOT NULL,
    donor_email TEXT NOT NULL,
    donor_phone TEXT,
    donor_street TEXT NOT NULL,
    donor_city TEXT NOT NULL,
    donor_state TEXT NOT NULL,
    donor_zip TEXT NOT NULL,
    donor_employer TEXT NOT NULL,
    donor_occupation TEXT NOT NULL,
    
    -- Contribution Details
    amount_usd DECIMAL(10,2) NOT NULL,
    donation_type TEXT NOT NULL CHECK (donation_type IN ('one_time', 'recurring', 'scheduled')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected', 'held', 'cancelled', 'refunded')),
    
    -- Payment Information
    payment_method TEXT CHECK (payment_method IN ('credit_card', 'debit_card', 'ach', 'crypto')),
    cryptocurrency TEXT,
    crypto_amount DECIMAL(18,8),
    wallet_address TEXT,
    transaction_hash TEXT,
    
    -- Recurring/Scheduled Details
    is_recurring BOOLEAN DEFAULT false,
    recurring_frequency TEXT CHECK (recurring_frequency IN ('weekly', 'bi-weekly', 'monthly', 'quarterly', 'annually')),
    recurring_start_date DATE,
    recurring_end_date DATE,
    recurring_amount DECIMAL(10,2),
    recurring_total_expected DECIMAL(10,2),
    auto_cancel_date DATE,
    auto_cancel_reason TEXT,
    parent_transaction_id UUID REFERENCES contributions(id),
    
    -- Scheduled Payment Details
    scheduled_date DATE,
    
    -- FEC Compliance Confirmations
    citizenship_confirmed BOOLEAN NOT NULL DEFAULT false,
    own_funds_confirmed BOOLEAN NOT NULL DEFAULT false,
    age_confirmed BOOLEAN NOT NULL DEFAULT false,
    not_contractor_confirmed BOOLEAN NOT NULL DEFAULT false,
    personal_card_confirmed BOOLEAN NOT NULL DEFAULT false,
    sms_consent_confirmed BOOLEAN DEFAULT false,
    not_oil_gas_confirmed BOOLEAN DEFAULT false,
    terms_accepted BOOLEAN NOT NULL DEFAULT false,
    bluetokens_terms_accepted BOOLEAN DEFAULT false,
    
    -- Metadata
    ip_address INET,
    user_agent TEXT,
    referrer_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    
    -- Notes & Admin
    internal_notes TEXT,
    rejection_reason TEXT,
    hold_reason TEXT
);

-- ============================================================================
-- 3. CREATE RECURRING PAYMENTS TABLE - Track recurring payment instances
-- ============================================================================

CREATE TABLE IF NOT EXISTS recurring_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    parent_contribution_id UUID NOT NULL REFERENCES contributions(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    
    -- Payment Details
    payment_number INTEGER NOT NULL,
    amount_usd DECIMAL(10,2) NOT NULL,
    scheduled_date DATE NOT NULL,
    processed_date TIMESTAMPTZ,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'processing', 'completed', 'failed', 'cancelled', 'skipped')),
    
    -- Transaction Info
    transaction_code TEXT UNIQUE,
    transaction_hash TEXT,
    
    -- Error Handling
    failure_reason TEXT,
    retry_count INTEGER DEFAULT 0,
    last_retry_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. CREATE CONTRIBUTION LIMITS TABLE - Track cumulative contributions
-- ============================================================================

CREATE TABLE IF NOT EXISTS contribution_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    
    -- Donor Identification
    donor_email TEXT NOT NULL,
    donor_full_name TEXT NOT NULL,
    
    -- Cumulative Tracking
    total_contributed DECIMAL(10,2) DEFAULT 0,
    remaining_capacity DECIMAL(10,2) DEFAULT 3300,
    
    -- Recurring Projections
    projected_recurring_total DECIMAL(10,2) DEFAULT 0,
    projected_total DECIMAL(10,2) DEFAULT 0,
    
    -- Limits
    will_exceed_limit BOOLEAN DEFAULT false,
    projected_exceed_date DATE,
    
    -- Metadata
    first_contribution_date TIMESTAMPTZ,
    last_contribution_date TIMESTAMPTZ,
    contribution_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint per campaign and donor
    UNIQUE(campaign_id, donor_email)
);

-- ============================================================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_contributions_campaign_id ON contributions(campaign_id);
CREATE INDEX idx_contributions_transaction_code ON contributions(transaction_code);
CREATE INDEX idx_contributions_donor_email ON contributions(donor_email);
CREATE INDEX idx_contributions_status ON contributions(status);
CREATE INDEX idx_contributions_donation_type ON contributions(donation_type);
CREATE INDEX idx_contributions_created_at ON contributions(created_at DESC);

CREATE INDEX idx_recurring_payments_parent ON recurring_payments(parent_contribution_id);
CREATE INDEX idx_recurring_payments_scheduled ON recurring_payments(scheduled_date);
CREATE INDEX idx_recurring_payments_status ON recurring_payments(status);

CREATE INDEX idx_contribution_limits_campaign ON contribution_limits(campaign_id);
CREATE INDEX idx_contribution_limits_email ON contribution_limits(donor_email);

-- ============================================================================
-- 6. CREATE ROW LEVEL SECURITY POLICIES
-- ============================================================================

ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE contribution_limits ENABLE ROW LEVEL SECURITY;

-- Public can insert contributions
CREATE POLICY "Public can insert contributions" ON contributions
    FOR INSERT WITH CHECK (true);

-- Public can view their own contributions
CREATE POLICY "Donors can view own contributions" ON contributions
    FOR SELECT USING (donor_email = current_setting('app.current_user_email', true));

-- Campaign owners can view their contributions
CREATE POLICY "Campaign owners can view contributions" ON contributions
    FOR SELECT USING (
        campaign_id IN (
            SELECT id FROM campaigns 
            WHERE email = current_setting('app.current_user_email', true)
        )
    );

-- Similar policies for recurring_payments and contribution_limits
CREATE POLICY "Public can insert recurring payments" ON recurring_payments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can view recurring payments" ON recurring_payments
    FOR SELECT USING (true);

CREATE POLICY "Public can manage contribution limits" ON contribution_limits
    FOR ALL USING (true);

-- ============================================================================
-- 7. CREATE FUNCTIONS FOR TRANSACTION CODE GENERATION
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_transaction_code()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '';
    i INTEGER;
BEGIN
    -- Generate format: TXN-XXXXXXXX-XXXX
    result := 'TXN-';
    
    -- First segment (8 chars)
    FOR i IN 1..8 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    
    result := result || '-';
    
    -- Second segment (4 chars)
    FOR i IN 1..4 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 8. CREATE TRIGGER FOR AUTO-UPDATING TIMESTAMPS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contributions_updated_at BEFORE UPDATE ON contributions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recurring_payments_updated_at BEFORE UPDATE ON recurring_payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contribution_limits_updated_at BEFORE UPDATE ON contribution_limits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 9. CREATE FUNCTION TO CALCULATE RECURRING PROJECTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_recurring_projection(
    p_amount DECIMAL,
    p_frequency TEXT,
    p_start_date DATE,
    p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
    total_amount DECIMAL,
    payment_count INTEGER,
    will_exceed_limit BOOLEAN,
    exceed_date DATE
) AS $$
DECLARE
    v_total DECIMAL := 0;
    v_count INTEGER := 0;
    v_current_date DATE := p_start_date;
    v_exceed_date DATE := NULL;
    v_interval INTERVAL;
BEGIN
    -- Set interval based on frequency
    CASE p_frequency
        WHEN 'weekly' THEN v_interval := '1 week'::INTERVAL;
        WHEN 'bi-weekly' THEN v_interval := '2 weeks'::INTERVAL;
        WHEN 'monthly' THEN v_interval := '1 month'::INTERVAL;
        WHEN 'quarterly' THEN v_interval := '3 months'::INTERVAL;
        WHEN 'annually' THEN v_interval := '1 year'::INTERVAL;
        ELSE v_interval := '1 month'::INTERVAL;
    END CASE;
    
    -- Calculate projections
    WHILE (p_end_date IS NULL OR v_current_date <= p_end_date) 
          AND v_total + p_amount <= 3300 
          AND v_count < 100 LOOP
        v_total := v_total + p_amount;
        v_count := v_count + 1;
        
        IF v_total + p_amount > 3300 AND v_exceed_date IS NULL THEN
            v_exceed_date := v_current_date;
        END IF;
        
        v_current_date := v_current_date + v_interval;
    END LOOP;
    
    RETURN QUERY SELECT 
        v_total,
        v_count,
        v_total >= 3300,
        v_exceed_date;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 10. SAMPLE DATA FOR TESTING (OPTIONAL)
-- ============================================================================

-- Uncomment to insert test campaign
/*
INSERT INTO campaigns (
    email, 
    campaign_name, 
    candidate_name,
    committee_name,
    website, 
    wallet_address,
    suggested_amounts,
    max_donation_limit
) VALUES (
    'test@campaign.com',
    'Test Campaign 2024',
    'John Doe',
    'Friends of John Doe',
    'https://johndoe2024.com',
    '0x1234567890123456789012345678901234567890',
    ARRAY[25, 50, 100, 250, 500],
    3300
);
*/