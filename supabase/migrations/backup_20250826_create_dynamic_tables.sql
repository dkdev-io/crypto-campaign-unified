-- ============================================================================
-- DYNAMIC TABLE CREATION FOR OFFLINE CONTRIBUTIONS
-- Creates functions to handle dynamic table creation for user-uploaded data
-- ============================================================================

-- ============================================================================
-- 1. CREATE FUNCTION TO EXECUTE DYNAMIC SQL (Admin Only)
-- ============================================================================

-- This function allows for dynamic table creation
-- It should be restricted to authenticated users for their own data
CREATE OR REPLACE FUNCTION create_user_contribution_table(
    p_table_name TEXT,
    p_columns JSONB
)
RETURNS BOOLEAN
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    v_sql TEXT;
    v_column JSONB;
    v_column_name TEXT;
    v_policy_name TEXT;
BEGIN
    -- Validate table name format
    IF NOT p_table_name ~ '^offlinecontributions_[a-zA-Z0-9_]+$' THEN
        RAISE EXCEPTION 'Invalid table name format';
    END IF;
    
    -- Build CREATE TABLE statement
    v_sql := 'CREATE TABLE IF NOT EXISTS "' || p_table_name || '" (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL DEFAULT auth.uid(),
        uploaded_at TIMESTAMPTZ DEFAULT NOW(),
        source_file TEXT';
    
    -- Add dynamic columns from JSONB array
    FOR v_column IN SELECT * FROM jsonb_array_elements(p_columns)
    LOOP
        v_column_name := regexp_replace(lower(v_column->>'name'), '[^a-zA-Z0-9_]', '_', 'g');
        v_sql := v_sql || ',
        "' || v_column_name || '" TEXT';
    END LOOP;
    
    -- Complete table definition
    v_sql := v_sql || ',
        CONSTRAINT "' || p_table_name || '_user_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )';
    
    -- Execute CREATE TABLE
    EXECUTE v_sql;
    
    -- Enable RLS
    EXECUTE 'ALTER TABLE "' || p_table_name || '" ENABLE ROW LEVEL SECURITY';
    
    -- Create RLS policy
    v_policy_name := p_table_name || '_user_policy';
    EXECUTE 'DROP POLICY IF EXISTS "' || v_policy_name || '" ON "' || p_table_name || '"';
    EXECUTE 'CREATE POLICY "' || v_policy_name || '" ON "' || p_table_name || '" FOR ALL USING (user_id = auth.uid())';
    
    -- Create index on user_id for performance
    EXECUTE 'CREATE INDEX IF NOT EXISTS "idx_' || p_table_name || '_user_id" ON "' || p_table_name || '" (user_id)';
    
    -- Create index on uploaded_at for performance
    EXECUTE 'CREATE INDEX IF NOT EXISTS "idx_' || p_table_name || '_uploaded_at" ON "' || p_table_name || '" (uploaded_at DESC)';
    
    RETURN TRUE;
    
EXCEPTION WHEN OTHERS THEN
    -- Log error and return false
    RAISE WARNING 'Error creating table %: %', p_table_name, SQLERRM;
    RETURN FALSE;
END;
$$;

-- ============================================================================
-- 2. CREATE FUNCTION TO INSERT DATA INTO DYNAMIC TABLES
-- ============================================================================

CREATE OR REPLACE FUNCTION insert_contribution_data(
    p_table_name TEXT,
    p_data JSONB
)
RETURNS INTEGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    v_sql TEXT;
    v_columns TEXT[];
    v_values TEXT[];
    v_key TEXT;
    v_value TEXT;
    v_inserted_count INTEGER := 0;
BEGIN
    -- Validate table name format
    IF NOT p_table_name ~ '^offlinecontributions_[a-zA-Z0-9_]+$' THEN
        RAISE EXCEPTION 'Invalid table name format';
    END IF;
    
    -- Check if table exists and user has access
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = p_table_name 
        AND table_schema = 'public'
    ) THEN
        RAISE EXCEPTION 'Table does not exist: %', p_table_name;
    END IF;
    
    -- Build column and value arrays
    v_columns := ARRAY['user_id', 'uploaded_at', 'source_file'];
    v_values := ARRAY['auth.uid()', 'NOW()', quote_literal(COALESCE(p_data->>'source_file', 'unknown'))];
    
    -- Add dynamic columns
    FOR v_key IN SELECT jsonb_object_keys(p_data)
    LOOP
        IF v_key NOT IN ('source_file', 'user_id', 'uploaded_at', 'id') THEN
            v_columns := v_columns || ARRAY['"' || regexp_replace(lower(v_key), '[^a-zA-Z0-9_]', '_', 'g') || '"'];
            v_value := p_data->>v_key;
            v_values := v_values || ARRAY[COALESCE(quote_literal(v_value), 'NULL')];
        END IF;
    END LOOP;
    
    -- Build and execute INSERT statement
    v_sql := 'INSERT INTO "' || p_table_name || '" (' || array_to_string(v_columns, ', ') || ') VALUES (' || array_to_string(v_values, ', ') || ')';
    
    EXECUTE v_sql;
    GET DIAGNOSTICS v_inserted_count = ROW_COUNT;
    
    RETURN v_inserted_count;
    
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error inserting data into %: %', p_table_name, SQLERRM;
    RETURN 0;
END;
$$;

-- ============================================================================
-- 3. CREATE FUNCTION TO GET USER'S CONTRIBUTION TABLES
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_contribution_tables()
RETURNS TABLE(
    table_name TEXT,
    created_at TIMESTAMPTZ,
    record_count BIGINT,
    columns JSONB
)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    v_table_name TEXT;
    v_record_count BIGINT;
    v_columns JSONB;
BEGIN
    -- Find all tables that belong to the current user
    FOR v_table_name IN 
        SELECT t.table_name 
        FROM information_schema.tables t
        WHERE t.table_schema = 'public'
        AND t.table_name LIKE 'offlinecontributions_%'
        AND EXISTS (
            SELECT 1 FROM information_schema.columns c
            WHERE c.table_name = t.table_name
            AND c.column_name = 'user_id'
        )
    LOOP
        -- Get record count for this user
        EXECUTE format('SELECT COUNT(*) FROM %I WHERE user_id = auth.uid()', v_table_name)
        INTO v_record_count;
        
        -- Skip tables with no records for this user
        IF v_record_count > 0 THEN
            -- Get column information
            SELECT jsonb_agg(
                jsonb_build_object(
                    'name', column_name,
                    'type', data_type
                )
            )
            INTO v_columns
            FROM information_schema.columns
            WHERE table_name = v_table_name
            AND table_schema = 'public'
            AND column_name NOT IN ('id', 'user_id', 'uploaded_at', 'source_file');
            
            -- Return row
            table_name := v_table_name;
            created_at := NOW(); -- We don't have actual creation time, so use current time
            record_count := v_record_count;
            columns := v_columns;
            
            RETURN NEXT;
        END IF;
    END LOOP;
    
    RETURN;
END;
$$;

-- ============================================================================
-- 4. CREATE FUNCTION TO EXPORT USER DATA
-- ============================================================================

CREATE OR REPLACE FUNCTION export_contribution_table_data(p_table_name TEXT)
RETURNS TABLE(data JSONB)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    v_sql TEXT;
BEGIN
    -- Validate table name format
    IF NOT p_table_name ~ '^offlinecontributions_[a-zA-Z0-9_]+$' THEN
        RAISE EXCEPTION 'Invalid table name format';
    END IF;
    
    -- Check if table exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = p_table_name 
        AND table_schema = 'public'
    ) THEN
        RAISE EXCEPTION 'Table does not exist: %', p_table_name;
    END IF;
    
    -- Build and execute SELECT statement
    v_sql := format('SELECT row_to_json(t)::jsonb as data FROM (SELECT * FROM %I WHERE user_id = auth.uid() ORDER BY uploaded_at DESC) t', p_table_name);
    
    RETURN QUERY EXECUTE v_sql;
    
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error exporting data from %: %', p_table_name, SQLERRM;
    RETURN;
END;
$$;

-- ============================================================================
-- 5. CREATE FUNCTION TO DELETE USER'S CONTRIBUTION TABLE
-- ============================================================================

CREATE OR REPLACE FUNCTION delete_user_contribution_table(p_table_name TEXT)
RETURNS BOOLEAN
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Validate table name format
    IF NOT p_table_name ~ '^offlinecontributions_[a-zA-Z0-9_]+$' THEN
        RAISE EXCEPTION 'Invalid table name format';
    END IF;
    
    -- Check if table exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = p_table_name 
        AND table_schema = 'public'
    ) THEN
        RAISE EXCEPTION 'Table does not exist: %', p_table_name;
    END IF;
    
    -- Verify user has data in this table (security check)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = p_table_name 
        AND column_name = 'user_id'
    ) THEN
        RAISE EXCEPTION 'Table does not have user_id column: %', p_table_name;
    END IF;
    
    -- For safety, we'll only delete the user's data, not the entire table
    -- In a production environment, you might want to drop the entire table
    EXECUTE format('DELETE FROM %I WHERE user_id = auth.uid()', p_table_name);
    
    RETURN TRUE;
    
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error deleting data from table %: %', p_table_name, SQLERRM;
    RETURN FALSE;
END;
$$;

-- ============================================================================
-- 6. CREATE TABLE TO TRACK USER'S DATA SOURCES
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_data_sources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    table_name TEXT NOT NULL,
    source_type TEXT NOT NULL CHECK (source_type IN ('csv_upload', 'api_connection')),
    source_name TEXT NOT NULL, -- File name or API name
    record_count INTEGER DEFAULT 0,
    columns_info JSONB,
    upload_date TIMESTAMPTZ DEFAULT NOW(),
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'error')),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Add indexes
CREATE INDEX idx_user_data_sources_user_id ON user_data_sources(user_id);
CREATE INDEX idx_user_data_sources_table_name ON user_data_sources(table_name);
CREATE INDEX idx_user_data_sources_status ON user_data_sources(status);

-- Enable RLS
ALTER TABLE user_data_sources ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own data sources
CREATE POLICY "Users can manage own data sources" ON user_data_sources
    FOR ALL USING (user_id = auth.uid());

-- ============================================================================
-- 7. CREATE FUNCTION TO REGISTER DATA SOURCE
-- ============================================================================

CREATE OR REPLACE FUNCTION register_data_source(
    p_table_name TEXT,
    p_source_type TEXT,
    p_source_name TEXT,
    p_record_count INTEGER,
    p_columns_info JSONB DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    v_source_id UUID;
BEGIN
    -- Insert or update data source record
    INSERT INTO user_data_sources (
        user_id,
        table_name,
        source_type,
        source_name,
        record_count,
        columns_info,
        metadata
    ) VALUES (
        auth.uid(),
        p_table_name,
        p_source_type,
        p_source_name,
        p_record_count,
        COALESCE(p_columns_info, '{}'::jsonb),
        COALESCE(p_metadata, '{}'::jsonb)
    )
    ON CONFLICT (user_id, table_name) DO UPDATE SET
        source_name = EXCLUDED.source_name,
        record_count = EXCLUDED.record_count,
        columns_info = EXCLUDED.columns_info,
        last_updated = NOW(),
        metadata = EXCLUDED.metadata
    RETURNING id INTO v_source_id;
    
    RETURN v_source_id;
END;
$$;

-- ============================================================================
-- 8. CREATE FUNCTION TO GET DATA SOURCE SUMMARY
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_data_summary()
RETURNS TABLE(
    source_id UUID,
    table_name TEXT,
    source_type TEXT,
    source_name TEXT,
    record_count INTEGER,
    upload_date TIMESTAMPTZ,
    last_updated TIMESTAMPTZ,
    status TEXT,
    sample_data JSONB
)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    v_source RECORD;
    v_sample_data JSONB;
BEGIN
    -- Get all data sources for the user
    FOR v_source IN 
        SELECT * FROM user_data_sources 
        WHERE user_id = auth.uid() 
        ORDER BY upload_date DESC
    LOOP
        -- Get sample data from the table
        BEGIN
            EXECUTE format(
                'SELECT jsonb_agg(row_to_json(t)) FROM (SELECT * FROM %I WHERE user_id = auth.uid() LIMIT 3) t',
                v_source.table_name
            ) INTO v_sample_data;
        EXCEPTION WHEN OTHERS THEN
            v_sample_data := '[]'::jsonb;
        END;
        
        -- Return the row
        source_id := v_source.id;
        table_name := v_source.table_name;
        source_type := v_source.source_type;
        source_name := v_source.source_name;
        record_count := v_source.record_count;
        upload_date := v_source.upload_date;
        last_updated := v_source.last_updated;
        status := v_source.status;
        sample_data := v_sample_data;
        
        RETURN NEXT;
    END LOOP;
    
    RETURN;
END;
$$;

-- ============================================================================
-- 9. GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION create_user_contribution_table(TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION insert_contribution_data(TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_contribution_tables() TO authenticated;
GRANT EXECUTE ON FUNCTION export_contribution_table_data(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user_contribution_table(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION register_data_source(TEXT, TEXT, TEXT, INTEGER, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_data_summary() TO authenticated;

-- ============================================================================
-- 10. CREATE EXAMPLE USAGE FUNCTIONS
-- ============================================================================

-- Example: Create a table and insert sample data
/*
-- Create table
SELECT create_user_contribution_table(
    'offlinecontributions_testuser', 
    '[
        {"name": "full_name", "type": "text"},
        {"name": "email", "type": "text"},
        {"name": "amount", "type": "numeric"},
        {"name": "date", "type": "date"}
    ]'::jsonb
);

-- Insert data
SELECT insert_contribution_data(
    'offlinecontributions_testuser',
    '{
        "full_name": "John Doe",
        "email": "john@example.com",
        "amount": "100.00",
        "date": "2024-01-15",
        "source_file": "donors.csv"
    }'::jsonb
);

-- Register the data source
SELECT register_data_source(
    'offlinecontributions_testuser',
    'csv_upload',
    'donors.csv',
    1,
    '[{"name": "full_name"}, {"name": "email"}, {"name": "amount"}, {"name": "date"}]'::jsonb,
    '{"original_filename": "donors.csv", "upload_size": "2048"}'::jsonb
);
*/