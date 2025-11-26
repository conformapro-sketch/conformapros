-- Add actif column to sites table
ALTER TABLE sites
ADD COLUMN IF NOT EXISTS actif boolean DEFAULT true;

COMMENT ON COLUMN sites.actif IS 'Active status of the site';