-- Add missing committee address columns to campaigns table
-- These columns are needed for the committee form in Step 2 of campaign setup

ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS committee_address TEXT,
ADD COLUMN IF NOT EXISTS committee_city TEXT,
ADD COLUMN IF NOT EXISTS committee_state TEXT,
ADD COLUMN IF NOT EXISTS committee_zip TEXT;

-- Add comment explaining the columns
COMMENT ON COLUMN campaigns.committee_address IS 'Street address of the FEC committee';
COMMENT ON COLUMN campaigns.committee_city IS 'City of the FEC committee';  
COMMENT ON COLUMN campaigns.committee_state IS 'State of the FEC committee';
COMMENT ON COLUMN campaigns.committee_zip IS 'ZIP code of the FEC committee';