-- Ajouter la colonne texte_source_id
ALTER TABLE articles_effets_juridiques 
  ADD COLUMN texte_source_id uuid REFERENCES textes_reglementaires(id) ON DELETE CASCADE;

-- Rendre article_source_id optionnel
ALTER TABLE articles_effets_juridiques 
  ALTER COLUMN article_source_id DROP NOT NULL;

-- Ajouter une contrainte : au moins texte_source_id OU article_source_id doit être fourni
ALTER TABLE articles_effets_juridiques
  ADD CONSTRAINT check_source_reference
  CHECK (
    (texte_source_id IS NOT NULL) OR 
    (article_source_id IS NOT NULL)
  );

-- Index pour optimiser les requêtes
CREATE INDEX idx_effets_texte_source ON articles_effets_juridiques(texte_source_id);

-- Peupler les données existantes avec le texte_source_id
UPDATE articles_effets_juridiques aej
SET texte_source_id = ta.texte_id
FROM textes_articles ta
WHERE aej.article_source_id = ta.id
  AND aej.texte_source_id IS NULL;