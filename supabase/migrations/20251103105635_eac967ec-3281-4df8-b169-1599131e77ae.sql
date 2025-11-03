-- Phase 1: Grant INSERT permissions for authenticated users on articles_effets_juridiques
CREATE POLICY "EffetsJuridiques: authenticated can insert"
ON articles_effets_juridiques
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Phase 2: Verify and add foreign key constraints if missing
-- Clean up any invalid data first
DELETE FROM articles_effets_juridiques
WHERE texte_source_id IS NOT NULL 
  AND texte_source_id NOT IN (SELECT id FROM actes_reglementaires);

DELETE FROM articles_effets_juridiques
WHERE texte_cible_id IS NOT NULL 
  AND texte_cible_id NOT IN (SELECT id FROM actes_reglementaires);

DELETE FROM articles_effets_juridiques
WHERE article_source_id IS NOT NULL 
  AND article_source_id NOT IN (SELECT id FROM textes_articles);

DELETE FROM articles_effets_juridiques
WHERE article_cible_id IS NOT NULL 
  AND article_cible_id NOT IN (SELECT id FROM textes_articles);

-- Add foreign key constraints (will fail if they already exist, which is fine)
DO $$ 
BEGIN
  -- Add constraint for texte_source_id
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_texte_source'
  ) THEN
    ALTER TABLE articles_effets_juridiques
      ADD CONSTRAINT fk_texte_source
      FOREIGN KEY (texte_source_id) 
      REFERENCES actes_reglementaires(id) 
      ON DELETE CASCADE;
  END IF;

  -- Add constraint for texte_cible_id
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_texte_cible'
  ) THEN
    ALTER TABLE articles_effets_juridiques
      ADD CONSTRAINT fk_texte_cible
      FOREIGN KEY (texte_cible_id) 
      REFERENCES actes_reglementaires(id) 
      ON DELETE CASCADE;
  END IF;

  -- Add constraint for article_source_id
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_article_source'
  ) THEN
    ALTER TABLE articles_effets_juridiques
      ADD CONSTRAINT fk_article_source
      FOREIGN KEY (article_source_id) 
      REFERENCES textes_articles(id) 
      ON DELETE CASCADE;
  END IF;

  -- Add constraint for article_cible_id
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_article_cible'
  ) THEN
    ALTER TABLE articles_effets_juridiques
      ADD CONSTRAINT fk_article_cible
      FOREIGN KEY (article_cible_id) 
      REFERENCES textes_articles(id) 
      ON DELETE CASCADE;
  END IF;
END $$;