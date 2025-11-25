-- Index pour améliorer la vitesse de recherche et de filtrage
-- Objectif : optimiser les requêtes sur les tables principales

-- Index sur textes_reglementaires.type (pour filtrer par type de texte)
CREATE INDEX IF NOT EXISTS idx_textes_reglementaires_type 
  ON textes_reglementaires(type);

-- Index sur codes_domaines.domaine_id (pour filtrer les codes par domaine)
CREATE INDEX IF NOT EXISTS idx_codes_domaines_domaine_id 
  ON codes_domaines(domaine_id);

-- Commentaires pour documentation
COMMENT ON INDEX idx_textes_reglementaires_type IS 'Optimise le filtrage des textes réglementaires par type (loi, décret, arrêté, etc.)';
COMMENT ON INDEX idx_codes_domaines_domaine_id IS 'Optimise la recherche des codes juridiques par domaine réglementaire';

-- Note : Les autres index demandés existent déjà :
-- - articles.texte_id : idx_articles_texte_id
-- - article_versions.article_id : idx_article_versions_article_id
-- - article_versions.statut : idx_article_versions_statut
-- - article_versions.date_effet : idx_article_versions_date_effet
-- - articles.numero : idx_articles_numero