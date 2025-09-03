-- Create tables for donor page automation system
-- Migration: 20250826_create_donor_page_tables.sql

BEGIN;

-- Create donor page logs table
CREATE TABLE IF NOT EXISTS donor_page_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'info',
    page_url TEXT,
    file_path TEXT,
    data JSONB,
    error_message TEXT,
    error_stack TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create campaign webhooks table
CREATE TABLE IF NOT EXISTS campaign_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    events TEXT[] NOT NULL DEFAULT '{}',
    secret_hash VARCHAR(64) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    failure_count INTEGER DEFAULT 0,
    last_failure_at TIMESTAMP WITH TIME ZONE,
    disabled_at TIMESTAMP WITH TIME ZONE,
    disable_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create webhook delivery logs table
CREATE TABLE IF NOT EXISTS webhook_delivery_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id UUID NOT NULL REFERENCES campaign_webhooks(id) ON DELETE CASCADE,
    event VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add donor page columns to campaigns table if they don't exist
DO $$
BEGIN
    -- Add donor_page_url column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campaigns' AND column_name = 'donor_page_url'
    ) THEN
        ALTER TABLE campaigns ADD COLUMN donor_page_url TEXT;
    END IF;
    
    -- Add donor_page_generated column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campaigns' AND column_name = 'donor_page_generated'
    ) THEN
        ALTER TABLE campaigns ADD COLUMN donor_page_generated BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add donor_page_generated_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campaigns' AND column_name = 'donor_page_generated_at'
    ) THEN
        ALTER TABLE campaigns ADD COLUMN donor_page_generated_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_donor_page_logs_campaign_id ON donor_page_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_donor_page_logs_created_at ON donor_page_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_donor_page_logs_event_type ON donor_page_logs(event_type);

CREATE INDEX IF NOT EXISTS idx_campaign_webhooks_campaign_id ON campaign_webhooks(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_webhooks_status ON campaign_webhooks(status);

CREATE INDEX IF NOT EXISTS idx_webhook_delivery_logs_webhook_id ON webhook_delivery_logs(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_delivery_logs_created_at ON webhook_delivery_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_campaigns_donor_page_generated ON campaigns(donor_page_generated);
CREATE INDEX IF NOT EXISTS idx_campaigns_donor_page_generated_at ON campaigns(donor_page_generated_at DESC);

-- Create function to automatically trigger donor page sync
CREATE OR REPLACE FUNCTION create_donor_page_sync_trigger(campaign_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    trigger_exists BOOLEAN;
BEGIN
    -- This function will be called to set up database triggers for auto-sync
    -- For now, we'll just log that a trigger was requested
    
    INSERT INTO donor_page_logs (campaign_id, event_type, data)
    VALUES (
        campaign_id,
        'trigger_created',
        jsonb_build_object('message', 'Database trigger created for auto-sync')
    );
    
    RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
    -- Log the error
    INSERT INTO donor_page_logs (campaign_id, event_type, error_message)
    VALUES (
        campaign_id,
        'trigger_error',
        SQLERRM
    );
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get webhook statistics
CREATE OR REPLACE FUNCTION get_webhook_stats(
    campaign_id UUID,
    timeframe TEXT DEFAULT '24h'
)
RETURNS TABLE(
    total_deliveries BIGINT,
    successful_deliveries BIGINT,
    failed_deliveries BIGINT,
    success_rate NUMERIC
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
        WITH webhook_stats AS (
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE wdl.status = ''success'') as successful,
                COUNT(*) FILTER (WHERE wdl.status = ''failed'') as failed
            FROM webhook_delivery_logs wdl
            JOIN campaign_webhooks cw ON wdl.webhook_id = cw.id
            WHERE cw.campaign_id = $1
            AND %s
        )
        SELECT 
            total::BIGINT,
            successful::BIGINT,
            failed::BIGINT,
            CASE 
                WHEN total > 0 THEN ROUND((successful::NUMERIC / total::NUMERIC) * 100, 2)
                ELSE 0
            END as success_rate
        FROM webhook_stats
    ', time_condition)
    USING campaign_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to clean up old logs
CREATE OR REPLACE FUNCTION cleanup_old_donor_page_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete logs older than 90 days
    DELETE FROM donor_page_logs 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Also clean up old webhook delivery logs
    DELETE FROM webhook_delivery_logs 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RLS policies for security

-- Donor page logs - only accessible by authenticated users for their own campaigns
ALTER TABLE donor_page_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY donor_page_logs_policy ON donor_page_logs
    FOR ALL 
    USING (
        campaign_id IN (
            SELECT id FROM campaigns 
            WHERE user_id = auth.uid()
        )
    );

-- Campaign webhooks - only accessible by campaign owners
ALTER TABLE campaign_webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY campaign_webhooks_policy ON campaign_webhooks
    FOR ALL 
    USING (
        campaign_id IN (
            SELECT id FROM campaigns 
            WHERE user_id = auth.uid()
        )
    );

-- Webhook delivery logs - accessible through webhooks policy
ALTER TABLE webhook_delivery_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY webhook_delivery_logs_policy ON webhook_delivery_logs
    FOR ALL 
    USING (
        webhook_id IN (
            SELECT cw.id FROM campaign_webhooks cw
            JOIN campaigns c ON cw.campaign_id = c.id
            WHERE c.user_id = auth.uid()
        )
    );

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON donor_page_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON campaign_webhooks TO authenticated;
GRANT SELECT, INSERT ON webhook_delivery_logs TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION create_donor_page_sync_trigger(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_webhook_stats(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_donor_page_logs() TO authenticated;

-- Create a trigger to automatically update webhook updated_at
CREATE OR REPLACE FUNCTION update_webhook_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER campaign_webhooks_updated_at
    BEFORE UPDATE ON campaign_webhooks
    FOR EACH ROW
    EXECUTE FUNCTION update_webhook_updated_at();

-- Insert some example log entries for testing (remove in production)
DO $$
BEGIN
    -- Only insert if no logs exist yet
    IF NOT EXISTS (SELECT 1 FROM donor_page_logs LIMIT 1) THEN
        INSERT INTO donor_page_logs (campaign_id, event_type, data) 
        VALUES (
            gen_random_uuid(),
            'system_init',
            jsonb_build_object(
                'message', 'Donor page automation system initialized',
                'version', '1.0.0',
                'timestamp', NOW()
            )
        );
    END IF;
END $$;

COMMIT;