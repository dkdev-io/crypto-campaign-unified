-- Analytics RLS Policies and Real-time Aggregation
-- Created: 2025-08-26
-- Description: Row Level Security policies for analytics privacy and real-time aggregation functions

-- =====================================================================================
-- ROW LEVEL SECURITY POLICIES FOR ANALYTICS PRIVACY
-- Ensure users can only see analytics for campaigns they have access to
-- =====================================================================================

-- Enable RLS on analytics tables
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traffic_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions_analytics ENABLE ROW LEVEL SECURITY;

-- Page Views RLS Policies
CREATE POLICY "page_views_campaign_access" ON public.page_views
    FOR SELECT
    USING (
        -- Use the existing campaign access validation function
        validate_campaign_access(auth.uid()::UUID, campaign_id, 'analytics_only', true)
    );

CREATE POLICY "page_views_insert_tracking" ON public.page_views
    FOR INSERT
    WITH CHECK (
        -- Allow inserts for campaigns the user has access to (for tracking scripts)
        validate_campaign_access(auth.uid()::UUID, campaign_id, 'read_only', false)
        OR
        -- Allow system/service inserts (when auth.uid() is null for tracking scripts)
        auth.uid() IS NULL
    );

CREATE POLICY "page_views_update_admin" ON public.page_views
    FOR UPDATE
    USING (
        validate_campaign_access(auth.uid()::UUID, campaign_id, 'admin', true)
    );

-- Traffic Sources RLS Policies
CREATE POLICY "traffic_sources_campaign_access" ON public.traffic_sources
    FOR SELECT
    USING (
        validate_campaign_access(auth.uid()::UUID, campaign_id, 'analytics_only', true)
    );

CREATE POLICY "traffic_sources_admin_manage" ON public.traffic_sources
    FOR ALL
    USING (
        validate_campaign_access(auth.uid()::UUID, campaign_id, 'admin', true)
    )
    WITH CHECK (
        validate_campaign_access(auth.uid()::UUID, campaign_id, 'admin', true)
    );

-- User Sessions Analytics RLS Policies
CREATE POLICY "sessions_analytics_campaign_access" ON public.user_sessions_analytics
    FOR SELECT
    USING (
        validate_campaign_access(auth.uid()::UUID, campaign_id, 'analytics_only', true)
    );

CREATE POLICY "sessions_analytics_insert_tracking" ON public.user_sessions_analytics
    FOR INSERT
    WITH CHECK (
        -- Allow inserts for campaigns the user has access to
        validate_campaign_access(auth.uid()::UUID, campaign_id, 'read_only', false)
        OR
        -- Allow system/service inserts
        auth.uid() IS NULL
    );

CREATE POLICY "sessions_analytics_update_system" ON public.user_sessions_analytics
    FOR UPDATE
    USING (
        validate_campaign_access(auth.uid()::UUID, campaign_id, 'read_only', false)
        OR
        auth.uid() IS NULL -- Allow system updates
    );

-- =====================================================================================
-- REAL-TIME ANALYTICS AGGREGATION FUNCTIONS
-- Functions to maintain real-time analytics summaries
-- =====================================================================================

-- Create analytics summary tables for real-time data
CREATE TABLE IF NOT EXISTS public.campaign_analytics_summary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    
    -- Time period
    date_recorded DATE NOT NULL DEFAULT CURRENT_DATE,
    hour_recorded INTEGER CHECK (hour_recorded BETWEEN 0 AND 23),
    
    -- Traffic metrics
    total_sessions INTEGER DEFAULT 0,
    total_visitors INTEGER DEFAULT 0,
    total_page_views INTEGER DEFAULT 0,
    unique_page_views INTEGER DEFAULT 0,
    
    -- Engagement metrics
    avg_session_duration INTEGER DEFAULT 0,
    bounce_rate DECIMAL(5,2) DEFAULT 0,
    pages_per_session DECIMAL(5,2) DEFAULT 0,
    
    -- Conversion metrics
    total_conversions INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,2) DEFAULT 0,
    total_revenue DECIMAL(20,8) DEFAULT 0,
    avg_conversion_value DECIMAL(20,8) DEFAULT 0,
    
    -- Traffic sources (top 3)
    top_source_1 VARCHAR(100),
    top_source_1_sessions INTEGER DEFAULT 0,
    top_source_2 VARCHAR(100),
    top_source_2_sessions INTEGER DEFAULT 0,
    top_source_3 VARCHAR(100),
    top_source_3_sessions INTEGER DEFAULT 0,
    
    -- Geographic data (top countries)
    top_country_1 VARCHAR(2),
    top_country_1_sessions INTEGER DEFAULT 0,
    top_country_2 VARCHAR(2),
    top_country_2_sessions INTEGER DEFAULT 0,
    top_country_3 VARCHAR(2),
    top_country_3_sessions INTEGER DEFAULT 0,
    
    -- Device breakdown
    desktop_sessions INTEGER DEFAULT 0,
    mobile_sessions INTEGER DEFAULT 0,
    tablet_sessions INTEGER DEFAULT 0,
    
    -- Quality metrics
    avg_quality_score DECIMAL(5,2) DEFAULT 0,
    spam_sessions INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint for time periods
    UNIQUE(campaign_id, date_recorded, COALESCE(hour_recorded, -1))
);

-- Indexes for analytics summary
CREATE INDEX idx_analytics_summary_campaign_date ON public.campaign_analytics_summary(campaign_id, date_recorded);
CREATE INDEX idx_analytics_summary_hour ON public.campaign_analytics_summary(campaign_id, date_recorded, hour_recorded);

-- Enable RLS on summary table
ALTER TABLE public.campaign_analytics_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "analytics_summary_campaign_access" ON public.campaign_analytics_summary
    FOR SELECT
    USING (
        validate_campaign_access(auth.uid()::UUID, campaign_id, 'analytics_only', true)
    );

-- Real-time analytics aggregation function
CREATE OR REPLACE FUNCTION update_analytics_summary(
    campaign_id_param UUID,
    date_param DATE DEFAULT CURRENT_DATE,
    hour_param INTEGER DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    session_stats RECORD;
    traffic_sources RECORD;
    geo_stats RECORD;
    device_stats RECORD;
    quality_stats RECORD;
    summary_result JSONB;
BEGIN
    -- Calculate session statistics
    SELECT 
        COUNT(*) as total_sessions,
        COUNT(DISTINCT visitor_id) as total_visitors,
        SUM(page_count) as total_page_views,
        AVG(duration_seconds)::INTEGER as avg_duration,
        AVG(CASE WHEN is_bounce THEN 100.0 ELSE 0.0 END) as bounce_rate,
        AVG(page_count) as pages_per_session,
        COUNT(*) FILTER (WHERE contributed = true) as conversions,
        COALESCE(SUM(contribution_amount) FILTER (WHERE contributed = true), 0) as revenue
    INTO session_stats
    FROM public.user_sessions_analytics
    WHERE campaign_id = campaign_id_param
    AND DATE(session_start) = date_param
    AND (hour_param IS NULL OR EXTRACT(HOUR FROM session_start) = hour_param);
    
    -- Get top traffic sources
    SELECT 
        array_agg(traffic_source ORDER BY session_count DESC) as sources,
        array_agg(session_count ORDER BY session_count DESC) as counts
    INTO traffic_sources
    FROM (
        SELECT traffic_source, COUNT(*) as session_count
        FROM public.user_sessions_analytics
        WHERE campaign_id = campaign_id_param
        AND DATE(session_start) = date_param
        AND (hour_param IS NULL OR EXTRACT(HOUR FROM session_start) = hour_param)
        AND traffic_source IS NOT NULL
        GROUP BY traffic_source
        ORDER BY session_count DESC
        LIMIT 3
    ) top_sources;
    
    -- Get geographic breakdown
    SELECT 
        array_agg(country ORDER BY session_count DESC) as countries,
        array_agg(session_count ORDER BY session_count DESC) as counts
    INTO geo_stats
    FROM (
        SELECT country, COUNT(*) as session_count
        FROM public.user_sessions_analytics
        WHERE campaign_id = campaign_id_param
        AND DATE(session_start) = date_param
        AND (hour_param IS NULL OR EXTRACT(HOUR FROM session_start) = hour_param)
        AND country IS NOT NULL
        GROUP BY country
        ORDER BY session_count DESC
        LIMIT 3
    ) top_countries;
    
    -- Get device breakdown
    SELECT 
        COUNT(*) FILTER (WHERE device_type = 'desktop') as desktop,
        COUNT(*) FILTER (WHERE device_type = 'mobile') as mobile,
        COUNT(*) FILTER (WHERE device_type = 'tablet') as tablet
    INTO device_stats
    FROM public.user_sessions_analytics
    WHERE campaign_id = campaign_id_param
    AND DATE(session_start) = date_param
    AND (hour_param IS NULL OR EXTRACT(HOUR FROM session_start) = hour_param);
    
    -- Get quality metrics
    SELECT 
        AVG(quality_score) as avg_quality,
        COUNT(*) FILTER (WHERE spam_score > 70) as spam_count
    INTO quality_stats
    FROM public.user_sessions_analytics
    WHERE campaign_id = campaign_id_param
    AND DATE(session_start) = date_param
    AND (hour_param IS NULL OR EXTRACT(HOUR FROM session_start) = hour_param);
    
    -- Insert or update summary record
    INSERT INTO public.campaign_analytics_summary (
        campaign_id, date_recorded, hour_recorded,
        total_sessions, total_visitors, total_page_views,
        avg_session_duration, bounce_rate, pages_per_session,
        total_conversions, conversion_rate, total_revenue,
        avg_conversion_value,
        top_source_1, top_source_1_sessions,
        top_source_2, top_source_2_sessions,
        top_source_3, top_source_3_sessions,
        top_country_1, top_country_1_sessions,
        top_country_2, top_country_2_sessions,
        top_country_3, top_country_3_sessions,
        desktop_sessions, mobile_sessions, tablet_sessions,
        avg_quality_score, spam_sessions
    ) VALUES (
        campaign_id_param, date_param, hour_param,
        session_stats.total_sessions, session_stats.total_visitors, session_stats.total_page_views,
        session_stats.avg_duration, ROUND(session_stats.bounce_rate, 2), ROUND(session_stats.pages_per_session, 2),
        session_stats.conversions,
        CASE WHEN session_stats.total_sessions > 0 THEN ROUND((session_stats.conversions::DECIMAL / session_stats.total_sessions::DECIMAL) * 100, 2) ELSE 0 END,
        session_stats.revenue,
        CASE WHEN session_stats.conversions > 0 THEN ROUND(session_stats.revenue / session_stats.conversions, 4) ELSE 0 END,
        traffic_sources.sources[1], traffic_sources.counts[1],
        traffic_sources.sources[2], traffic_sources.counts[2],
        traffic_sources.sources[3], traffic_sources.counts[3],
        geo_stats.countries[1], geo_stats.counts[1],
        geo_stats.countries[2], geo_stats.counts[2],
        geo_stats.countries[3], geo_stats.counts[3],
        device_stats.desktop, device_stats.mobile, device_stats.tablet,
        ROUND(quality_stats.avg_quality, 2), quality_stats.spam_count
    )
    ON CONFLICT (campaign_id, date_recorded, COALESCE(hour_recorded, -1))
    DO UPDATE SET
        total_sessions = EXCLUDED.total_sessions,
        total_visitors = EXCLUDED.total_visitors,
        total_page_views = EXCLUDED.total_page_views,
        avg_session_duration = EXCLUDED.avg_session_duration,
        bounce_rate = EXCLUDED.bounce_rate,
        pages_per_session = EXCLUDED.pages_per_session,
        total_conversions = EXCLUDED.total_conversions,
        conversion_rate = EXCLUDED.conversion_rate,
        total_revenue = EXCLUDED.total_revenue,
        avg_conversion_value = EXCLUDED.avg_conversion_value,
        top_source_1 = EXCLUDED.top_source_1,
        top_source_1_sessions = EXCLUDED.top_source_1_sessions,
        top_source_2 = EXCLUDED.top_source_2,
        top_source_2_sessions = EXCLUDED.top_source_2_sessions,
        top_source_3 = EXCLUDED.top_source_3,
        top_source_3_sessions = EXCLUDED.top_source_3_sessions,
        top_country_1 = EXCLUDED.top_country_1,
        top_country_1_sessions = EXCLUDED.top_country_1_sessions,
        top_country_2 = EXCLUDED.top_country_2,
        top_country_2_sessions = EXCLUDED.top_country_2_sessions,
        top_country_3 = EXCLUDED.top_country_3,
        top_country_3_sessions = EXCLUDED.top_country_3_sessions,
        desktop_sessions = EXCLUDED.desktop_sessions,
        mobile_sessions = EXCLUDED.mobile_sessions,
        tablet_sessions = EXCLUDED.tablet_sessions,
        avg_quality_score = EXCLUDED.avg_quality_score,
        spam_sessions = EXCLUDED.spam_sessions,
        updated_at = NOW();
    
    -- Build result summary
    summary_result := jsonb_build_object(
        'campaign_id', campaign_id_param,
        'date', date_param,
        'hour', hour_param,
        'sessions', session_stats.total_sessions,
        'visitors', session_stats.total_visitors,
        'page_views', session_stats.total_page_views,
        'conversions', session_stats.conversions,
        'revenue', session_stats.revenue,
        'updated_at', NOW()
    );
    
    RETURN summary_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Batch update analytics summaries for a date range
CREATE OR REPLACE FUNCTION batch_update_analytics_summaries(
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '7 days',
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB AS $$
DECLARE
    current_date DATE;
    campaign_record RECORD;
    updated_count INTEGER := 0;
    results JSONB[];
BEGIN
    -- Loop through each date in the range
    FOR current_date IN SELECT generate_series(start_date, end_date, '1 day'::INTERVAL)::DATE
    LOOP
        -- Loop through each active campaign
        FOR campaign_record IN 
            SELECT id FROM public.campaigns WHERE is_active = true
        LOOP
            -- Update daily summary for this campaign and date
            PERFORM update_analytics_summary(campaign_record.id, current_date, NULL);
            updated_count := updated_count + 1;
        END LOOP;
    END LOOP;
    
    RETURN jsonb_build_object(
        'updated_summaries', updated_count,
        'date_range', jsonb_build_object('start', start_date, 'end', end_date),
        'processed_at', NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- VISITOR TRACKING AND SESSION MANAGEMENT
-- Functions to handle anonymous visitor tracking and session management
-- =====================================================================================

-- Create or update visitor session
CREATE OR REPLACE FUNCTION create_or_update_session(
    campaign_id_param UUID,
    visitor_id_param UUID,
    page_url_param TEXT,
    referrer_param TEXT DEFAULT NULL,
    user_agent_param TEXT DEFAULT NULL,
    ip_address_param INET DEFAULT NULL,
    utm_params JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    existing_session_id UUID;
    new_session_id UUID;
    is_new_session BOOLEAN := false;
    traffic_source VARCHAR(100);
    traffic_medium VARCHAR(50);
    device_type_detected VARCHAR(20);
BEGIN
    -- Look for existing active session (within last 30 minutes)
    SELECT session_id INTO existing_session_id
    FROM public.user_sessions_analytics
    WHERE campaign_id = campaign_id_param
    AND visitor_id = visitor_id_param
    AND session_start > NOW() - INTERVAL '30 minutes'
    ORDER BY session_start DESC
    LIMIT 1;
    
    -- Detect device type from user agent
    device_type_detected := CASE
        WHEN user_agent_param ~* '(mobile|android|iphone|ipad|tablet)' THEN 
            CASE WHEN user_agent_param ~* 'ipad|tablet' THEN 'tablet' ELSE 'mobile' END
        ELSE 'desktop'
    END;
    
    -- Determine traffic source and medium
    IF utm_params ? 'utm_source' THEN
        traffic_source := utm_params->>'utm_source';
        traffic_medium := COALESCE(utm_params->>'utm_medium', 'unknown');
    ELSIF referrer_param IS NOT NULL AND referrer_param != '' THEN
        -- Parse referrer to determine source
        traffic_source := CASE
            WHEN referrer_param ~* 'google' THEN 'google'
            WHEN referrer_param ~* 'facebook' THEN 'facebook'
            WHEN referrer_param ~* 'twitter' THEN 'twitter'
            WHEN referrer_param ~* 'linkedin' THEN 'linkedin'
            WHEN referrer_param ~* 'youtube' THEN 'youtube'
            ELSE 'referral'
        END;
        traffic_medium := 'referral';
    ELSE
        traffic_source := 'direct';
        traffic_medium := 'direct';
    END IF;
    
    IF existing_session_id IS NOT NULL THEN
        -- Update existing session
        UPDATE public.user_sessions_analytics
        SET 
            session_end = NOW(),
            page_count = page_count + 1,
            updated_at = NOW()
        WHERE session_id = existing_session_id;
        
        new_session_id := existing_session_id;
    ELSE
        -- Create new session
        new_session_id := uuid_generate_v4();
        is_new_session := true;
        
        -- Check if this is a new visitor (first time seeing this visitor_id)
        INSERT INTO public.user_sessions_analytics (
            campaign_id, visitor_id, session_id, session_start,
            page_count, traffic_source, traffic_medium,
            referrer, landing_page, user_agent, ip_address,
            device_type, is_new_visitor
        ) VALUES (
            campaign_id_param, visitor_id_param, new_session_id, NOW(),
            1, traffic_source, traffic_medium,
            referrer_param, page_url_param, user_agent_param, ip_address_param,
            device_type_detected,
            NOT EXISTS (
                SELECT 1 FROM public.user_sessions_analytics 
                WHERE visitor_id = visitor_id_param AND campaign_id = campaign_id_param
            )
        );
    END IF;
    
    -- Always create page view record
    INSERT INTO public.page_views (
        campaign_id, visitor_id, session_id, page_url,
        referrer, user_agent, ip_address, device_type,
        session_start, utm_source, utm_medium, utm_campaign, utm_content, utm_term
    ) VALUES (
        campaign_id_param, visitor_id_param, new_session_id, page_url_param,
        referrer_param, user_agent_param, ip_address_param, device_type_detected,
        NOW(),
        utm_params->>'utm_source',
        utm_params->>'utm_medium', 
        utm_params->>'utm_campaign',
        utm_params->>'utm_content',
        utm_params->>'utm_term'
    );
    
    RETURN new_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Record conversion event
CREATE OR REPLACE FUNCTION record_conversion(
    session_id_param UUID,
    contribution_amount_param DECIMAL(20,8),
    transaction_hash_param VARCHAR(66) DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    session_record RECORD;
    attribution_window_days INTEGER := 7;
    first_touch_session RECORD;
BEGIN
    -- Get current session details
    SELECT * INTO session_record
    FROM public.user_sessions_analytics
    WHERE session_id = session_id_param;
    
    IF session_record.id IS NULL THEN
        RETURN jsonb_build_object('error', 'session_not_found');
    END IF;
    
    -- Find first touch session for attribution (within 7 days)
    SELECT * INTO first_touch_session
    FROM public.user_sessions_analytics
    WHERE visitor_id = session_record.visitor_id
    AND campaign_id = session_record.campaign_id
    AND session_start >= NOW() - (attribution_window_days || ' days')::INTERVAL
    ORDER BY session_start ASC
    LIMIT 1;
    
    -- Update current session with conversion
    UPDATE public.user_sessions_analytics
    SET 
        contributed = true,
        contribution_amount = contribution_amount_param,
        contribution_transaction_hash = transaction_hash_param,
        conversion_timestamp = NOW(),
        days_to_conversion = EXTRACT(DAY FROM NOW() - session_start),
        attribution_source = first_touch_session.traffic_source,
        attribution_medium = first_touch_session.traffic_medium,
        attribution_campaign = first_touch_session.traffic_campaign,
        updated_at = NOW()
    WHERE session_id = session_id_param;
    
    -- Update traffic sources table with conversion
    INSERT INTO public.traffic_sources (
        campaign_id, source, medium, campaign_name, date_recorded,
        conversion_count, total_conversion_value
    ) VALUES (
        session_record.campaign_id,
        COALESCE(first_touch_session.traffic_source, session_record.traffic_source, 'unknown'),
        COALESCE(first_touch_session.traffic_medium, session_record.traffic_medium, 'unknown'),
        COALESCE(first_touch_session.traffic_campaign, session_record.traffic_campaign),
        CURRENT_DATE,
        1,
        contribution_amount_param
    )
    ON CONFLICT (campaign_id, source, medium, COALESCE(campaign_name, ''), date_recorded)
    DO UPDATE SET
        conversion_count = traffic_sources.conversion_count + 1,
        total_conversion_value = traffic_sources.total_conversion_value + contribution_amount_param,
        updated_at = NOW();
    
    -- Trigger real-time analytics update
    PERFORM update_analytics_summary(session_record.campaign_id, CURRENT_DATE);
    
    RETURN jsonb_build_object(
        'success', true,
        'session_id', session_id_param,
        'conversion_amount', contribution_amount_param,
        'attribution_source', first_touch_session.traffic_source,
        'days_to_conversion', EXTRACT(DAY FROM NOW() - session_record.session_start),
        'recorded_at', NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;