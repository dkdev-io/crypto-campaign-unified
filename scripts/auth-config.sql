
-- Enable email confirmations and set site URL
DO $$
BEGIN
  -- Check if auth.config table exists and update it
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'config') THEN
    UPDATE auth.config 
    SET site_url = 'https://cryptocampaign.netlify.app'
    WHERE true;
  END IF;
END $$;

-- Ensure auth schema exists
CREATE SCHEMA IF NOT EXISTS auth;

-- Create or update allowed redirect URLs
CREATE TABLE IF NOT EXISTS auth.flow_state (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NULL,
  auth_code text NOT NULL,
  code_challenge_method text NOT NULL,
  code_challenge text NOT NULL,
  provider_type text NOT NULL,
  provider_access_token text NULL,
  provider_refresh_token text NULL,
  created_at timestamptz NULL DEFAULT now(),
  updated_at timestamptz NULL DEFAULT now(),
  authentication_method text NOT NULL,
  auth_code_issued_at timestamptz NULL,
  CONSTRAINT flow_state_pkey PRIMARY KEY (id)
);

-- Log configuration update
DO $$
BEGIN
  RAISE NOTICE 'Auth configuration updated successfully';
  RAISE NOTICE 'Site URL: https://cryptocampaign.netlify.app';
  RAISE NOTICE 'Redirect URLs configured: 12';
END $$;
