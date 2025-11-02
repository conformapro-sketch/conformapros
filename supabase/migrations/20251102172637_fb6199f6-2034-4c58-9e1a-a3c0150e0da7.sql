-- Créer la table de liaison many-to-many entre codes juridiques et domaines
CREATE TABLE IF NOT EXISTS public.codes_domaines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id UUID NOT NULL REFERENCES public.codes_juridiques(id) ON DELETE CASCADE,
  domaine_id UUID NOT NULL REFERENCES public.domaines_reglementaires(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(code_id, domaine_id)
);

-- Index pour améliorer les performances
CREATE INDEX idx_codes_domaines_code_id ON public.codes_domaines(code_id);
CREATE INDEX idx_codes_domaines_domaine_id ON public.codes_domaines(domaine_id);

-- RLS Policies
ALTER TABLE public.codes_domaines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CodesDomaines: read"
  ON public.codes_domaines FOR SELECT
  USING (true);

CREATE POLICY "CodesDomaines: super_admin manage"
  ON public.codes_domaines FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Migrer les liaisons existantes vers la nouvelle table
INSERT INTO public.codes_domaines (code_id, domaine_id)
SELECT id, domaine_reglementaire_id
FROM public.codes_juridiques
WHERE domaine_reglementaire_id IS NOT NULL
ON CONFLICT (code_id, domaine_id) DO NOTHING;

-- Commenter la table
COMMENT ON TABLE public.codes_domaines IS 'Table de liaison many-to-many entre codes juridiques et domaines réglementaires';