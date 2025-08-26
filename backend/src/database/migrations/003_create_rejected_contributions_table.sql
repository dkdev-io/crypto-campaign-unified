-- Migration: Create rejected_contributions table for tracking failed/rejected contribution attempts
-- Purpose: Compliance tracking, error analysis, and fraud detection

-- Create enum for rejection reasons
CREATE TYPE rejection_reason AS ENUM (
    'KYC_NOT_VERIFIED',
    'EXCEEDS_CONTRIBUTION_LIMIT',
    'EXCEEDS_TRANSACTION_LIMIT',
    'INVALID_WALLET_ADDRESS',
    'INSUFFICIENT_FUNDS',
    'TRANSACTION_FAILED',
    'SMART_CONTRACT_ERROR',
    'NETWORK_ERROR',
    'DUPLICATE_TRANSACTION',
    'BLACKLISTED_ADDRESS',
    'SUSPICIOUS_ACTIVITY',
    'COMPLIANCE_VIOLATION',
    'INVALID_AMOUNT',
    'CAMPAIGN_INACTIVE',
    'CAMPAIGN_ENDED',
    'SYSTEM_ERROR',
    'OTHER'
);

-- Create rejected_contributions table
CREATE TABLE IF NOT EXISTS rejected_contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Transaction details
    transaction_hash VARCHAR(66),
    wallet_address VARCHAR(42) NOT NULL,
    amount_wei VARCHAR(78) NOT NULL,
    amount_usd DECIMAL(15,2),
    
    -- Campaign information
    campaign_id UUID REFERENCES campaigns(id),
    campaign_name VARCHAR(255),
    
    -- Rejection details
    rejection_reason rejection_reason NOT NULL,
    rejection_message TEXT,
    error_code VARCHAR(50),
    error_details JSONB,
    
    -- Context information
    kyc_status VARCHAR(50),
    contribution_limits JSONB,
    user_total_contributions DECIMAL(15,2),
    
    -- Network and technical details
    network VARCHAR(50),
    block_number BIGINT,
    gas_price VARCHAR(78),
    gas_used VARCHAR(78),
    contract_address VARCHAR(42),
    
    -- Request metadata
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    session_id VARCHAR(255),
    
    -- Compliance and risk scoring
    risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
    risk_factors JSONB,
    compliance_checks JSONB,
    
    -- Retry information
    retry_count INTEGER DEFAULT 0,
    last_retry_at TIMESTAMP WITH TIME ZONE,
    retry_allowed BOOLEAN DEFAULT true,
    
    -- Timestamps
    attempted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX idx_rejected_contributions_wallet ON rejected_contributions(wallet_address);
CREATE INDEX idx_rejected_contributions_campaign ON rejected_contributions(campaign_id);
CREATE INDEX idx_rejected_contributions_reason ON rejected_contributions(rejection_reason);
CREATE INDEX idx_rejected_contributions_attempted_at ON rejected_contributions(attempted_at);
CREATE INDEX idx_rejected_contributions_transaction_hash ON rejected_contributions(transaction_hash) WHERE transaction_hash IS NOT NULL;
CREATE INDEX idx_rejected_contributions_risk_score ON rejected_contributions(risk_score) WHERE risk_score > 50;

-- Create successful contributions table (if not exists)
CREATE TABLE IF NOT EXISTS contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Transaction details
    transaction_hash VARCHAR(66) UNIQUE NOT NULL,
    wallet_address VARCHAR(42) NOT NULL,
    amount_wei VARCHAR(78) NOT NULL,
    amount_usd DECIMAL(15,2) NOT NULL,
    
    -- Campaign information
    campaign_id UUID NOT NULL REFERENCES campaigns(id),
    campaign_name VARCHAR(255),
    
    -- Contributor information
    contributor_name VARCHAR(255),
    contributor_email VARCHAR(255),
    contributor_phone VARCHAR(50),
    contributor_address TEXT,
    
    -- KYC and compliance
    kyc_verified BOOLEAN DEFAULT false,
    kyc_verification_id VARCHAR(255),
    kyc_verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Blockchain details
    block_number BIGINT NOT NULL,
    block_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    gas_price VARCHAR(78),
    gas_used VARCHAR(78),
    contract_address VARCHAR(42) NOT NULL,
    network VARCHAR(50) NOT NULL,
    
    -- Processing details
    confirmation_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending',
    processed_at TIMESTAMP WITH TIME ZONE,
    
    -- FEC compliance fields
    employer VARCHAR(255),
    occupation VARCHAR(255),
    is_us_citizen BOOLEAN,
    contribution_type VARCHAR(50),
    
    -- Metadata
    metadata JSONB,
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for contributions table
CREATE INDEX IF NOT EXISTS idx_contributions_wallet ON contributions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_contributions_campaign ON contributions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_contributions_status ON contributions(status);
CREATE INDEX IF NOT EXISTS idx_contributions_created_at ON contributions(created_at);
CREATE INDEX IF NOT EXISTS idx_contributions_amount ON contributions(amount_usd);

-- Create trigger for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rejected_contributions_updated_at 
    BEFORE UPDATE ON rejected_contributions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contributions_updated_at 
    BEFORE UPDATE ON contributions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create view for contribution analytics
CREATE OR REPLACE VIEW contribution_analytics AS
SELECT 
    'successful' as type,
    campaign_id,
    COUNT(*) as count,
    SUM(amount_usd) as total_amount_usd,
    AVG(amount_usd) as avg_amount_usd,
    DATE_TRUNC('day', created_at) as date
FROM contributions
WHERE status = 'confirmed'
GROUP BY campaign_id, DATE_TRUNC('day', created_at)

UNION ALL

SELECT 
    'rejected' as type,
    campaign_id,
    COUNT(*) as count,
    SUM(amount_usd) as total_amount_usd,
    AVG(amount_usd) as avg_amount_usd,
    DATE_TRUNC('day', attempted_at) as date
FROM rejected_contributions
WHERE campaign_id IS NOT NULL
GROUP BY campaign_id, DATE_TRUNC('day', attempted_at);

-- Add comments for documentation
COMMENT ON TABLE rejected_contributions IS 'Stores all rejected or failed contribution attempts for compliance and analysis';
COMMENT ON TABLE contributions IS 'Stores all successful contributions with full transaction details';
COMMENT ON COLUMN rejected_contributions.rejection_reason IS 'Categorized reason for contribution rejection';
COMMENT ON COLUMN rejected_contributions.risk_score IS 'Risk assessment score from 0-100, higher indicates more risk';
COMMENT ON COLUMN contributions.status IS 'Transaction status: pending, confirming, confirmed, failed';