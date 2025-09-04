-- Add style columns to campaigns table
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS applied_styles JSONB,
ADD COLUMN IF NOT EXISTS styles_applied BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS style_method TEXT;