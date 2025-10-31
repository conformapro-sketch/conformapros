-- Create junction table for actes_reglementaires and domaines
CREATE TABLE IF NOT EXISTS public.actes_reglementaires_domaines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  acte_id UUID NOT NULL REFERENCES public.actes_reglementaires(id) ON DELETE CASCADE,
  domaine_id UUID NOT NULL REFERENCES public.domaines_reglementaires(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(acte_id, domaine_id)
);

-- Enable RLS
ALTER TABLE public.actes_reglementaires_domaines ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "ActesReglementairesDomaines: read"
  ON public.actes_reglementaires_domaines
  FOR SELECT
  USING (true);

CREATE POLICY "ActesReglementairesDomaines: super_admin manage"
  ON public.actes_reglementaires_domaines
  FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Create index
CREATE INDEX IF NOT EXISTS idx_actes_domaines_acte ON public.actes_reglementaires_domaines(acte_id);
CREATE INDEX IF NOT EXISTS idx_actes_domaines_domaine ON public.actes_reglementaires_domaines(domaine_id);