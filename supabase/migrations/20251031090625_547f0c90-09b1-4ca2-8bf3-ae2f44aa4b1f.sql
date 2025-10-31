-- Add missing columns to sites table
ALTER TABLE public.sites 
  ADD COLUMN IF NOT EXISTS secteur_activite TEXT,
  ADD COLUMN IF NOT EXISTS delegation TEXT,
  ADD COLUMN IF NOT EXISTS localite TEXT,
  ADD COLUMN IF NOT EXISTS est_siege BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS coordonnees_gps_lat NUMERIC,
  ADD COLUMN IF NOT EXISTS coordonnees_gps_lng NUMERIC,
  ADD COLUMN IF NOT EXISTS superficie NUMERIC,
  ADD COLUMN IF NOT EXISTS equipements_critiques JSONB,
  ADD COLUMN IF NOT EXISTS responsable_site TEXT,
  ADD COLUMN IF NOT EXISTS niveau_risque TEXT;

-- Make non-essential fields nullable
ALTER TABLE public.sites 
  ALTER COLUMN adresse DROP NOT NULL,
  ALTER COLUMN ville DROP NOT NULL,
  ALTER COLUMN code_postal DROP NOT NULL;

-- Ensure nom_site has value before making it NOT NULL
UPDATE public.sites SET nom_site = nom WHERE nom_site IS NULL;

-- Generate unique code_site for any that don't have one using a CTE
WITH numbered_sites AS (
  SELECT 
    id,
    'SITE-' || LPAD(CAST(ROW_NUMBER() OVER (ORDER BY created_at)::INTEGER AS TEXT), 4, '0') as new_code
  FROM public.sites
  WHERE code_site IS NULL OR code_site = ''
)
UPDATE public.sites s
SET code_site = ns.new_code
FROM numbered_sites ns
WHERE s.id = ns.id;

-- Now make them NOT NULL
ALTER TABLE public.sites 
  ALTER COLUMN nom_site SET NOT NULL,
  ALTER COLUMN code_site SET NOT NULL;

-- Add indexes for better performance on filters
CREATE INDEX IF NOT EXISTS idx_sites_gouvernorat ON public.sites(gouvernorat);
CREATE INDEX IF NOT EXISTS idx_sites_delegation ON public.sites(delegation);
CREATE INDEX IF NOT EXISTS idx_sites_classification ON public.sites(classification);
CREATE INDEX IF NOT EXISTS idx_sites_secteur_activite ON public.sites(secteur_activite);

-- Add comment
COMMENT ON COLUMN public.sites.equipements_critiques IS 'JSON array of critical equipment types for the site';