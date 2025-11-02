-- Créer la table codes_juridiques
CREATE TABLE IF NOT EXISTS public.codes_juridiques (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom_officiel TEXT NOT NULL,
  abreviation TEXT NOT NULL UNIQUE,
  domaine_reglementaire_id UUID REFERENCES public.domaines_reglementaires(id) ON DELETE SET NULL,
  reference_jort TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Créer un index sur abreviation pour les recherches rapides
CREATE INDEX idx_codes_juridiques_abreviation ON public.codes_juridiques(abreviation);
CREATE INDEX idx_codes_juridiques_domaine ON public.codes_juridiques(domaine_reglementaire_id);
CREATE INDEX idx_codes_juridiques_deleted_at ON public.codes_juridiques(deleted_at);

-- Table de liaison entre textes réglementaires et codes juridiques
CREATE TABLE IF NOT EXISTS public.textes_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  texte_id UUID NOT NULL REFERENCES public.textes_reglementaires(id) ON DELETE CASCADE,
  code_id UUID NOT NULL REFERENCES public.codes_juridiques(id) ON DELETE CASCADE,
  type_relation TEXT NOT NULL DEFAULT 'appartient_a' CHECK (type_relation IN ('appartient_a', 'modifie', 'abroge_partiellement', 'complete')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(texte_id, code_id, type_relation)
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_textes_codes_texte_id ON public.textes_codes(texte_id);
CREATE INDEX idx_textes_codes_code_id ON public.textes_codes(code_id);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_codes_juridiques_updated_at
  BEFORE UPDATE ON public.codes_juridiques
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.codes_juridiques ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.textes_codes ENABLE ROW LEVEL SECURITY;

-- Policies pour codes_juridiques
-- Lecture : tous les utilisateurs authentifiés
CREATE POLICY "CodesJuridiques: read"
  ON public.codes_juridiques
  FOR SELECT
  USING (deleted_at IS NULL);

-- Gestion : Super Admin uniquement
CREATE POLICY "CodesJuridiques: super_admin manage"
  ON public.codes_juridiques
  FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Policies pour textes_codes
-- Lecture : tous les utilisateurs authentifiés
CREATE POLICY "TextesCodes: read"
  ON public.textes_codes
  FOR SELECT
  USING (true);

-- Gestion : Super Admin uniquement
CREATE POLICY "TextesCodes: super_admin manage"
  ON public.textes_codes
  FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));