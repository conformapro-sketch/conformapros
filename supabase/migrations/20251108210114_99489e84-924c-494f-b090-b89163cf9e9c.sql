-- Add missing columns to sites table for full Tunisian regulatory compliance

-- Administrative and location fields
ALTER TABLE public.sites
  ADD COLUMN IF NOT EXISTS gouvernorat text,
  ADD COLUMN IF NOT EXISTS delegation text,
  ADD COLUMN IF NOT EXISTS localite text;

-- Activity and classification fields
ALTER TABLE public.sites
  ADD COLUMN IF NOT EXISTS classification text,
  ADD COLUMN IF NOT EXISTS secteur_activite text,
  ADD COLUMN IF NOT EXISTS activite text;

-- Management and risk fields
ALTER TABLE public.sites
  ADD COLUMN IF NOT EXISTS responsable_site text,
  ADD COLUMN IF NOT EXISTS niveau_risque text;

-- Flag for headquarters
ALTER TABLE public.sites
  ADD COLUMN IF NOT EXISTS est_siege boolean DEFAULT false;

-- Add indexes for frequently queried fields
CREATE INDEX IF NOT EXISTS idx_sites_gouvernorat ON public.sites(gouvernorat);
CREATE INDEX IF NOT EXISTS idx_sites_classification ON public.sites(classification);
CREATE INDEX IF NOT EXISTS idx_sites_secteur_activite ON public.sites(secteur_activite);
CREATE INDEX IF NOT EXISTS idx_sites_niveau_risque ON public.sites(niveau_risque);

-- Add comments for documentation
COMMENT ON COLUMN public.sites.classification IS 'ICPE classification: 1ère catégorie, 2ème catégorie, 3ème catégorie, ERP, etc.';
COMMENT ON COLUMN public.sites.secteur_activite IS 'Business sector: Chimique, Pharmaceutique, Agroalimentaire, etc.';
COMMENT ON COLUMN public.sites.niveau_risque IS 'Risk level: Faible, Moyen, Élevé, Critique';
COMMENT ON COLUMN public.sites.gouvernorat IS 'Tunisian governorate';
COMMENT ON COLUMN public.sites.delegation IS 'Administrative delegation within governorate';
COMMENT ON COLUMN public.sites.est_siege IS 'True if this is the company headquarters';