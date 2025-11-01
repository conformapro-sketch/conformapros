-- ============================================================================
-- PHASE 1: TABLES EPI
-- ============================================================================

-- Table des types d'EPI (casques, gants, chaussures, etc.)
CREATE TABLE IF NOT EXISTS public.epi_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  libelle TEXT NOT NULL,
  categorie TEXT NOT NULL,
  description TEXT,
  normes_certifications JSONB DEFAULT '{"normes": [], "certifications": []}'::jsonb,
  specifications_techniques JSONB DEFAULT '{}'::jsonb,
  duree_vie_moyenne_mois INTEGER,
  photo_url TEXT,
  fiche_technique_url TEXT,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table des articles EPI (stock individuel)
CREATE TABLE IF NOT EXISTS public.epi_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_article TEXT NOT NULL UNIQUE,
  type_id UUID REFERENCES public.epi_types(id) ON DELETE CASCADE,
  site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE,
  marque TEXT,
  modele TEXT,
  taille TEXT,
  date_reception DATE,
  date_attribution DATE,
  date_mise_au_rebut DATE,
  statut TEXT DEFAULT 'en_stock' CHECK (statut IN ('en_stock', 'attribue', 'en_maintenance', 'mis_au_rebut')),
  employe_id UUID REFERENCES public.employes(id) ON DELETE SET NULL,
  observations TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table historique des attributions/mouvements EPI
CREATE TABLE IF NOT EXISTS public.epi_mouvements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES public.epi_articles(id) ON DELETE CASCADE,
  type_mouvement TEXT NOT NULL CHECK (type_mouvement IN ('reception', 'attribution', 'retour', 'remplacement', 'reforme', 'maintenance')),
  employe_id UUID REFERENCES public.employes(id) ON DELETE SET NULL,
  date_mouvement DATE NOT NULL DEFAULT CURRENT_DATE,
  quantite INTEGER DEFAULT 1,
  motif TEXT,
  effectue_par UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table des besoins/demandes EPI
CREATE TABLE IF NOT EXISTS public.epi_demandes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_id UUID REFERENCES public.epi_types(id),
  employe_id UUID REFERENCES public.employes(id),
  site_id UUID REFERENCES public.sites(id),
  quantite INTEGER DEFAULT 1,
  taille TEXT,
  motif TEXT,
  statut TEXT DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'approuvee', 'rejetee', 'livree')),
  date_demande DATE DEFAULT CURRENT_DATE,
  date_traitement DATE,
  traite_par UUID REFERENCES auth.users(id),
  observations TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- PHASE 3: AMÉLIORATION TABLES ÉQUIPEMENTS
-- ============================================================================

-- Ajouter colonnes manquantes pour gestion avancée
ALTER TABLE public.equipements 
  ADD COLUMN IF NOT EXISTS prestataire_id UUID,
  ADD COLUMN IF NOT EXISTS cout_maintenance_annuel NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS fichier_certificat_url TEXT,
  ADD COLUMN IF NOT EXISTS qr_code TEXT;

-- Table des prestataires
CREATE TABLE IF NOT EXISTS public.prestataires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  type_prestation TEXT,
  contact_nom TEXT,
  contact_email TEXT,
  contact_telephone TEXT,
  adresse TEXT,
  certifications JSONB DEFAULT '[]'::jsonb,
  domaines_intervention JSONB DEFAULT '[]'::jsonb,
  evaluation_moyenne NUMERIC(3,2),
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table des interventions prestataires
CREATE TABLE IF NOT EXISTS public.prestataire_interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prestataire_id UUID REFERENCES public.prestataires(id) ON DELETE CASCADE,
  equipement_id UUID REFERENCES public.equipements(id) ON DELETE CASCADE,
  controle_id UUID REFERENCES public.equipements_controle(id) ON DELETE SET NULL,
  date_intervention DATE NOT NULL,
  type_intervention TEXT NOT NULL,
  cout NUMERIC(10,2),
  duree_heures NUMERIC(4,2),
  rapport_url TEXT,
  evaluation INTEGER CHECK (evaluation >= 1 AND evaluation <= 5),
  commentaire TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- EPI Types
ALTER TABLE public.epi_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "EPI types: read all" 
ON public.epi_types FOR SELECT 
TO authenticated 
USING (actif = true);

CREATE POLICY "EPI types: super_admin manage" 
ON public.epi_types FOR ALL 
TO authenticated 
USING (public.has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

-- EPI Articles
ALTER TABLE public.epi_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "EPI articles: read if site access" 
ON public.epi_articles FOR SELECT 
TO authenticated 
USING (public.has_site_access(auth.uid(), site_id));

CREATE POLICY "EPI articles: manage if site access" 
ON public.epi_articles FOR ALL 
TO authenticated 
USING (public.has_site_access(auth.uid(), site_id))
WITH CHECK (public.has_site_access(auth.uid(), site_id));

-- EPI Mouvements
ALTER TABLE public.epi_mouvements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "EPI mouvements: read if site access" 
ON public.epi_mouvements FOR SELECT 
TO authenticated 
USING (EXISTS (
  SELECT 1 FROM public.epi_articles ea 
  WHERE ea.id = epi_mouvements.article_id 
  AND public.has_site_access(auth.uid(), ea.site_id)
));

CREATE POLICY "EPI mouvements: insert if site access" 
ON public.epi_mouvements FOR INSERT 
TO authenticated 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.epi_articles ea 
  WHERE ea.id = epi_mouvements.article_id 
  AND public.has_site_access(auth.uid(), ea.site_id)
));

-- EPI Demandes
ALTER TABLE public.epi_demandes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "EPI demandes: read if site access" 
ON public.epi_demandes FOR SELECT 
TO authenticated 
USING (public.has_site_access(auth.uid(), site_id));

CREATE POLICY "EPI demandes: manage if site access" 
ON public.epi_demandes FOR ALL 
TO authenticated 
USING (public.has_site_access(auth.uid(), site_id))
WITH CHECK (public.has_site_access(auth.uid(), site_id));

-- Prestataires
ALTER TABLE public.prestataires ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Prestataires: read all" 
ON public.prestataires FOR SELECT 
TO authenticated 
USING (actif = true);

CREATE POLICY "Prestataires: super_admin manage" 
ON public.prestataires FOR ALL 
TO authenticated 
USING (public.has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

-- Interventions
ALTER TABLE public.prestataire_interventions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Interventions: read if site access" 
ON public.prestataire_interventions FOR SELECT 
TO authenticated 
USING (EXISTS (
  SELECT 1 FROM public.equipements e 
  WHERE e.id = prestataire_interventions.equipement_id 
  AND public.has_site_access(auth.uid(), e.site_id)
));

CREATE POLICY "Interventions: manage if site access" 
ON public.prestataire_interventions FOR ALL 
TO authenticated 
USING (EXISTS (
  SELECT 1 FROM public.equipements e 
  WHERE e.id = prestataire_interventions.equipement_id 
  AND public.has_site_access(auth.uid(), e.site_id)
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.equipements e 
  WHERE e.id = prestataire_interventions.equipement_id 
  AND public.has_site_access(auth.uid(), e.site_id)
));

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_epi_articles_site ON public.epi_articles(site_id);
CREATE INDEX IF NOT EXISTS idx_epi_articles_type ON public.epi_articles(type_id);
CREATE INDEX IF NOT EXISTS idx_epi_articles_employe ON public.epi_articles(employe_id);
CREATE INDEX IF NOT EXISTS idx_epi_articles_statut ON public.epi_articles(statut);
CREATE INDEX IF NOT EXISTS idx_epi_mouvements_article ON public.epi_mouvements(article_id);
CREATE INDEX IF NOT EXISTS idx_epi_mouvements_employe ON public.epi_mouvements(employe_id);
CREATE INDEX IF NOT EXISTS idx_epi_demandes_site ON public.epi_demandes(site_id);
CREATE INDEX IF NOT EXISTS idx_epi_demandes_statut ON public.epi_demandes(statut);
CREATE INDEX IF NOT EXISTS idx_prestataires_actif ON public.prestataires(actif);
CREATE INDEX IF NOT EXISTS idx_interventions_prestataire ON public.prestataire_interventions(prestataire_id);
CREATE INDEX IF NOT EXISTS idx_interventions_equipement ON public.prestataire_interventions(equipement_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_epi_types_updated_at 
BEFORE UPDATE ON public.epi_types 
FOR EACH ROW 
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_epi_articles_updated_at 
BEFORE UPDATE ON public.epi_articles 
FOR EACH ROW 
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_prestataires_updated_at 
BEFORE UPDATE ON public.prestataires 
FOR EACH ROW 
EXECUTE FUNCTION public.update_updated_at_column();