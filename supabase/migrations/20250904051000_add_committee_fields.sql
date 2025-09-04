-- Add committee contact information fields to campaigns table
-- This allows storing complete committee details with campaigns

ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS committee_name TEXT,
ADD COLUMN IF NOT EXISTS fec_committee_id TEXT,
ADD COLUMN IF NOT EXISTS committee_address TEXT,
ADD COLUMN IF NOT EXISTS committee_city TEXT,
ADD COLUMN IF NOT EXISTS committee_state TEXT,
ADD COLUMN IF NOT EXISTS committee_zip TEXT,
ADD COLUMN IF NOT EXISTS committee_contact_info JSONB;

-- Add index for committee lookups
CREATE INDEX IF NOT EXISTS idx_campaigns_fec_committee_id ON campaigns(fec_committee_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_committee_name ON campaigns(committee_name);

COMMENT ON COLUMN campaigns.committee_name IS 'Name of the FEC committee associated with this campaign';
COMMENT ON COLUMN campaigns.fec_committee_id IS 'FEC Committee ID for compliance tracking';
COMMENT ON COLUMN campaigns.committee_address IS 'Committee street address';
COMMENT ON COLUMN campaigns.committee_city IS 'Committee city';
COMMENT ON COLUMN campaigns.committee_state IS 'Committee state';
COMMENT ON COLUMN campaigns.committee_zip IS 'Committee ZIP code';
COMMENT ON COLUMN campaigns.committee_contact_info IS 'Additional committee contact information as JSON';