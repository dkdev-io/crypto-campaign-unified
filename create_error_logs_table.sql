-- Create error_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS error_logs (
  id BIGSERIAL PRIMARY KEY,
  error_type VARCHAR(100) NOT NULL,
  error_message TEXT,
  user_agent TEXT,
  url TEXT,
  search_term TEXT,
  metadata JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_error_logs_type ON error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON error_logs(timestamp);

-- Create RPC function to create table if not exists
CREATE OR REPLACE FUNCTION create_error_logs_table_if_not_exists()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create table if it doesn't exist
  CREATE TABLE IF NOT EXISTS error_logs (
    id BIGSERIAL PRIMARY KEY,
    error_type VARCHAR(100) NOT NULL,
    error_message TEXT,
    user_agent TEXT,
    url TEXT,
    search_term TEXT,
    metadata JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Create indexes if they don't exist
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'error_logs' AND indexname = 'idx_error_logs_type') THEN
    CREATE INDEX idx_error_logs_type ON error_logs(error_type);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'error_logs' AND indexname = 'idx_error_logs_timestamp') THEN
    CREATE INDEX idx_error_logs_timestamp ON error_logs(timestamp);
  END IF;
END;
$$;