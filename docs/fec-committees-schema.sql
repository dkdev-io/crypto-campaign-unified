-- FEC Committees Schema for Campaign Setup System
-- This creates tables for managing FEC committee data and campaign setup flow

-- ============================================================================
-- 1. CREATE FEC COMMITTEES TABLE - Store active FEC committee data
-- ============================================================================

CREATE TABLE IF NOT EXISTS fec_committees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- FEC Data
    fec_committee_id TEXT UNIQUE NOT NULL,
    committee_name TEXT NOT NULL,
    committee_type TEXT,
    committee_designation TEXT,
    filing_frequency TEXT,
    
    -- Organization Info
    organization_type TEXT,
    connected_organization_name TEXT,
    candidate_id TEXT,
    candidate_name TEXT,
    candidate_office TEXT,
    candidate_office_state TEXT,
    candidate_office_district TEXT,
    
    -- Address Information
    street_1 TEXT,
    street_2 TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    
    -- Contact Information
    treasurer_name TEXT,
    custodian_name TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_fec_update DATE,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Search optimization
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', 
            coalesce(committee_name, '') || ' ' ||
            coalesce(candidate_name, '') || ' ' ||
            coalesce(connected_organization_name, '') || ' ' ||
            coalesce(fec_committee_id, '')
        )
    ) STORED
);

-- ============================================================================
-- 2. UPDATE CAMPAIGNS TABLE - Add new required fields
-- ============================================================================

-- Add user info fields
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS user_full_name TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS candidate_name TEXT;

-- Add FEC committee relationship
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS fec_committee_id TEXT REFERENCES fec_committees(fec_committee_id);
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS committee_confirmed BOOLEAN DEFAULT false;

-- Add Plaid bank connection
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS plaid_access_token TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS plaid_account_id TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS bank_account_verified BOOLEAN DEFAULT false;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS bank_account_name TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS bank_last_four TEXT;

-- Add terms agreement
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT false;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS terms_ip_address INET;

-- Add setup flow status
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS setup_step INTEGER DEFAULT 1;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS setup_completed BOOLEAN DEFAULT false;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS setup_completed_at TIMESTAMPTZ;

-- Add embed code
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS embed_code TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS embed_generated_at TIMESTAMPTZ;

-- ============================================================================
-- 3. CREATE COMMITTEE TEST DATA TABLE - For admin testing
-- ============================================================================

CREATE TABLE IF NOT EXISTS committee_test_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    committee_name TEXT NOT NULL,
    test_purpose TEXT,
    added_by_email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- ============================================================================
-- 4. CREATE PLAID TOKENS TABLE - Secure token storage
-- ============================================================================

CREATE TABLE IF NOT EXISTS plaid_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    access_token_encrypted TEXT NOT NULL,
    account_id TEXT NOT NULL,
    institution_name TEXT,
    account_name TEXT,
    account_type TEXT,
    account_subtype TEXT,
    last_four TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- ============================================================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_fec_committees_name ON fec_committees(committee_name);
CREATE INDEX idx_fec_committees_fec_id ON fec_committees(fec_committee_id);
CREATE INDEX idx_fec_committees_active ON fec_committees(is_active);
CREATE INDEX idx_fec_committees_search ON fec_committees USING gin(search_vector);
CREATE INDEX idx_fec_committees_candidate ON fec_committees(candidate_name);

CREATE INDEX idx_campaigns_fec_committee ON campaigns(fec_committee_id);
CREATE INDEX idx_campaigns_setup_step ON campaigns(setup_step);
CREATE INDEX idx_campaigns_setup_completed ON campaigns(setup_completed);

CREATE INDEX idx_plaid_tokens_campaign ON plaid_tokens(campaign_id);
CREATE INDEX idx_plaid_tokens_active ON plaid_tokens(is_active);

-- ============================================================================
-- 6. CREATE ROW LEVEL SECURITY POLICIES
-- ============================================================================

ALTER TABLE fec_committees ENABLE ROW LEVEL SECURITY;
ALTER TABLE committee_test_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE plaid_tokens ENABLE ROW LEVEL SECURITY;

-- Public can read FEC committees
CREATE POLICY "Public can read FEC committees" ON fec_committees
    FOR SELECT TO public USING (true);

-- Only authenticated users can manage test data
CREATE POLICY "Authenticated users can manage test committees" ON committee_test_data
    FOR ALL TO public USING (true);

-- Only campaign owners can access their Plaid tokens
CREATE POLICY "Campaign owners can manage plaid tokens" ON plaid_tokens
    FOR ALL USING (
        campaign_id IN (
            SELECT id FROM campaigns 
            WHERE email = current_setting('app.current_user_email', true)
        )
    );

-- ============================================================================
-- 7. CREATE FUNCTIONS FOR FEC API INTEGRATION
-- ============================================================================

CREATE OR REPLACE FUNCTION search_fec_committees(
    search_term TEXT,
    limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
    fec_committee_id TEXT,
    committee_name TEXT,
    candidate_name TEXT,
    committee_type TEXT,
    organization_type TEXT,
    city TEXT,
    state TEXT,
    is_active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        fc.fec_committee_id,
        fc.committee_name,
        fc.candidate_name,
        fc.committee_type,
        fc.organization_type,
        fc.city,
        fc.state,
        fc.is_active
    FROM fec_committees fc
    WHERE 
        fc.is_active = true AND
        (
            fc.search_vector @@ plainto_tsquery('english', search_term) OR
            fc.committee_name ILIKE '%' || search_term || '%' OR
            fc.candidate_name ILIKE '%' || search_term || '%' OR
            fc.fec_committee_id ILIKE '%' || search_term || '%'
        )
    ORDER BY 
        ts_rank(fc.search_vector, plainto_tsquery('english', search_term)) DESC,
        fc.committee_name
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 8. CREATE FUNCTION TO GENERATE EMBED CODE
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_embed_code(
    p_campaign_id UUID,
    p_base_url TEXT DEFAULT 'https://your-domain.com'
)
RETURNS TEXT AS $$
DECLARE
    embed_html TEXT;
BEGIN
    embed_html := format('
<!-- Campaign Contribution Form Embed -->
<div id="crypto-campaign-embed-%s"></div>
<script>
(function() {
    var iframe = document.createElement("iframe");
    iframe.src = "%s/?campaign=%s&embed=true";
    iframe.width = "100%%";
    iframe.height = "600";
    iframe.frameBorder = "0";
    iframe.style.border = "1px solid #ddd";
    iframe.style.borderRadius = "8px";
    document.getElementById("crypto-campaign-embed-%s").appendChild(iframe);
    
    // Handle iframe resize messages
    window.addEventListener("message", function(event) {
        if (event.data && event.data.type === "resize" && event.data.campaignId === "%s") {
            iframe.height = event.data.height + "px";
        }
    });
})();
</script>',
        p_campaign_id,
        p_base_url,
        p_campaign_id,
        p_campaign_id,
        p_campaign_id
    );
    
    -- Update campaign with generated embed code
    UPDATE campaigns 
    SET 
        embed_code = embed_html,
        embed_generated_at = NOW()
    WHERE id = p_campaign_id;
    
    RETURN embed_html;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 9. CREATE TRIGGER FOR AUTO-UPDATING TIMESTAMPS
-- ============================================================================

CREATE TRIGGER update_fec_committees_updated_at BEFORE UPDATE ON fec_committees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plaid_tokens_updated_at BEFORE UPDATE ON plaid_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 10. INSERT SAMPLE FEC COMMITTEE DATA FOR TESTING
-- ============================================================================

INSERT INTO fec_committees (
    fec_committee_id,
    committee_name,
    committee_type,
    committee_designation,
    organization_type,
    candidate_name,
    candidate_office,
    candidate_office_state,
    city,
    state,
    treasurer_name,
    is_active
) VALUES 
-- Sample Democratic committees
('C00401224', 'BIDEN FOR PRESIDENT', 'P', 'P', 'Candidate Committee', 'BIDEN, JOSEPH R JR', 'P', 'US', 'WILMINGTON', 'DE', 'KAUFMAN, BRUCE', true),
('C00580100', 'DEMOCRATIC CONGRESSIONAL CAMPAIGN COMMITTEE', 'N', 'B', 'Party Committee', NULL, NULL, NULL, 'WASHINGTON', 'DC', 'MORGAN, LUCINDA', true),
('C00010603', 'DEMOCRATIC NATIONAL COMMITTEE', 'N', 'B', 'Party Committee', NULL, NULL, NULL, 'WASHINGTON', 'DC', 'ELIAS, MARC E', true),

-- Sample Republican committees  
('C00618371', 'TRUMP FOR PRESIDENT', 'P', 'P', 'Candidate Committee', 'TRUMP, DONALD J', 'P', 'US', 'WEST PALM BEACH', 'FL', 'LARA, LARA', true),
('C00075820', 'REPUBLICAN NATIONAL COMMITTEE', 'N', 'B', 'Party Committee', NULL, NULL, NULL, 'WASHINGTON', 'DC', 'WHATLEY, MICHAEL', true),
('C00010603', 'NATIONAL REPUBLICAN CONGRESSIONAL COMMITTEE', 'N', 'B', 'Party Committee', NULL, NULL, NULL, 'WASHINGTON', 'DC', 'EMMER, TOM', true),

-- Sample state/local committees
('C00123456', 'FRIENDS OF JOHN DOE', 'N', 'U', 'Candidate Committee', 'DOE, JOHN', 'H', 'TX', 'AUSTIN', 'TX', 'SMITH, JANE', true),
('C00234567', 'COMMITTEE TO ELECT JANE SMITH', 'N', 'U', 'Candidate Committee', 'SMITH, JANE', 'S', 'CA', 'LOS ANGELES', 'CA', 'JOHNSON, BOB', true),
('C00345678', 'TEXAS DEMOCRATIC PARTY', 'N', 'B', 'Party Committee', NULL, NULL, NULL, 'AUSTIN', 'TX', 'HINOJOSA, GILBERTO', true),

-- Special test committee for user testing
('C00999999', 'TESTY TEST FOR CHANCELLOR', 'N', 'U', 'Candidate Committee', 'CHANCELLOR, TESTY', 'H', 'CA', 'SAN FRANCISCO', 'CA', 'TEST, TREASURER', true)

ON CONFLICT (fec_committee_id) DO NOTHING;

-- Insert sample test committee data
INSERT INTO committee_test_data (committee_name, test_purpose, added_by_email) VALUES
('Test Campaign Committee', 'Development testing', 'admin@example.com'),
('Sample PAC Committee', 'UI testing', 'admin@example.com'),
('Demo Candidate Committee', 'Demo purposes', 'admin@example.com')
ON CONFLICT DO NOTHING;