-- Additional tables needed for full ConformaPro functionality
-- Run this in your Supabase SQL Editor if you need these features

-- Applicabilite table
CREATE TABLE IF NOT EXISTS public.applicabilite (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  texte_id uuid NOT NULL REFERENCES public.textes_reglementaires(id) ON DELETE CASCADE,
  article_id uuid NOT NULL REFERENCES public.textes_articles(id) ON DELETE CASCADE,
  applicable boolean DEFAULT true,
  justification text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(site_id, article_id)
);

-- Changelog reglementaire
CREATE TABLE IF NOT EXISTS public.changelog_reglementaire (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  acte_id uuid NOT NULL REFERENCES public.actes_reglementaires(id) ON DELETE CASCADE,
  type_changement text NOT NULL,
  description text NOT NULL,
  date_changement date NOT NULL,
  version text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Missing columns in actes_applicabilite_mapping
ALTER TABLE public.actes_applicabilite_mapping
  ADD COLUMN IF NOT EXISTS establishment_type text,
  ADD COLUMN IF NOT EXISTS risk_class text,
  ADD COLUMN IF NOT EXISTS sector text;

-- Missing columns in actes_reglementaires
ALTER TABLE public.actes_reglementaires
  ADD COLUMN IF NOT EXISTS version text DEFAULT '1.0';

-- Missing columns in textes_reglementaires
ALTER TABLE public.textes_reglementaires
  ADD COLUMN IF NOT EXISTS type text,
  ADD COLUMN IF NOT EXISTS numero text;

-- Missing columns in textes_articles
ALTER TABLE public.textes_articles
  ADD COLUMN IF NOT EXISTS numero text;

-- RLS Policies
ALTER TABLE public.applicabilite ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.changelog_reglementaire ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Applicabilite: read if site access" ON public.applicabilite
FOR SELECT TO authenticated
USING (public.has_site_access(auth.uid(), site_id));

CREATE POLICY "Applicabilite: manage if site access" ON public.applicabilite
FOR ALL TO authenticated
USING (public.has_site_access(auth.uid(), site_id))
WITH CHECK (public.has_site_access(auth.uid(), site_id));

CREATE POLICY "ChangelogReglementaire: read" ON public.changelog_reglementaire
FOR SELECT TO authenticated USING (true);

CREATE POLICY "ChangelogReglementaire: super_admin manage" ON public.changelog_reglementaire
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- RPC Functions for searching
CREATE OR REPLACE FUNCTION public.search_actes_reglementaires(
  search_query text,
  domaine_filter text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  reference_officielle text,
  intitule text,
  type_acte text,
  statut_vigueur text,
  date_publication date,
  resume text
)
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.reference_officielle,
    a.intitule,
    a.type_acte,
    a.statut_vigueur,
    a.date_publication,
    a.resume
  FROM actes_reglementaires a
  WHERE 
    (search_query IS NULL OR 
     a.intitule ILIKE '%' || search_query || '%' OR
     a.reference_officielle ILIKE '%' || search_query || '%' OR
     a.resume ILIKE '%' || search_query || '%')
  ORDER BY a.date_publication DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_applicable_actes_for_site(site_uuid uuid)
RETURNS TABLE (
  id uuid,
  reference_officielle text,
  intitule text,
  type_acte text,
  statut_vigueur text,
  match_score integer
)
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    a.id,
    a.reference_officielle,
    a.intitule,
    a.type_acte,
    a.statut_vigueur,
    COALESCE(aam.match_score, 1) as match_score
  FROM actes_reglementaires a
  LEFT JOIN actes_applicabilite_mapping aam ON aam.acte_id = a.id
  WHERE a.statut_vigueur = 'en_vigueur'
  ORDER BY match_score DESC, a.date_publication DESC;
END;
$$;

-- Triggers
CREATE TRIGGER update_applicabilite_updated_at 
BEFORE UPDATE ON public.applicabilite 
FOR EACH ROW 
EXECUTE FUNCTION public.update_updated_at_column();
