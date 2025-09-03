-- Comprehensive Row Level Security for Campaign Dashboard
-- Created: 2025-08-26
-- Description: Advanced RLS policies with analytics protection and audit trails

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================================================
-- ANALYTICS DATA TABLES
-- Define analytics tables with proper structure for RLS
-- =====================================================================================

-- Page Views Analytics Table
CREATE TABLE IF NOT EXISTS public.page_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    page_url TEXT NOT NULL,
    page_title TEXT,
    visitor_id UUID,
    session_id UUID,
    
    -- Analytics data
    view_count INTEGER DEFAULT 1,
    unique_views INTEGER DEFAULT 1,
    bounce_rate DECIMAL(5,2),
    time_on_page INTEGER, -- seconds
    
    -- Tracking information
    referrer TEXT,
    user_agent TEXT,
    ip_address INET,
    country VARCHAR(2),
    city VARCHAR(100),
    
    -- Timestamps
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for performance
    UNIQUE(campaign_id, page_url, visitor_id, DATE(viewed_at))
);

CREATE INDEX idx_page_views_campaign ON public.page_views(campaign_id);
CREATE INDEX idx_page_views_date ON public.page_views(viewed_at);
CREATE INDEX idx_page_views_visitor ON public.page_views(visitor_id);

-- Traffic Sources Analytics Table
CREATE TABLE IF NOT EXISTS public.traffic_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    
    -- Source information
    source_type VARCHAR(50) NOT NULL, -- organic, direct, social, email, paid, referral
    source_name VARCHAR(100), -- google, facebook, twitter, etc.
    medium VARCHAR(50), -- cpc, organic, email, social
    campaign_name VARCHAR(100), -- marketing campaign name
    
    -- Analytics metrics
    sessions INTEGER DEFAULT 0,
    users INTEGER DEFAULT 0,
    page_views INTEGER DEFAULT 0,
    bounce_rate DECIMAL(5,2),
    avg_session_duration INTEGER,
    conversion_rate DECIMAL(5,2),
    
    -- Timestamps and tracking
    tracked_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(campaign_id, source_type, source_name, tracked_date)
);

CREATE INDEX idx_traffic_sources_campaign ON public.traffic_sources(campaign_id);
CREATE INDEX idx_traffic_sources_date ON public.traffic_sources(tracked_date);
CREATE INDEX idx_traffic_sources_type ON public.traffic_sources(source_type);

-- User Sessions Analytics Table
CREATE TABLE IF NOT EXISTS public.analytics_user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    
    -- Session identification
    session_id UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    visitor_id UUID,
    
    -- Session data
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    duration INTEGER, -- seconds
    page_views INTEGER DEFAULT 0,
    is_bounce BOOLEAN DEFAULT false,
    
    -- User information
    ip_address INET,
    user_agent TEXT,
    country VARCHAR(2),
    city VARCHAR(100),
    device_type VARCHAR(20), -- desktop, mobile, tablet
    browser VARCHAR(50),
    os VARCHAR(50),
    
    -- Conversion tracking
    converted BOOLEAN DEFAULT false,
    conversion_value DECIMAL(20,2),
    conversion_type VARCHAR(50),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_analytics_sessions_campaign ON public.analytics_user_sessions(campaign_id);
CREATE INDEX idx_analytics_sessions_start ON public.analytics_user_sessions(start_time);
CREATE INDEX idx_analytics_sessions_visitor ON public.analytics_user_sessions(visitor_id);

-- Contributions Analytics Table (enhanced)
CREATE TABLE IF NOT EXISTS public.contributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    
    -- Contribution details
    wallet_address VARCHAR(64) NOT NULL,
    amount DECIMAL(20,8) NOT NULL,
    currency VARCHAR(10) DEFAULT 'ETH',
    transaction_hash VARCHAR(66) UNIQUE NOT NULL,
    block_number BIGINT,
    
    -- Contributor information
    contributor_email VARCHAR(255),
    contributor_name VARCHAR(200),
    is_anonymous BOOLEAN DEFAULT false,
    
    -- Analytics tracking
    referrer_source VARCHAR(100),
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    
    -- Status and verification
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed', 'refunded')),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    gas_fee DECIMAL(20,8),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure no duplicate transactions
    UNIQUE(transaction_hash)
);

CREATE INDEX idx_contributions_campaign ON public.contributions(campaign_id);
CREATE INDEX idx_contributions_wallet ON public.contributions(wallet_address);
CREATE INDEX idx_contributions_hash ON public.contributions(transaction_hash);
CREATE INDEX idx_contributions_status ON public.contributions(status);
CREATE INDEX idx_contributions_created ON public.contributions(created_at);

-- =====================================================================================
-- AUDIT TRAIL TABLES
-- Comprehensive audit logging for security monitoring
-- =====================================================================================

-- Access Audit Log
CREATE TABLE IF NOT EXISTS public.access_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- User and context information
    user_id UUID REFERENCES public.users(id),
    user_email VARCHAR(255),
    session_id UUID,
    
    -- Access details
    table_name VARCHAR(100) NOT NULL,
    record_id UUID,
    action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE', 'GRANT', 'REVOKE')),
    access_granted BOOLEAN NOT NULL,
    
    -- Security context
    ip_address INET,
    user_agent TEXT,
    request_id UUID,
    
    -- Failure details (if access denied)
    failure_reason TEXT,
    security_violation_type VARCHAR(50),
    
    -- RLS policy information
    policy_name VARCHAR(100),
    campaign_id UUID,
    permission_level VARCHAR(20),
    
    -- Timing
    access_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processing_time_ms INTEGER,
    
    -- Additional context
    query_fingerprint TEXT,
    additional_context JSONB
);

CREATE INDEX idx_access_audit_user ON public.access_audit_log(user_id);
CREATE INDEX idx_access_audit_time ON public.access_audit_log(access_time);
CREATE INDEX idx_access_audit_table ON public.access_audit_log(table_name);
CREATE INDEX idx_access_audit_granted ON public.access_audit_log(access_granted);
CREATE INDEX idx_access_audit_campaign ON public.access_audit_log(campaign_id);

-- Permission Changes Audit Log
CREATE TABLE IF NOT EXISTS public.permission_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Permission change details
    permission_id UUID REFERENCES public.user_permissions(id),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id),
    target_user_id UUID NOT NULL REFERENCES public.users(id),
    
    -- Change information
    action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('GRANTED', 'MODIFIED', 'REVOKED', 'EXPIRED')),
    old_permission_level VARCHAR(20),
    new_permission_level VARCHAR(20),
    
    -- Actor information
    changed_by_user_id UUID REFERENCES public.users(id),
    changed_by_email VARCHAR(255),
    
    -- Context
    reason TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    ip_address INET,
    user_agent TEXT,
    
    -- Timing
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_permission_audit_permission ON public.permission_audit_log(permission_id);
CREATE INDEX idx_permission_audit_campaign ON public.permission_audit_log(campaign_id);
CREATE INDEX idx_permission_audit_target ON public.permission_audit_log(target_user_id);
CREATE INDEX idx_permission_audit_time ON public.permission_audit_log(changed_at);

-- Security Alerts Table
CREATE TABLE IF NOT EXISTS public.security_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Alert information
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Context
    user_id UUID REFERENCES public.users(id),
    campaign_id UUID REFERENCES public.campaigns(id),
    table_name VARCHAR(100),
    
    -- Detection details
    pattern_matched VARCHAR(100),
    threshold_exceeded VARCHAR(100),
    suspicious_activity_count INTEGER,
    
    -- Network information
    ip_address INET,
    user_agent TEXT,
    country VARCHAR(2),
    
    -- Status
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'false_positive')),
    resolved_by UUID REFERENCES public.users(id),
    resolution_notes TEXT,
    
    -- Timing
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    -- Additional data
    metadata JSONB
);

CREATE INDEX idx_security_alerts_type ON public.security_alerts(alert_type);
CREATE INDEX idx_security_alerts_severity ON public.security_alerts(severity);
CREATE INDEX idx_security_alerts_user ON public.security_alerts(user_id);
CREATE INDEX idx_security_alerts_status ON public.security_alerts(status);
CREATE INDEX idx_security_alerts_detected ON public.security_alerts(detected_at);

-- =====================================================================================
-- ADVANCED SECURITY FUNCTIONS
-- Functions for permission validation and security checking
-- =====================================================================================

-- Enhanced permission validation function
CREATE OR REPLACE FUNCTION validate_campaign_access(
    user_id_param UUID,
    campaign_id_param UUID,
    required_permission TEXT DEFAULT 'read_only',
    log_access BOOLEAN DEFAULT true
)
RETURNS BOOLEAN AS $$
DECLARE
    has_access BOOLEAN := false;
    access_type TEXT := 'denied';
    user_email TEXT;
    campaign_owner UUID;
    processing_start TIMESTAMP := clock_timestamp();
    processing_time INTEGER;
BEGIN
    -- Get user email for logging
    SELECT email INTO user_email FROM public.users WHERE id = user_id_param;
    SELECT account_owner_id INTO campaign_owner FROM public.campaigns WHERE id = campaign_id_param;
    
    -- Check if user is account owner of the campaign
    SELECT EXISTS (
        SELECT 1 FROM public.campaigns c
        WHERE c.id = campaign_id_param
        AND c.account_owner_id = user_id_param
    ) INTO has_access;
    
    IF has_access THEN
        access_type := 'owner';
    ELSE
        -- Check if user created the campaign
        SELECT EXISTS (
            SELECT 1 FROM public.campaigns c
            WHERE c.id = campaign_id_param
            AND c.created_by_user_id = user_id_param
        ) INTO has_access;
        
        IF has_access THEN
            access_type := 'creator';
        ELSE
            -- Check explicit permissions
            SELECT EXISTS (
                SELECT 1 FROM public.user_permissions up
                WHERE up.campaign_id = campaign_id_param
                AND up.granted_to_user_id = user_id_param
                AND up.is_active = true
                AND (up.expires_at IS NULL OR up.expires_at > NOW())
                AND (
                    required_permission = 'read_only' OR
                    (required_permission = 'analytics_only' AND up.permission_level IN ('analytics_only', 'admin')) OR
                    (required_permission = 'admin' AND up.permission_level = 'admin')
                )
            ) INTO has_access;
            
            IF has_access THEN
                access_type := 'granted';
            END IF;
        END IF;
    END IF;
    
    -- Calculate processing time
    processing_time := EXTRACT(milliseconds FROM clock_timestamp() - processing_start);
    
    -- Log access attempt if requested
    IF log_access THEN
        INSERT INTO public.access_audit_log (
            user_id, user_email, table_name, record_id, action_type,
            access_granted, campaign_id, permission_level,
            access_time, processing_time_ms,
            policy_name, additional_context
        ) VALUES (
            user_id_param, user_email, 'campaigns', campaign_id_param, 'SELECT',
            has_access, campaign_id_param, required_permission,
            NOW(), processing_time,
            'validate_campaign_access', 
            jsonb_build_object('access_type', access_type, 'campaign_owner', campaign_owner)
        );
    END IF;
    
    RETURN has_access;
END;
$$ LANGUAGE 'plpgsql' SECURITY DEFINER;

-- Function to check for suspicious access patterns
CREATE OR REPLACE FUNCTION detect_suspicious_access(
    user_id_param UUID,
    table_name_param TEXT,
    timeframe_minutes INTEGER DEFAULT 5
)
RETURNS BOOLEAN AS $$
DECLARE
    access_count INTEGER;
    failed_access_count INTEGER;
    different_ips INTEGER;
    is_suspicious BOOLEAN := false;
    alert_title TEXT;
BEGIN
    -- Count recent access attempts
    SELECT COUNT(*) INTO access_count
    FROM public.access_audit_log
    WHERE user_id = user_id_param
    AND table_name = table_name_param
    AND access_time > NOW() - INTERVAL '1 minute' * timeframe_minutes;
    
    -- Count failed access attempts
    SELECT COUNT(*) INTO failed_access_count
    FROM public.access_audit_log
    WHERE user_id = user_id_param
    AND table_name = table_name_param
    AND access_granted = false
    AND access_time > NOW() - INTERVAL '1 minute' * timeframe_minutes;
    
    -- Count different IP addresses
    SELECT COUNT(DISTINCT ip_address) INTO different_ips
    FROM public.access_audit_log
    WHERE user_id = user_id_param
    AND access_time > NOW() - INTERVAL '1 minute' * timeframe_minutes;
    
    -- Determine if activity is suspicious
    IF access_count > 100 OR failed_access_count > 10 OR different_ips > 3 THEN
        is_suspicious := true;
        
        -- Create security alert
        IF access_count > 100 THEN
            alert_title := 'High Volume Access Pattern Detected';
        ELSIF failed_access_count > 10 THEN
            alert_title := 'Multiple Failed Access Attempts';
        ELSE
            alert_title := 'Multiple IP Addresses Detected';
        END IF;
        
        INSERT INTO public.security_alerts (
            alert_type, severity, title, description, user_id, table_name,
            suspicious_activity_count, metadata
        ) VALUES (
            'suspicious_access', 
            CASE WHEN access_count > 200 OR failed_access_count > 20 THEN 'high' ELSE 'medium' END,
            alert_title,
            format('User %s showed suspicious access patterns: %s total accesses, %s failed, %s different IPs in %s minutes',
                   user_id_param, access_count, failed_access_count, different_ips, timeframe_minutes),
            user_id_param, table_name_param,
            access_count,
            jsonb_build_object(
                'total_access', access_count,
                'failed_access', failed_access_count, 
                'different_ips', different_ips,
                'timeframe_minutes', timeframe_minutes
            )
        );
    END IF;
    
    RETURN is_suspicious;
END;
$$ LANGUAGE 'plpgsql' SECURITY DEFINER;

-- Function to automatically expire permissions
CREATE OR REPLACE FUNCTION expire_user_permissions()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    -- Update expired permissions
    WITH expired_permissions AS (
        UPDATE public.user_permissions 
        SET is_active = false, 
            revoked_at = NOW(),
            revoked_reason = 'Automatically expired'
        WHERE expires_at < NOW() 
        AND is_active = true
        RETURNING id, campaign_id, granted_to_user_id, permission_level
    )
    INSERT INTO public.permission_audit_log (
        permission_id, campaign_id, target_user_id, 
        action_type, old_permission_level, new_permission_level,
        changed_by_user_id, reason, changed_at
    )
    SELECT 
        ep.id, ep.campaign_id, ep.granted_to_user_id,
        'EXPIRED', ep.permission_level, NULL,
        NULL, 'Automatically expired due to expiration date', NOW()
    FROM expired_permissions ep;
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    
    RETURN expired_count;
END;
$$ LANGUAGE 'plpgsql' SECURITY DEFINER;

-- =====================================================================================
-- ENABLE RLS ON ALL ANALYTICS TABLES
-- =====================================================================================

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traffic_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permission_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;