-- Ajouter la colonne resume à la table textes_articles
ALTER TABLE textes_articles
ADD COLUMN IF NOT EXISTS resume TEXT;

COMMENT ON COLUMN textes_articles.resume IS 'Résumé explicatif court de l''article pour faciliter la recherche et l''aperçu';