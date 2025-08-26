-- Analytics Testing and Validation
-- Created: 2025-08-26
-- Description: Comprehensive testing and validation for campaign analytics system

-- =====================================================================================
-- TEST DATA GENERATION
-- Generate realistic test data for analytics validation
-- =====================================================================================

-- Function to generate test analytics data
CREATE OR REPLACE FUNCTION generate_test_analytics_data(
    campaign_id_param UUID,
    days_back INTEGER DEFAULT 30,
    sessions_per_day INTEGER DEFAULT 100
)
RETURNS JSONB AS $$
DECLARE
    current_date DATE;
    session_count INTEGER;
    visitor_id UUID;
    session_id UUID;
    page_count INTEGER;
    conversion_probability DECIMAL;
    test_sources TEXT[] := ARRAY['google', 'facebook', 'twitter', 'direct', 'linkedin'];
    test_mediums TEXT[] := ARRAY['organic', 'cpc', 'social', 'direct', 'email'];
    test_countries TEXT[] := ARRAY['US', 'GB', 'CA', 'DE', 'FR', 'AU', 'JP'];
    test_devices TEXT[] := ARRAY['desktop', 'mobile', 'tablet'];
    generated_sessions INTEGER := 0;
    generated_page_views INTEGER := 0;
    generated_conversions INTEGER := 0;
BEGIN
    -- Loop through date range
    FOR current_date IN 
        SELECT generate_series(CURRENT_DATE - (days_back || ' days')::INTERVAL, CURRENT_DATE - INTERVAL '1 day', '1 day'::INTERVAL)::DATE
    LOOP
        -- Generate sessions for this date
        FOR session_count IN 1..sessions_per_day
        LOOP
            visitor_id := uuid_generate_v4();
            session_id := uuid_generate_v4();
            page_count := 1 + (random() * 10)::INTEGER; -- 1-10 pages per session
            conversion_probability := 0.02 + (random() * 0.08); -- 2-10% conversion rate
            
            -- Insert session record
            INSERT INTO public.user_sessions_analytics (
                campaign_id, visitor_id, session_id,
                session_start, session_end, duration_seconds,
                page_count, is_bounce, is_new_visitor,
                traffic_source, traffic_medium, landing_page,
                user_agent, ip_address, device_type, country,
                contributed, contribution_amount, quality_score
            ) VALUES (
                campaign_id_param, visitor_id, session_id,
                current_date + (random() * INTERVAL '24 hours'),
                current_date + (random() * INTERVAL '24 hours') + (30 + random() * 1800) * INTERVAL '1 second',
                (30 + random() * 1800)::INTEGER, -- 30 seconds to 30 minutes
                page_count,
                page_count = 1 AND random() < 0.4, -- 40% bounce rate for single page sessions
                random() < 0.3, -- 30% new visitors
                test_sources[1 + (random() * (array_length(test_sources, 1) - 1))::INTEGER],
                test_mediums[1 + (random() * (array_length(test_mediums, 1) - 1))::INTEGER],
                '/campaign/' || campaign_id_param,
                'Mozilla/5.0 (Test User Agent)',
                ('192.168.1.' || (1 + random() * 254)::INTEGER)::INET,
                test_devices[1 + (random() * (array_length(test_devices, 1) - 1))::INTEGER],
                test_countries[1 + (random() * (array_length(test_countries, 1) - 1))::INTEGER],
                random() < conversion_probability,
                CASE WHEN random() < conversion_probability THEN (0.01 + random() * 9.99)::DECIMAL(20,8) ELSE NULL END,
                (30 + random() * 70)::INTEGER -- Quality score 30-100
            );
            
            generated_sessions := generated_sessions + 1;
            IF random() < conversion_probability THEN
                generated_conversions := generated_conversions + 1;
            END IF;
            
            -- Generate page views for this session
            FOR i IN 1..page_count
            LOOP
                INSERT INTO public.page_views (
                    campaign_id, visitor_id, session_id,
                    page_url, referrer, user_agent, ip_address,
                    country, device_type, session_start,
                    duration_seconds, scroll_depth, clicks_count,
                    utm_source, utm_medium
                ) VALUES (
                    campaign_id_param, visitor_id, session_id,
                    '/page-' || i, 
                    CASE WHEN i = 1 THEN 'https://google.com' ELSE '/page-' || (i-1) END,
                    'Mozilla/5.0 (Test User Agent)',
                    ('192.168.1.' || (1 + random() * 254)::INTEGER)::INET,
                    test_countries[1 + (random() * (array_length(test_countries, 1) - 1))::INTEGER],
                    test_devices[1 + (random() * (array_length(test_devices, 1) - 1))::INTEGER],
                    current_date + (random() * INTERVAL '24 hours'),
                    (10 + random() * 300)::INTEGER, -- 10 seconds to 5 minutes per page
                    (20 + random() * 80)::DECIMAL(5,2), -- 20-100% scroll depth
                    (random() * 20)::INTEGER, -- 0-20 clicks per page
                    test_sources[1 + (random() * (array_length(test_sources, 1) - 1))::INTEGER],
                    test_mediums[1 + (random() * (array_length(test_mediums, 1) - 1))::INTEGER]
                );
                
                generated_page_views := generated_page_views + 1;
            END LOOP;
        END LOOP;
    END LOOP;
    
    RETURN jsonb_build_object(
        'generated_sessions', generated_sessions,
        'generated_page_views', generated_page_views,
        'generated_conversions', generated_conversions,
        'date_range_days', days_back,
        'campaign_id', campaign_id_param,
        'generated_at', NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- ANALYTICS VALIDATION QUERIES
-- Comprehensive queries to validate analytics data accuracy
-- =====================================================================================

-- Validate session duration calculations
CREATE OR REPLACE FUNCTION validate_session_durations(campaign_id_param UUID)
RETURNS TABLE (
    validation_test TEXT,
    total_sessions INTEGER,
    sessions_with_duration INTEGER,
    avg_calculated_duration DECIMAL,
    min_duration INTEGER,
    max_duration INTEGER,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'Session Duration Validation'::TEXT,
        COUNT(*)::INTEGER as total_sessions,
        COUNT(*) FILTER (WHERE duration_seconds IS NOT NULL)::INTEGER as sessions_with_duration,
        ROUND(AVG(duration_seconds), 2) as avg_calculated_duration,
        MIN(duration_seconds) as min_duration,
        MAX(duration_seconds) as max_duration,
        CASE 
            WHEN COUNT(*) FILTER (WHERE duration_seconds IS NOT NULL)::DECIMAL / COUNT(*)::DECIMAL > 0.8 
            THEN 'PASS' 
            ELSE 'FAIL' 
        END::TEXT as status
    FROM public.user_sessions_analytics
    WHERE campaign_id = campaign_id_param;
END;
$$ LANGUAGE plpgsql;

-- Validate bounce rate calculations
CREATE OR REPLACE FUNCTION validate_bounce_rates(campaign_id_param UUID)
RETURNS TABLE (
    validation_test TEXT,
    total_sessions INTEGER,
    bounce_sessions INTEGER,
    calculated_bounce_rate DECIMAL,
    function_bounce_rate DECIMAL,
    variance DECIMAL,
    status TEXT
) AS $$
DECLARE
    function_result DECIMAL;
BEGIN
    -- Get bounce rate from function
    SELECT calculate_bounce_rate(campaign_id_param) INTO function_result;
    
    RETURN QUERY
    SELECT 
        'Bounce Rate Validation'::TEXT,
        COUNT(*)::INTEGER as total_sessions,
        COUNT(*) FILTER (WHERE is_bounce = true)::INTEGER as bounce_sessions,
        ROUND(
            (COUNT(*) FILTER (WHERE is_bounce = true)::DECIMAL / COUNT(*)::DECIMAL) * 100, 
            2
        ) as calculated_bounce_rate,
        function_result as function_bounce_rate,
        ABS(
            ROUND((COUNT(*) FILTER (WHERE is_bounce = true)::DECIMAL / COUNT(*)::DECIMAL) * 100, 2) - 
            function_result
        ) as variance,
        CASE 
            WHEN ABS(
                ROUND((COUNT(*) FILTER (WHERE is_bounce = true)::DECIMAL / COUNT(*)::DECIMAL) * 100, 2) - 
                function_result
            ) < 1.0 THEN 'PASS' 
            ELSE 'FAIL' 
        END::TEXT as status
    FROM public.user_sessions_analytics
    WHERE campaign_id = campaign_id_param;
END;
$$ LANGUAGE plpgsql;

-- Validate conversion tracking
CREATE OR REPLACE FUNCTION validate_conversion_tracking(campaign_id_param UUID)
RETURNS TABLE (
    validation_test TEXT,
    total_sessions INTEGER,
    converted_sessions INTEGER,
    total_page_views INTEGER,
    converted_page_views INTEGER,
    revenue_sessions DECIMAL,
    revenue_contributions DECIMAL,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'Conversion Tracking Validation'::TEXT,
        (SELECT COUNT(*) FROM public.user_sessions_analytics WHERE campaign_id = campaign_id_param)::INTEGER,
        (SELECT COUNT(*) FROM public.user_sessions_analytics WHERE campaign_id = campaign_id_param AND contributed = true)::INTEGER,
        (SELECT COUNT(*) FROM public.page_views WHERE campaign_id = campaign_id_param)::INTEGER,
        (SELECT COUNT(*) FROM public.page_views WHERE campaign_id = campaign_id_param AND converted = true)::INTEGER,
        (SELECT COALESCE(SUM(contribution_amount), 0) FROM public.user_sessions_analytics WHERE campaign_id = campaign_id_param AND contributed = true),
        (SELECT COALESCE(SUM(amount), 0) FROM public.contributions WHERE campaign_id = campaign_id_param),
        CASE 
            WHEN ABS(
                (SELECT COALESCE(SUM(contribution_amount), 0) FROM public.user_sessions_analytics WHERE campaign_id = campaign_id_param AND contributed = true) -
                (SELECT COALESCE(SUM(amount), 0) FROM public.contributions WHERE campaign_id = campaign_id_param)
            ) < 0.01 THEN 'PASS'
            ELSE 'REVIEW'
        END::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Validate traffic source attribution
CREATE OR REPLACE FUNCTION validate_traffic_attribution(campaign_id_param UUID)
RETURNS TABLE (
    validation_test TEXT,
    total_sessions INTEGER,
    sessions_with_source INTEGER,
    unique_sources INTEGER,
    top_source TEXT,
    top_source_sessions INTEGER,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'Traffic Attribution Validation'::TEXT,
        COUNT(*)::INTEGER as total_sessions,
        COUNT(*) FILTER (WHERE traffic_source IS NOT NULL)::INTEGER as sessions_with_source,
        COUNT(DISTINCT traffic_source)::INTEGER as unique_sources,
        (SELECT traffic_source FROM public.user_sessions_analytics 
         WHERE campaign_id = campaign_id_param AND traffic_source IS NOT NULL
         GROUP BY traffic_source ORDER BY COUNT(*) DESC LIMIT 1)::TEXT as top_source,
        (SELECT COUNT(*) FROM public.user_sessions_analytics 
         WHERE campaign_id = campaign_id_param 
         AND traffic_source = (
             SELECT traffic_source FROM public.user_sessions_analytics 
             WHERE campaign_id = campaign_id_param AND traffic_source IS NOT NULL
             GROUP BY traffic_source ORDER BY COUNT(*) DESC LIMIT 1
         ))::INTEGER as top_source_sessions,
        CASE 
            WHEN COUNT(*) FILTER (WHERE traffic_source IS NOT NULL)::DECIMAL / COUNT(*)::DECIMAL > 0.7
            THEN 'PASS' 
            ELSE 'REVIEW' 
        END::TEXT as status
    FROM public.user_sessions_analytics
    WHERE campaign_id = campaign_id_param;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================================
-- PERFORMANCE TESTING
-- Test analytics query performance with large datasets
-- =====================================================================================

-- Test analytics query performance
CREATE OR REPLACE FUNCTION test_analytics_performance(campaign_id_param UUID)
RETURNS TABLE (
    test_name TEXT,
    query_type TEXT,
    execution_time_ms NUMERIC,
    rows_processed INTEGER,
    performance_rating TEXT
) AS $$
DECLARE
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    row_count INTEGER;
BEGIN
    -- Test 1: Daily summary query
    start_time := clock_timestamp();
    SELECT COUNT(*) INTO row_count FROM public.user_sessions_analytics 
    WHERE campaign_id = campaign_id_param 
    AND DATE(session_start) = CURRENT_DATE - INTERVAL '1 day';
    end_time := clock_timestamp();
    
    RETURN QUERY SELECT 
        'Daily Analytics Summary'::TEXT,
        'AGGREGATE'::TEXT,
        EXTRACT(milliseconds FROM end_time - start_time),
        row_count,
        CASE 
            WHEN EXTRACT(milliseconds FROM end_time - start_time) < 100 THEN 'EXCELLENT'
            WHEN EXTRACT(milliseconds FROM end_time - start_time) < 500 THEN 'GOOD'
            WHEN EXTRACT(milliseconds FROM end_time - start_time) < 1000 THEN 'ACCEPTABLE'
            ELSE 'SLOW'
        END::TEXT;
    
    -- Test 2: Traffic source breakdown
    start_time := clock_timestamp();
    SELECT COUNT(*) INTO row_count FROM get_traffic_source_performance(campaign_id_param);
    end_time := clock_timestamp();
    
    RETURN QUERY SELECT 
        'Traffic Source Performance'::TEXT,
        'COMPLEX_JOIN'::TEXT,
        EXTRACT(milliseconds FROM end_time - start_time),
        row_count,
        CASE 
            WHEN EXTRACT(milliseconds FROM end_time - start_time) < 200 THEN 'EXCELLENT'
            WHEN EXTRACT(milliseconds FROM end_time - start_time) < 1000 THEN 'GOOD'
            WHEN EXTRACT(milliseconds FROM end_time - start_time) < 2000 THEN 'ACCEPTABLE'
            ELSE 'SLOW'
        END::TEXT;
    
    -- Test 3: Conversion metrics calculation
    start_time := clock_timestamp();
    PERFORM calculate_conversion_metrics(campaign_id_param);
    end_time := clock_timestamp();
    
    RETURN QUERY SELECT 
        'Conversion Metrics Calculation'::TEXT,
        'FUNCTION'::TEXT,
        EXTRACT(milliseconds FROM end_time - start_time),
        1,
        CASE 
            WHEN EXTRACT(milliseconds FROM end_time - start_time) < 150 THEN 'EXCELLENT'
            WHEN EXTRACT(milliseconds FROM end_time - start_time) < 750 THEN 'GOOD'
            WHEN EXTRACT(milliseconds FROM end_time - start_time) < 1500 THEN 'ACCEPTABLE'
            ELSE 'SLOW'
        END::TEXT;
    
    -- Test 4: Real-time summary update
    start_time := clock_timestamp();
    PERFORM update_analytics_summary(campaign_id_param);
    end_time := clock_timestamp();
    
    RETURN QUERY SELECT 
        'Real-time Summary Update'::TEXT,
        'UPSERT'::TEXT,
        EXTRACT(milliseconds FROM end_time - start_time),
        1,
        CASE 
            WHEN EXTRACT(milliseconds FROM end_time - start_time) < 300 THEN 'EXCELLENT'
            WHEN EXTRACT(milliseconds FROM end_time - start_time) < 1500 THEN 'GOOD'
            WHEN EXTRACT(milliseconds FROM end_time - start_time) < 3000 THEN 'ACCEPTABLE'
            ELSE 'SLOW'
        END::TEXT;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================================
-- COMPREHENSIVE ANALYTICS TEST SUITE
-- Run all analytics tests and generate report
-- =====================================================================================

-- Run comprehensive analytics test suite
CREATE OR REPLACE FUNCTION run_analytics_test_suite(campaign_id_param UUID)
RETURNS JSONB AS $$
DECLARE
    test_campaign_exists BOOLEAN;
    test_data_result JSONB;
    duration_validation RECORD;
    bounce_validation RECORD;
    conversion_validation RECORD;
    traffic_validation RECORD;
    performance_results RECORD;
    overall_status TEXT := 'PASS';
    test_summary JSONB;
BEGIN
    -- Check if campaign exists
    SELECT EXISTS(SELECT 1 FROM public.campaigns WHERE id = campaign_id_param) INTO test_campaign_exists;
    
    IF NOT test_campaign_exists THEN
        RETURN jsonb_build_object(
            'error', 'campaign_not_found',
            'campaign_id', campaign_id_param
        );
    END IF;
    
    -- Generate test data
    SELECT generate_test_analytics_data(campaign_id_param, 7, 50) INTO test_data_result;
    
    -- Run validation tests
    SELECT * INTO duration_validation FROM validate_session_durations(campaign_id_param);
    SELECT * INTO bounce_validation FROM validate_bounce_rates(campaign_id_param);
    SELECT * INTO conversion_validation FROM validate_conversion_tracking(campaign_id_param);
    SELECT * INTO traffic_validation FROM validate_traffic_attribution(campaign_id_param);
    
    -- Check if any tests failed
    IF duration_validation.status = 'FAIL' OR bounce_validation.status = 'FAIL' OR 
       conversion_validation.status = 'FAIL' OR traffic_validation.status = 'FAIL' THEN
        overall_status := 'FAIL';
    ELSIF conversion_validation.status = 'REVIEW' OR traffic_validation.status = 'REVIEW' THEN
        overall_status := 'REVIEW';
    END IF;
    
    -- Run performance tests
    -- Note: In a real implementation, you'd collect all performance results
    
    -- Build comprehensive test report
    test_summary := jsonb_build_object(
        'campaign_id', campaign_id_param,
        'overall_status', overall_status,
        'test_data_generation', test_data_result,
        'validation_results', jsonb_build_object(
            'session_duration', jsonb_build_object(
                'status', duration_validation.status,
                'total_sessions', duration_validation.total_sessions,
                'sessions_with_duration', duration_validation.sessions_with_duration,
                'avg_duration', duration_validation.avg_calculated_duration
            ),
            'bounce_rate', jsonb_build_object(
                'status', bounce_validation.status,
                'calculated_rate', bounce_validation.calculated_bounce_rate,
                'function_rate', bounce_validation.function_bounce_rate,
                'variance', bounce_validation.variance
            ),
            'conversion_tracking', jsonb_build_object(
                'status', conversion_validation.status,
                'converted_sessions', conversion_validation.converted_sessions,
                'revenue_difference', ABS(conversion_validation.revenue_sessions - conversion_validation.revenue_contributions)
            ),
            'traffic_attribution', jsonb_build_object(
                'status', traffic_validation.status,
                'sessions_with_source', traffic_validation.sessions_with_source,
                'unique_sources', traffic_validation.unique_sources,
                'top_source', traffic_validation.top_source
            )
        ),
        'test_completed_at', NOW(),
        'recommendations', CASE 
            WHEN overall_status = 'FAIL' THEN jsonb_build_array(
                'Review failed validation tests',
                'Check data integrity',
                'Verify calculation functions'
            )
            WHEN overall_status = 'REVIEW' THEN jsonb_build_array(
                'Review flagged metrics',
                'Validate conversion tracking setup',
                'Check traffic source attribution'
            )
            ELSE jsonb_build_array(
                'Analytics system functioning correctly',
                'Consider performance optimization for large datasets'
            )
        END
    );
    
    -- Log test execution
    INSERT INTO public.access_audit_log (
        table_name, action_type, access_granted, additional_context
    ) VALUES (
        'analytics_testing', 'TEST_EXECUTION', true, test_summary
    );
    
    RETURN test_summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- ANALYTICS HEALTH MONITORING
-- Ongoing monitoring functions for analytics system health
-- =====================================================================================

-- Monitor analytics system health
CREATE OR REPLACE FUNCTION monitor_analytics_health()
RETURNS JSONB AS $$
DECLARE
    total_campaigns INTEGER;
    campaigns_with_data INTEGER;
    total_sessions_today INTEGER;
    total_conversions_today INTEGER;
    avg_session_duration INTEGER;
    system_health TEXT;
    health_score INTEGER;
    issues JSONB[] := ARRAY[]::JSONB[];
BEGIN
    -- Get basic metrics
    SELECT COUNT(*) INTO total_campaigns FROM public.campaigns WHERE is_active = true;
    
    SELECT COUNT(DISTINCT campaign_id) INTO campaigns_with_data 
    FROM public.user_sessions_analytics 
    WHERE DATE(session_start) = CURRENT_DATE;
    
    SELECT COUNT(*) INTO total_sessions_today 
    FROM public.user_sessions_analytics 
    WHERE DATE(session_start) = CURRENT_DATE;
    
    SELECT COUNT(*) INTO total_conversions_today 
    FROM public.user_sessions_analytics 
    WHERE DATE(session_start) = CURRENT_DATE AND contributed = true;
    
    SELECT AVG(duration_seconds)::INTEGER INTO avg_session_duration 
    FROM public.user_sessions_analytics 
    WHERE DATE(session_start) = CURRENT_DATE AND duration_seconds IS NOT NULL;
    
    -- Calculate health score
    health_score := 100;
    
    -- Check for issues
    IF campaigns_with_data::DECIMAL / NULLIF(total_campaigns, 0) < 0.5 THEN
        health_score := health_score - 20;
        issues := issues || jsonb_build_object('issue', 'Low campaign data coverage', 'severity', 'medium');
    END IF;
    
    IF total_sessions_today < 10 THEN
        health_score := health_score - 30;
        issues := issues || jsonb_build_object('issue', 'Very low session volume today', 'severity', 'high');
    END IF;
    
    IF avg_session_duration < 30 THEN
        health_score := health_score - 15;
        issues := issues || jsonb_build_object('issue', 'Low average session duration', 'severity', 'medium');
    END IF;
    
    -- Determine overall health
    system_health := CASE 
        WHEN health_score >= 90 THEN 'EXCELLENT'
        WHEN health_score >= 75 THEN 'GOOD'
        WHEN health_score >= 50 THEN 'FAIR'
        ELSE 'POOR'
    END;
    
    RETURN jsonb_build_object(
        'system_health', system_health,
        'health_score', health_score,
        'metrics', jsonb_build_object(
            'total_campaigns', total_campaigns,
            'campaigns_with_data_today', campaigns_with_data,
            'total_sessions_today', total_sessions_today,
            'total_conversions_today', total_conversions_today,
            'avg_session_duration', avg_session_duration
        ),
        'issues', issues,
        'checked_at', NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;