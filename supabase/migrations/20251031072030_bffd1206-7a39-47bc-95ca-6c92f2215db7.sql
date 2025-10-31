-- Create applicabilite table
CREATE TABLE IF NOT EXISTS public.applicabilite (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL,
  texte_id UUID NOT NULL,
  article_id UUID NOT NULL,
  applicable TEXT NOT NULL DEFAULT 'obligatoire',
  motif_non_applicable TEXT,
  commentaire_non_applicable TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create changelog_reglementaire table
CREATE TABLE IF NOT EXISTS public.changelog_reglementaire (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  acte_id UUID NOT NULL REFERENCES public.actes_reglementaires(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  type_changement TEXT NOT NULL,
  description TEXT NOT NULL,
  date_changement DATE NOT NULL,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add version column to actes_reglementaires
ALTER TABLE public.actes_reglementaires ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Enable RLS on new tables
ALTER TABLE public.applicabilite ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.changelog_reglementaire ENABLE ROW LEVEL SECURITY;

-- RLS policies for applicabilite
CREATE POLICY "Applicabilite: read if site access" ON public.applicabilite
  FOR SELECT USING (has_site_access(auth.uid(), site_id));

CREATE POLICY "Applicabilite: manage if site access" ON public.applicabilite
  FOR ALL USING (has_site_access(auth.uid(), site_id))
  WITH CHECK (has_site_access(auth.uid(), site_id));

-- RLS policies for changelog_reglementaire
CREATE POLICY "Changelog: read" ON public.changelog_reglementaire
  FOR SELECT USING (true);

CREATE POLICY "Changelog: super_admin manage" ON public.changelog_reglementaire
  FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Triggers for updated_at
CREATE TRIGGER update_applicabilite_updated_at
  BEFORE UPDATE ON public.applicabilite
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create RPC function for full-text search
CREATE OR REPLACE FUNCTION public.search_actes_reglementaires(search_term TEXT, result_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  id UUID,
  reference_officielle TEXT,
  intitule TEXT,
  type_acte TEXT,
  date_publication DATE,
  statut_vigueur TEXT,
  resume TEXT,
  rank REAL
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ar.id,
    ar.reference_officielle,
    ar.intitule,
    ar.type_acte,
    ar.date_publication,
    ar.statut_vigueur,
    ar.resume,
    ts_rank(
      to_tsvector('french', coalesce(ar.intitule, '') || ' ' || coalesce(ar.reference_officielle, '') || ' ' || coalesce(ar.resume, '')),
      plainto_tsquery('french', search_term)
    ) as rank
  FROM public.actes_reglementaires ar
  WHERE 
    to_tsvector('french', coalesce(ar.intitule, '') || ' ' || coalesce(ar.reference_officielle, '') || ' ' || coalesce(ar.resume, ''))
    @@ plainto_tsquery('french', search_term)
  ORDER BY rank DESC
  LIMIT result_limit;
END;
$$;

-- Create RPC function to get applicable actes for a site
CREATE OR REPLACE FUNCTION public.get_applicable_actes_for_site(p_site_id UUID)
RETURNS TABLE (
  acte_id UUID,
  reference_officielle TEXT,
  intitule TEXT,
  type_acte TEXT,
  date_publication DATE,
  sous_domaine_id UUID,
  match_score INTEGER
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ar.id as acte_id,
    ar.reference_officielle,
    ar.intitule,
    ar.type_acte,
    ar.date_publication,
    aam.sous_domaine_id,
    aam.match_score
  FROM public.actes_reglementaires ar
  INNER JOIN public.actes_applicabilite_mapping aam ON ar.id = aam.acte_id
  WHERE ar.statut_vigueur = 'en_vigueur'
  ORDER BY aam.match_score DESC, ar.date_publication DESC;
END;
$$;