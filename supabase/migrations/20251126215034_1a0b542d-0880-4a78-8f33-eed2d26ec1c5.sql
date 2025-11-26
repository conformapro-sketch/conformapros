-- Add actif and secteur columns to clients table
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS actif boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS secteur text;

COMMENT ON COLUMN clients.actif IS 'Active status of the client organization';
COMMENT ON COLUMN clients.secteur IS 'Business sector or industry type of the client';