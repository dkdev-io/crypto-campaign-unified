-- Create tables for website style matching system
-- Migration: 20250826_add_website_style_tables.sql

BEGIN;

-- Create website analyses table for storing analysis results
CREATE TABLE IF NOT EXISTS website_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url TEXT NOT NULL,
    url_hash VARCHAR(32) NOT NULL, -- MD5 hash of URL for quick lookups
    analysis_data JSONB, -- Store full analysis result
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    error_stack TEXT,
    client_ip INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes
    UNIQUE(url_hash, created_at) -- Allow same URL to be analyzed multiple times
);

-- Create campaign style logs table
CREATE TABLE IF NOT EXISTS campaign_style_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- 'styles_applied', 'styles_updated', etc.
    styles_data JSONB,
    source_url TEXT,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add website style columns to campaigns table if they don't exist
DO $$
BEGIN
    -- Website analysis URL
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campaigns' AND column_name = 'website_analyzed'
    ) THEN
        ALTER TABLE campaigns ADD COLUMN website_analyzed TEXT;
    END IF;
    
    -- Style analysis data
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campaigns' AND column_name = 'style_analysis'
    ) THEN
        ALTER TABLE campaigns ADD COLUMN style_analysis JSONB;
    END IF;
    
    -- Applied styles data
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campaigns' AND column_name = 'applied_styles'
    ) THEN
        ALTER TABLE campaigns ADD COLUMN applied_styles JSONB;
    END IF;
    
    -- Styles applied flag
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campaigns' AND column_name = 'styles_applied'
    ) THEN
        ALTER TABLE campaigns ADD COLUMN styles_applied BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Styles applied timestamp
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campaigns' AND column_name = 'styles_applied_at'
    ) THEN
        ALTER TABLE campaigns ADD COLUMN styles_applied_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Style source for tracking
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campaigns' AND column_name = 'style_source'
    ) THEN
        ALTER TABLE campaigns ADD COLUMN style_source TEXT;
    END IF;
    
    -- Custom styles (enhanced version of existing theme_color)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campaigns' AND column_name = 'custom_styles'
    ) THEN
        ALTER TABLE campaigns ADD COLUMN custom_styles JSONB;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_website_analyses_url_hash ON website_analyses(url_hash);
CREATE INDEX IF NOT EXISTS idx_website_analyses_created_at ON website_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_website_analyses_success ON website_analyses(success);

CREATE INDEX IF NOT EXISTS idx_campaign_style_logs_campaign_id ON campaign_style_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_style_logs_event_type ON campaign_style_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_campaign_style_logs_applied_at ON campaign_style_logs(applied_at DESC);

CREATE INDEX IF NOT EXISTS idx_campaigns_styles_applied ON campaigns(styles_applied);
CREATE INDEX IF NOT EXISTS idx_campaigns_styles_applied_at ON campaigns(styles_applied_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaigns_website_analyzed ON campaigns(website_analyzed);

-- Create function to get website analysis statistics
CREATE OR REPLACE FUNCTION get_website_analysis_stats(
    timeframe TEXT DEFAULT '24h'
)
RETURNS TABLE(
    total_analyses BIGINT,
    successful_analyses BIGINT,
    failed_analyses BIGINT,
    success_rate NUMERIC,
    unique_urls BIGINT
) AS $$
DECLARE
    time_condition TEXT;
BEGIN
    -- Build time condition based on timeframe
    time_condition := CASE
        WHEN timeframe LIKE '%h' THEN 
            'created_at > NOW() - INTERVAL ''' || REPLACE(timeframe, 'h', ' hours') || ''''
        WHEN timeframe LIKE '%d' THEN 
            'created_at > NOW() - INTERVAL ''' || REPLACE(timeframe, 'd', ' days') || ''''
        ELSE 
            'created_at > NOW() - INTERVAL ''24 hours'''
    END;

    RETURN QUERY EXECUTE format('
        WITH analysis_stats AS (
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE success = true) as successful,
                COUNT(*) FILTER (WHERE success = false) as failed,
                COUNT(DISTINCT url_hash) as unique_domains
            FROM website_analyses
            WHERE %s
        )
        SELECT 
            total::BIGINT,
            successful::BIGINT,
            failed::BIGINT,
            CASE 
                WHEN total > 0 THEN ROUND((successful::NUMERIC / total::NUMERIC) * 100, 2)
                ELSE 0
            END as success_rate,
            unique_domains::BIGINT
        FROM analysis_stats
    ', time_condition);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to clean up old website analyses
CREATE OR REPLACE FUNCTION cleanup_old_website_analyses()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete analyses older than 30 days
    DELETE FROM website_analyses 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Also clean up old style logs (keep 90 days)
    DELETE FROM campaign_style_logs 
    WHERE applied_at < NOW() - INTERVAL '90 days';
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to apply styles to campaign
CREATE OR REPLACE FUNCTION apply_website_styles(
    p_campaign_id UUID,
    p_styles JSONB,
    p_source_url TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    style_colors JSONB;
    primary_color TEXT;
BEGIN
    -- Extract primary color from styles
    style_colors := p_styles->'colors';
    primary_color := style_colors->>'primary';
    
    -- Update campaign with new styles
    UPDATE campaigns SET
        custom_styles = p_styles,
        applied_styles = p_styles,
        styles_applied = true,
        styles_applied_at = NOW(),
        style_source = p_source_url,
        -- Update theme_color to match primary color
        theme_color = COALESCE(primary_color, theme_color),
        updated_at = NOW()
    WHERE id = p_campaign_id;
    
    -- Log the style application
    INSERT INTO campaign_style_logs (campaign_id, event_type, styles_data, source_url)
    VALUES (p_campaign_id, 'styles_applied', p_styles, p_source_url);
    
    RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail completely
    INSERT INTO campaign_style_logs (campaign_id, event_type, styles_data, source_url)
    VALUES (p_campaign_id, 'styles_apply_error', 
            jsonb_build_object('error', SQLERRM), p_source_url);
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RLS policies for security

-- Website analyses - public read for caching, but limit personal data
ALTER TABLE website_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY website_analyses_read_policy ON website_analyses
    FOR SELECT 
    USING (true); -- Allow reading for caching purposes

CREATE POLICY website_analyses_insert_policy ON website_analyses
    FOR INSERT 
    WITH CHECK (true); -- Allow anyone to insert analyses

-- Campaign style logs - only accessible by campaign owners
ALTER TABLE campaign_style_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY campaign_style_logs_policy ON campaign_style_logs
    FOR ALL 
    USING (
        campaign_id IN (
            SELECT id FROM campaigns 
            WHERE user_id = auth.uid()
        )
    );

-- Grant necessary permissions
GRANT SELECT, INSERT ON website_analyses TO authenticated, anon;
GRANT SELECT, INSERT ON campaign_style_logs TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_website_analysis_stats(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION cleanup_old_website_analyses() TO authenticated;
GRANT EXECUTE ON FUNCTION apply_website_styles(UUID, JSONB, TEXT) TO authenticated;

-- Create trigger to automatically clean up old analyses periodically
CREATE OR REPLACE FUNCTION auto_cleanup_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Random chance (1%) to run cleanup on insert
    IF random() < 0.01 THEN
        PERFORM cleanup_old_website_analyses();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Only create trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'auto_cleanup_website_analyses'
    ) THEN
        CREATE TRIGGER auto_cleanup_website_analyses
            AFTER INSERT ON website_analyses
            FOR EACH ROW
            EXECUTE FUNCTION auto_cleanup_trigger();
    END IF;
END $$;

-- Insert some initial data for testing (remove in production)
DO $$
BEGIN
    -- Only insert if no analyses exist yet
    IF NOT EXISTS (SELECT 1 FROM website_analyses LIMIT 1) THEN
        INSERT INTO website_analyses (url, url_hash, analysis_data, success) 
        VALUES (
            'https://example.com',
            md5('https://example.com'),
            jsonb_build_object(
                'colors', jsonb_build_object(
                    'primary', '#2a2a72',
                    'secondary', '#666666',
                    'palette', jsonb_build_array(
                        jsonb_build_object('hex', '#2a2a72', 'name', 'Primary'),
                        jsonb_build_object('hex', '#666666', 'name', 'Secondary')
                    )
                ),
                'fonts', jsonb_build_object(
                    'primary', 'Inter',
                    'recommendations', jsonb_build_object(
                        'heading', jsonb_build_object('family', 'Inter', 'weight', '600'),
                        'body', jsonb_build_object('family', 'Inter', 'weight', '400')
                    )
                ),
                'confidence', 85,
                'timestamp', NOW()
            ),
            true
        );
    END IF;
END $$;

COMMIT;