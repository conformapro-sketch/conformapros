-- Create missing tables for complete schema

-- Create actes_reglementaires table if not exists
CREATE TABLE IF NOT EXISTS actes_reglementaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_officielle TEXT NOT NULL,
  intitule TEXT NOT NULL,
  type_acte TEXT,
  date_publication DATE,
  date_entree_vigueur DATE,
  statut_vigueur TEXT DEFAULT 'en_vigueur',
  numero_jort TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE actes_reglementaires ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ActesReglementaires: read"
ON actes_reglementaires FOR SELECT
USING (true);

CREATE POLICY "ActesReglementaires: super_admin manage"
ON actes_reglementaires FOR ALL
USING (has_role(auth.uid(), 'super_admin'))
WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- Add acte_id to textes_articles
ALTER TABLE textes_articles
ADD COLUMN IF NOT EXISTS acte_id UUID REFERENCES actes_reglementaires(id);

-- Create conformite_evaluations table
CREATE TABLE IF NOT EXISTS conformite_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id),
  site_id UUID REFERENCES sites(id),
  article_id UUID REFERENCES textes_articles(id),
  date_evaluation DATE NOT NULL,
  status TEXT DEFAULT 'non_conforme',
  manquement TEXT,
  observations TEXT,
  evaluateur_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE conformite_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ConformiteEvaluations: manage if client access"
ON conformite_evaluations FOR ALL
USING (has_client_access(auth.uid(), client_id))
WITH CHECK (has_client_access(auth.uid(), client_id));

CREATE POLICY "ConformiteEvaluations: read if client access"
ON conformite_evaluations FOR SELECT
USING (has_client_access(auth.uid(), client_id));

-- Update actions_correctives foreign key for conformite_id
ALTER TABLE actions_correctives
DROP CONSTRAINT IF EXISTS actions_correctives_conformite_id_fkey;

ALTER TABLE actions_correctives
ADD CONSTRAINT actions_correctives_conformite_id_fkey
FOREIGN KEY (conformite_id) REFERENCES conformite_evaluations(id) ON DELETE SET NULL;