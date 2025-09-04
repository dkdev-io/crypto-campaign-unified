-- Add style-related columns to campaigns table
-- These columns will store website analysis and manual style data

ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS website_analyzed TEXT,
ADD COLUMN IF NOT EXISTS style_analysis JSONB,
ADD COLUMN IF NOT EXISTS applied_styles JSONB,
ADD COLUMN IF NOT EXISTS styles_applied BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS style_method TEXT, -- 'manual', 'import', 'skipped'
ADD COLUMN IF NOT EXISTS styles_applied_at TIMESTAMPTZ;

-- Create website_analyses table for caching analysis results
CREATE TABLE IF NOT EXISTS website_analyses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    url TEXT NOT NULL,
    url_hash TEXT UNIQUE NOT NULL,
    analysis_data JSONB NOT NULL,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    error_stack TEXT,
    client_ip TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create campaign_style_logs table for tracking style changes
CREATE TABLE IF NOT EXISTS campaign_style_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'styles_applied', 'manual_entry', 'website_import'
    styles_data JSONB NOT NULL,
    source_url TEXT,
    applied_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_website_analyses_url_hash ON website_analyses(url_hash);
CREATE INDEX IF NOT EXISTS idx_website_analyses_created_at ON website_analyses(created_at);
CREATE INDEX IF NOT EXISTS idx_campaign_style_logs_campaign_id ON campaign_style_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_styles_applied ON campaigns(styles_applied);

-- Enable RLS for new tables
ALTER TABLE website_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_style_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for website_analyses (allow all for now, can be restricted later)
CREATE POLICY "Anyone can view website analyses" ON website_analyses
    FOR SELECT USING (true);
CREATE POLICY "Anyone can insert website analyses" ON website_analyses
    FOR INSERT WITH CHECK (true);

-- RLS policies for campaign_style_logs
CREATE POLICY "Users can view own campaign style logs" ON campaign_style_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM campaigns 
            WHERE campaigns.id = campaign_style_logs.campaign_id 
            AND campaigns.user_id = auth.uid()
        )
    );
CREATE POLICY "Users can insert own campaign style logs" ON campaign_style_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM campaigns 
            WHERE campaigns.id = campaign_style_logs.campaign_id 
            AND campaigns.user_id = auth.uid()
        )
    );

COMMENT ON TABLE website_analyses IS 'Cached website style analysis results';
COMMENT ON TABLE campaign_style_logs IS 'Audit log of style changes to campaigns';
COMMENT ON COLUMN campaigns.website_analyzed IS 'URL that was analyzed for styles';
COMMENT ON COLUMN campaigns.style_analysis IS 'Raw website analysis data from Puppeteer';
COMMENT ON COLUMN campaigns.applied_styles IS 'Final styles applied to the campaign form';
COMMENT ON COLUMN campaigns.style_method IS 'How styles were obtained: manual, import, or skipped';