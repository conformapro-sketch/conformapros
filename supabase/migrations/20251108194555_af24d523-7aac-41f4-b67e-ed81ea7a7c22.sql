-- Add nom_site column to sites table as the expected name
-- Keep nom for internal use but use nom_site as the primary field

ALTER TABLE sites
  ADD COLUMN IF NOT EXISTS nom_site TEXT;

-- Copy existing nom values to nom_site
UPDATE sites SET nom_site = nom WHERE nom_site IS NULL;

-- Make nom_site not null going forward
ALTER TABLE sites ALTER COLUMN nom_site SET NOT NULL;

-- Add trigger to keep them in sync
CREATE OR REPLACE FUNCTION sync_site_nom()
RETURNS TRIGGER AS $$
BEGIN
  -- If nom_site changes, update nom
  IF NEW.nom_site != OLD.nom_site THEN
    NEW.nom = NEW.nom_site;
  END IF;
  -- If nom changes, update nom_site
  IF NEW.nom != OLD.nom THEN
    NEW.nom_site = NEW.nom;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_site_nom_trigger
  BEFORE UPDATE ON sites
  FOR EACH ROW
  EXECUTE FUNCTION sync_site_nom();