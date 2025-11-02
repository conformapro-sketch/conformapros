-- Ajouter le champ indicatif dans la table textes_articles
ALTER TABLE textes_articles 
ADD COLUMN indicatif BOOLEAN NOT NULL DEFAULT false;

-- Ajouter un commentaire pour documenter le champ
COMMENT ON COLUMN textes_articles.indicatif IS 
'Indique si l''article est à titre indicatif (définition, explicatif, descriptif, introductif) plutôt qu''un article imposant des obligations applicables';