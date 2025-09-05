-- COMMITTEE ADDRESS COLUMNS FIX
-- Run this SQL in the Supabase dashboard to fix the committee form
-- Go to: https://supabase.com/dashboard/project/kmepcdsklnnxokoimvzo/sql-editor

-- Add missing committee address columns
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS committee_address TEXT,
ADD COLUMN IF NOT EXISTS committee_city TEXT,
ADD COLUMN IF NOT EXISTS committee_state TEXT,
ADD COLUMN IF NOT EXISTS committee_zip TEXT;

-- Verify columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'campaigns' 
  AND column_name LIKE '%committee%'
ORDER BY column_name;