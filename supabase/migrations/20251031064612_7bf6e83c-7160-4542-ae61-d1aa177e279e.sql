-- Create missing tables for Bibliothèque Réglementaire

-- Actes tables
CREATE TABLE IF NOT EXISTS public.actes_reglementaires (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_officielle text UNIQUE NOT NULL,
  intitule text NOT NULL,
  type_acte text NOT NULL,
  date_publication date,
  date_effet date,
  date_abrogation date,
  statut_vigueur text DEFAULT 'en_vigueur',
  texte_integral text,
  resume text,
  lien_officiel text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.actes_annexes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  acte_id uuid NOT NULL REFERENCES public.actes_reglementaires(id) ON DELETE CASCADE,
  label text NOT NULL,
  file_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.actes_applicabilite_mapping (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  acte_id uuid NOT NULL REFERENCES public.actes_reglementaires(id) ON DELETE CASCADE,
  sous_domaine_id uuid NOT NULL REFERENCES public.sous_domaines_application(id) ON DELETE CASCADE,
  match_score integer DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(acte_id, sous_domaine_id)
);

-- Add missing columns to tables
ALTER TABLE public.sites
  ADD COLUMN IF NOT EXISTS activite text;

ALTER TABLE public.domaines_reglementaires
  ADD COLUMN IF NOT EXISTS actif boolean DEFAULT true;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tenant_id uuid;

-- Enable RLS
ALTER TABLE public.actes_reglementaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actes_annexes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actes_applicabilite_mapping ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "ActesReglementaires: read" ON public.actes_reglementaires
FOR SELECT TO authenticated USING (true);

CREATE POLICY "ActesReglementaires: super_admin manage" ON public.actes_reglementaires
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "ActesAnnexes: read" ON public.actes_annexes
FOR SELECT TO authenticated USING (true);

CREATE POLICY "ActesAnnexes: super_admin manage" ON public.actes_annexes
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "ActesApplicabilite: read" ON public.actes_applicabilite_mapping
FOR SELECT TO authenticated USING (true);

CREATE POLICY "ActesApplicabilite: super_admin manage" ON public.actes_applicabilite_mapping
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Add triggers
CREATE TRIGGER update_actes_reglementaires_updated_at 
BEFORE UPDATE ON public.actes_reglementaires 
FOR EACH ROW 
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_actes_annexes_updated_at 
BEFORE UPDATE ON public.actes_annexes 
FOR EACH ROW 
EXECUTE FUNCTION public.update_updated_at_column();