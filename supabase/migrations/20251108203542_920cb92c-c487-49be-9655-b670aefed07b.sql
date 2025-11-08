-- Add missing columns to various tables

-- Add missing columns to equipements
ALTER TABLE equipements 
ADD COLUMN IF NOT EXISTS localisation TEXT,
ADD COLUMN IF NOT EXISTS derniere_verification DATE,
ADD COLUMN IF NOT EXISTS prochaine_verification DATE,
ADD COLUMN IF NOT EXISTS observations TEXT,
ADD COLUMN IF NOT EXISTS type_equipement TEXT;

-- Add missing columns to epi_articles
ALTER TABLE epi_articles
ADD COLUMN IF NOT EXISTS observations TEXT;

-- Add missing column to sites
ALTER TABLE sites
ADD COLUMN IF NOT EXISTS code_site TEXT;

-- Add missing columns to textes_articles
ALTER TABLE textes_articles
ADD COLUMN IF NOT EXISTS numero TEXT;

-- Add missing columns to textes_reglementaires
ALTER TABLE textes_reglementaires
ADD COLUMN IF NOT EXISTS reference_officielle TEXT;

-- Add missing column to articles_effets_juridiques
ALTER TABLE articles_effets_juridiques
ADD COLUMN IF NOT EXISTS article_source_id UUID REFERENCES textes_articles(id);

-- Add missing column to actions_correctives
ALTER TABLE actions_correctives
ADD COLUMN IF NOT EXISTS conformite_id UUID;