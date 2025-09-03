-- Campaign Analytics Tracking System
-- Created: 2025-08-26
-- Description: Comprehensive user analytics tracking for contribution campaigns

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================================================
-- ANALYTICS TABLES
-- Enhanced analytics tables for campaign tracking
-- =====================================================================================

-- Enhanced Page Views Table
DROP TABLE IF EXISTS public.page_views CASCADE;
CREATE TABLE public.page_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    
    -- Visitor tracking
    visitor_id UUID NOT NULL, -- Anonymous visitor identifier
    session_id UUID NOT NULL, -- Links to user_sessions table
    
    -- Page information
    page_url TEXT NOT NULL,
    page_title VARCHAR(255),
    referrer TEXT,
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    utm_content VARCHAR(100),
    utm_term VARCHAR(100),
    
    -- Technical details
    user_agent TEXT,
    ip_address INET,
    browser VARCHAR(50),
    browser_version VARCHAR(20),
    os VARCHAR(50),
    os_version VARCHAR(20),
    device_type VARCHAR(20) CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
    screen_resolution VARCHAR(20),
    
    -- Geographic data
    country VARCHAR(2), -- ISO country code
    region VARCHAR(100),
    city VARCHAR(100),
    latitude DECIMAL(10,6),
    longitude DECIMAL(10,6),
    timezone VARCHAR(50),
    
    -- Session timing
    session_start TIMESTAMP WITH TIME ZONE NOT NULL,
    session_end TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    page_load_time_ms INTEGER,
    
    -- Engagement metrics
    scroll_depth DECIMAL(5,2), -- Percentage scrolled
    time_to_first_click INTEGER, -- Milliseconds
    clicks_count INTEGER DEFAULT 0,
    form_submissions INTEGER DEFAULT 0,
    
    -- Conversion tracking
    is_bounce BOOLEAN DEFAULT false,
    converted BOOLEAN DEFAULT false,
    conversion_value DECIMAL(20,8),
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Traffic Sources Table
DROP TABLE IF EXISTS public.traffic_sources CASCADE;
CREATE TABLE public.traffic_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    
    -- Source classification
    source VARCHAR(100) NOT NULL, -- google, facebook, twitter, direct, etc.
    medium VARCHAR(50) NOT NULL, -- organic, cpc, social, email, referral, direct
    campaign_name VARCHAR(100), -- Marketing campaign name
    source_detail VARCHAR(200), -- More specific source info
    
    -- Attribution data
    first_click BOOLEAN DEFAULT false, -- First touch attribution
    last_click BOOLEAN DEFAULT false, -- Last touch attribution
    assisted BOOLEAN DEFAULT false, -- Assisted conversion
    
    -- Aggregated metrics (calculated daily)
    date_recorded DATE NOT NULL DEFAULT CURRENT_DATE,
    visitor_count INTEGER DEFAULT 0,
    session_count INTEGER DEFAULT 0,
    page_views_count INTEGER DEFAULT 0,
    unique_page_views INTEGER DEFAULT 0,
    
    -- Engagement metrics
    bounce_rate DECIMAL(5,2), -- Percentage of single-page sessions
    avg_session_duration INTEGER, -- Average session duration in seconds
    pages_per_session DECIMAL(5,2),
    
    -- Conversion metrics
    conversion_count INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,2), -- Percentage of sessions that converted
    total_conversion_value DECIMAL(20,8) DEFAULT 0,
    avg_conversion_value DECIMAL(20,8) DEFAULT 0,
    
    -- Revenue attribution
    attributed_revenue DECIMAL(20,8) DEFAULT 0,
    first_touch_revenue DECIMAL(20,8) DEFAULT 0,
    last_touch_revenue DECIMAL(20,8) DEFAULT 0,
    assisted_revenue DECIMAL(20,8) DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint for daily aggregation
    UNIQUE(campaign_id, source, medium, COALESCE(campaign_name, ''), date_recorded)
);

-- User Sessions Table  
DROP TABLE IF EXISTS public.user_sessions_analytics CASCADE;
CREATE TABLE public.user_sessions_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    
    -- Session identification
    visitor_id UUID NOT NULL, -- Anonymous visitor identifier
    session_id UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    
    -- Session timing
    session_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    session_end TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    idle_time_seconds INTEGER DEFAULT 0,
    active_time_seconds INTEGER DEFAULT 0,
    
    -- Session details
    page_count INTEGER DEFAULT 0,
    unique_page_count INTEGER DEFAULT 0,
    is_bounce BOOLEAN DEFAULT false,
    is_new_visitor BOOLEAN DEFAULT true,
    
    -- Traffic source (first touch for this session)
    traffic_source VARCHAR(100),
    traffic_medium VARCHAR(50),
    traffic_campaign VARCHAR(100),
    referrer TEXT,
    landing_page TEXT,
    exit_page TEXT,
    
    -- Technical details
    user_agent TEXT,
    ip_address INET,
    browser VARCHAR(50),
    os VARCHAR(50),
    device_type VARCHAR(20),
    
    -- Geographic data
    country VARCHAR(2),
    region VARCHAR(100),
    city VARCHAR(100),
    
    -- Engagement metrics
    scroll_depth_max DECIMAL(5,2), -- Maximum scroll depth across all pages
    clicks_total INTEGER DEFAULT 0,
    downloads_count INTEGER DEFAULT 0,
    video_plays INTEGER DEFAULT 0,
    social_shares INTEGER DEFAULT 0,
    
    -- Conversion tracking
    contributed BOOLEAN DEFAULT false,
    contribution_amount DECIMAL(20,8),
    contribution_transaction_hash VARCHAR(66),
    conversion_timestamp TIMESTAMP WITH TIME ZONE,
    days_to_conversion INTEGER, -- Days between first visit and conversion
    
    -- Attribution
    attribution_source VARCHAR(100), -- Source that gets credit for conversion
    attribution_medium VARCHAR(50),
    attribution_campaign VARCHAR(100),
    
    -- Quality metrics
    quality_score INTEGER CHECK (quality_score BETWEEN 0 AND 100), -- 0-100 quality score
    spam_score INTEGER CHECK (spam_score BETWEEN 0 AND 100), -- 0-100 spam likelihood
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================================================
-- PERFORMANCE INDEXES
-- Optimized indexes for analytics queries
-- =====================================================================================

-- Page Views Indexes
CREATE INDEX idx_page_views_campaign_date ON public.page_views(campaign_id, DATE(session_start));
CREATE INDEX idx_page_views_visitor ON public.page_views(visitor_id);
CREATE INDEX idx_page_views_session ON public.page_views(session_id);
CREATE INDEX idx_page_views_url ON public.page_views(page_url);
CREATE INDEX idx_page_views_referrer ON public.page_views(referrer);
CREATE INDEX idx_page_views_utm_source ON public.page_views(utm_source) WHERE utm_source IS NOT NULL;
CREATE INDEX idx_page_views_country ON public.page_views(country) WHERE country IS NOT NULL;
CREATE INDEX idx_page_views_device ON public.page_views(device_type);
CREATE INDEX idx_page_views_conversion ON public.page_views(campaign_id, converted) WHERE converted = true;
CREATE INDEX idx_page_views_duration ON public.page_views(campaign_id, duration_seconds) WHERE duration_seconds IS NOT NULL;

-- Traffic Sources Indexes
CREATE INDEX idx_traffic_sources_campaign_date ON public.traffic_sources(campaign_id, date_recorded);
CREATE INDEX idx_traffic_sources_source_medium ON public.traffic_sources(source, medium);
CREATE INDEX idx_traffic_sources_conversion_rate ON public.traffic_sources(campaign_id, conversion_rate DESC);
CREATE INDEX idx_traffic_sources_visitor_count ON public.traffic_sources(campaign_id, visitor_count DESC);
CREATE INDEX idx_traffic_sources_revenue ON public.traffic_sources(campaign_id, attributed_revenue DESC);

-- User Sessions Analytics Indexes
CREATE INDEX idx_sessions_campaign_date ON public.user_sessions_analytics(campaign_id, DATE(session_start));
CREATE INDEX idx_sessions_visitor ON public.user_sessions_analytics(visitor_id);
CREATE INDEX idx_sessions_conversion ON public.user_sessions_analytics(campaign_id, contributed) WHERE contributed = true;
CREATE INDEX idx_sessions_duration ON public.user_sessions_analytics(campaign_id, duration_seconds DESC);
CREATE INDEX idx_sessions_quality ON public.user_sessions_analytics(campaign_id, quality_score DESC);
CREATE INDEX idx_sessions_source ON public.user_sessions_analytics(traffic_source, traffic_medium);
CREATE INDEX idx_sessions_new_visitor ON public.user_sessions_analytics(campaign_id, is_new_visitor);
CREATE INDEX idx_sessions_country ON public.user_sessions_analytics(country) WHERE country IS NOT NULL;

-- Composite indexes for common queries
CREATE INDEX idx_sessions_campaign_source_date ON public.user_sessions_analytics(campaign_id, traffic_source, DATE(session_start));
CREATE INDEX idx_page_views_campaign_visitor_date ON public.page_views(campaign_id, visitor_id, DATE(session_start));
CREATE INDEX idx_traffic_conversion_summary ON public.traffic_sources(campaign_id, date_recorded, conversion_count DESC, attributed_revenue DESC);

-- =====================================================================================
-- ANALYTICS CALCULATION FUNCTIONS
-- Functions to calculate key analytics metrics
-- =====================================================================================

-- Calculate session duration and update records
CREATE OR REPLACE FUNCTION calculate_session_duration(session_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
    session_start_time TIMESTAMP WITH TIME ZONE;
    session_end_time TIMESTAMP WITH TIME ZONE;
    calculated_duration INTEGER;
    page_view_count INTEGER;
BEGIN
    -- Get session start time from first page view
    SELECT MIN(session_start), MAX(COALESCE(session_end, session_start)), COUNT(*)
    INTO session_start_time, session_end_time, page_view_count
    FROM public.page_views 
    WHERE session_id = session_id_param;
    
    IF session_start_time IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Calculate duration in seconds
    calculated_duration := EXTRACT(EPOCH FROM (session_end_time - session_start_time))::INTEGER;
    
    -- Update user session record
    UPDATE public.user_sessions_analytics 
    SET 
        session_end = session_end_time,
        duration_seconds = calculated_duration,
        page_count = page_view_count,
        is_bounce = (page_view_count = 1 AND calculated_duration < 30), -- Bounce if single page and < 30 seconds
        updated_at = NOW()
    WHERE session_id = session_id_param;
    
    -- Update individual page views with session duration
    UPDATE public.page_views
    SET duration_seconds = calculated_duration, updated_at = NOW()
    WHERE session_id = session_id_param AND duration_seconds IS NULL;
    
    RETURN calculated_duration;
END;
$$ LANGUAGE plpgsql;

-- Calculate bounce rate for a campaign and date range
CREATE OR REPLACE FUNCTION calculate_bounce_rate(
    campaign_id_param UUID, 
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS DECIMAL AS $$
DECLARE
    total_sessions INTEGER;
    bounce_sessions INTEGER;
    bounce_rate DECIMAL(5,2);
BEGIN
    -- Count total sessions
    SELECT COUNT(*) INTO total_sessions
    FROM public.user_sessions_analytics
    WHERE campaign_id = campaign_id_param
    AND DATE(session_start) BETWEEN start_date AND end_date;
    
    IF total_sessions = 0 THEN
        RETURN 0.00;
    END IF;
    
    -- Count bounce sessions (single page view, short duration)
    SELECT COUNT(*) INTO bounce_sessions
    FROM public.user_sessions_analytics
    WHERE campaign_id = campaign_id_param
    AND DATE(session_start) BETWEEN start_date AND end_date
    AND is_bounce = true;
    
    -- Calculate bounce rate as percentage
    bounce_rate := (bounce_sessions::DECIMAL / total_sessions::DECIMAL) * 100;
    
    RETURN ROUND(bounce_rate, 2);
END;
$$ LANGUAGE plpgsql;

-- Calculate conversion metrics for a campaign
CREATE OR REPLACE FUNCTION calculate_conversion_metrics(
    campaign_id_param UUID,
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB AS $$
DECLARE
    total_sessions INTEGER;
    converted_sessions INTEGER;
    total_visitors INTEGER;
    converted_visitors INTEGER;
    conversion_rate_sessions DECIMAL(5,2);
    conversion_rate_visitors DECIMAL(5,2);
    total_conversion_value DECIMAL(20,8);
    avg_conversion_value DECIMAL(20,8);
    result JSONB;
BEGIN
    -- Count total and converted sessions
    SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE contributed = true) as converted,
        SUM(contribution_amount) FILTER (WHERE contributed = true) as total_value
    INTO total_sessions, converted_sessions, total_conversion_value
    FROM public.user_sessions_analytics
    WHERE campaign_id = campaign_id_param
    AND DATE(session_start) BETWEEN start_date AND end_date;
    
    -- Count unique visitors (total and converted)
    SELECT 
        COUNT(DISTINCT visitor_id) as total,
        COUNT(DISTINCT visitor_id) FILTER (WHERE contributed = true) as converted
    INTO total_visitors, converted_visitors
    FROM public.user_sessions_analytics
    WHERE campaign_id = campaign_id_param
    AND DATE(session_start) BETWEEN start_date AND end_date;
    
    -- Calculate conversion rates
    conversion_rate_sessions := CASE 
        WHEN total_sessions > 0 THEN (converted_sessions::DECIMAL / total_sessions::DECIMAL) * 100 
        ELSE 0.00 
    END;
    
    conversion_rate_visitors := CASE 
        WHEN total_visitors > 0 THEN (converted_visitors::DECIMAL / total_visitors::DECIMAL) * 100 
        ELSE 0.00 
    END;
    
    -- Calculate average conversion value
    avg_conversion_value := CASE 
        WHEN converted_sessions > 0 THEN total_conversion_value / converted_sessions 
        ELSE 0.00 
    END;
    
    -- Build result JSON
    result := jsonb_build_object(
        'total_sessions', total_sessions,
        'converted_sessions', converted_sessions,
        'total_visitors', total_visitors,
        'converted_visitors', converted_visitors,
        'conversion_rate_sessions', ROUND(conversion_rate_sessions, 2),
        'conversion_rate_visitors', ROUND(conversion_rate_visitors, 2),
        'total_conversion_value', COALESCE(total_conversion_value, 0),
        'avg_conversion_value', ROUND(avg_conversion_value, 4),
        'period_start', start_date,
        'period_end', end_date,
        'calculated_at', NOW()
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Generate traffic source performance summary
CREATE OR REPLACE FUNCTION get_traffic_source_performance(
    campaign_id_param UUID,
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    source VARCHAR(100),
    medium VARCHAR(50),
    sessions INTEGER,
    visitors INTEGER,
    page_views INTEGER,
    bounce_rate DECIMAL(5,2),
    avg_duration INTEGER,
    conversion_rate DECIMAL(5,2),
    conversions INTEGER,
    revenue DECIMAL(20,8),
    cost_per_conversion DECIMAL(20,8)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        usa.traffic_source as source,
        usa.traffic_medium as medium,
        COUNT(*)::INTEGER as sessions,
        COUNT(DISTINCT usa.visitor_id)::INTEGER as visitors,
        SUM(usa.page_count)::INTEGER as page_views,
        ROUND(AVG(CASE WHEN usa.is_bounce THEN 100.0 ELSE 0.0 END), 2) as bounce_rate,
        ROUND(AVG(usa.duration_seconds))::INTEGER as avg_duration,
        ROUND(
            (COUNT(*) FILTER (WHERE usa.contributed = true)::DECIMAL / COUNT(*)::DECIMAL) * 100, 
            2
        ) as conversion_rate,
        COUNT(*) FILTER (WHERE usa.contributed = true)::INTEGER as conversions,
        COALESCE(SUM(usa.contribution_amount) FILTER (WHERE usa.contributed = true), 0) as revenue,
        CASE 
            WHEN COUNT(*) FILTER (WHERE usa.contributed = true) > 0 
            THEN COALESCE(SUM(usa.contribution_amount) FILTER (WHERE usa.contributed = true), 0) / COUNT(*) FILTER (WHERE usa.contributed = true)
            ELSE 0 
        END as cost_per_conversion
    FROM public.user_sessions_analytics usa
    WHERE usa.campaign_id = campaign_id_param
    AND DATE(usa.session_start) BETWEEN start_date AND end_date
    AND usa.traffic_source IS NOT NULL
    GROUP BY usa.traffic_source, usa.traffic_medium
    ORDER BY revenue DESC, sessions DESC;
END;
$$ LANGUAGE plpgsql;

-- Calculate time-based analytics (hourly breakdown)
CREATE OR REPLACE FUNCTION get_hourly_analytics(
    campaign_id_param UUID,
    analysis_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    hour_of_day INTEGER,
    sessions INTEGER,
    visitors INTEGER,
    page_views INTEGER,
    conversions INTEGER,
    revenue DECIMAL(20,8)
) AS $$
BEGIN
    RETURN QUERY
    WITH hourly_stats AS (
        SELECT 
            EXTRACT(HOUR FROM session_start)::INTEGER as hour_of_day,
            COUNT(*) as sessions,
            COUNT(DISTINCT visitor_id) as visitors,
            SUM(page_count) as page_views,
            COUNT(*) FILTER (WHERE contributed = true) as conversions,
            COALESCE(SUM(contribution_amount) FILTER (WHERE contributed = true), 0) as revenue
        FROM public.user_sessions_analytics
        WHERE campaign_id = campaign_id_param
        AND DATE(session_start) = analysis_date
        GROUP BY EXTRACT(HOUR FROM session_start)
    ),
    all_hours AS (
        SELECT generate_series(0, 23) as hour_of_day
    )
    SELECT 
        ah.hour_of_day,
        COALESCE(hs.sessions, 0)::INTEGER,
        COALESCE(hs.visitors, 0)::INTEGER,
        COALESCE(hs.page_views, 0)::INTEGER,
        COALESCE(hs.conversions, 0)::INTEGER,
        COALESCE(hs.revenue, 0)
    FROM all_hours ah
    LEFT JOIN hourly_stats hs ON ah.hour_of_day = hs.hour_of_day
    ORDER BY ah.hour_of_day;
END;
$$ LANGUAGE plpgsql;