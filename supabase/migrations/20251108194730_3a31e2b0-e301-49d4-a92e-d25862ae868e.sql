-- Add missing columns to EPI tables

-- Add missing columns to epi_articles
ALTER TABLE epi_articles
  ADD COLUMN IF NOT EXISTS code_article TEXT,
  ADD COLUMN IF NOT EXISTS marque TEXT,
  ADD COLUMN IF NOT EXISTS modele TEXT;

-- Add missing columns to epi_types
ALTER TABLE epi_types
  ADD COLUMN IF NOT EXISTS libelle TEXT,
  ADD COLUMN IF NOT EXISTS categorie TEXT;

-- Update libelle from nom for existing records
UPDATE epi_types SET libelle = nom WHERE libelle IS NULL;

-- Create articles_effets_juridiques table for article legal effects timeline
CREATE TABLE IF NOT EXISTS articles_effets_juridiques (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES textes_articles(id) ON DELETE CASCADE,
  type_effet TEXT NOT NULL CHECK (type_effet IN ('entree_vigueur', 'abrogation', 'modification', 'codification')),
  date_effet DATE NOT NULL,
  textes_articles TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE articles_effets_juridiques ENABLE ROW LEVEL SECURITY;

-- RLS policies (public read)
CREATE POLICY "ArticlesEffetsJuridiques: read"
  ON articles_effets_juridiques FOR SELECT
  USING (true);

CREATE POLICY "ArticlesEffetsJuridiques: super_admin manage"
  ON articles_effets_juridiques FOR ALL
  USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));