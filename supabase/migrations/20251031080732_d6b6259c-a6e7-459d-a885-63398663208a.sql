-- Phase 1: Add missing columns to actes_reglementaires
ALTER TABLE actes_reglementaires 
ADD COLUMN IF NOT EXISTS annee INTEGER,
ADD COLUMN IF NOT EXISTS autorite_emettrice TEXT;

-- Create index on annee for filtering
CREATE INDEX IF NOT EXISTS idx_actes_annee ON actes_reglementaires(annee);

-- Update existing records to extract year from date_publication
UPDATE actes_reglementaires 
SET annee = EXTRACT(YEAR FROM date_publication)::INTEGER
WHERE date_publication IS NOT NULL AND annee IS NULL;