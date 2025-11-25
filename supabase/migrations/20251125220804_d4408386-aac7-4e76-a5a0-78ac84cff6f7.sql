-- Contrainte logique : garantir qu'un article ne peut avoir qu'une seule version avec statut = en_vigueur
-- Objectif : maintenir une version active unique par article

-- Index partiel unique : un seul statut 'en_vigueur' par article_id
CREATE UNIQUE INDEX idx_article_versions_unique_en_vigueur 
  ON article_versions(article_id) 
  WHERE statut = 'en_vigueur';

-- Commentaire pour documentation
COMMENT ON INDEX idx_article_versions_unique_en_vigueur IS 'Garantit qu''un article ne peut avoir qu''une seule version avec statut = en_vigueur à la fois';