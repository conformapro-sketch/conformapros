-- Supprimer l'ancienne vue si elle existe
DROP VIEW IF EXISTS v_articles_versions_actives CASCADE;

-- Créer la nouvelle vue avec toutes les colonnes utiles
CREATE VIEW v_articles_versions_actives AS
SELECT 
  av.article_id,
  av.id AS version_id,
  av.contenu,
  av.date_effet,
  av.source_texte_id,
  av.numero_version,
  av.notes_modifications,
  av.created_at AS version_created_at,
  a.numero AS article_numero,
  a.titre AS article_titre,
  a.porte_exigence,
  a.est_introductif,
  a.texte_id
FROM article_versions av
INNER JOIN articles a ON a.id = av.article_id
WHERE av.statut = 'en_vigueur';

COMMENT ON VIEW v_articles_versions_actives IS 
'Vue optimisée retournant uniquement les versions en vigueur de chaque article avec leurs métadonnées associées. Utilisée par les modules Bibliothèque et Veille pour charger rapidement le contenu actif.';

-- Grant permissions
GRANT SELECT ON v_articles_versions_actives TO authenticated;
GRANT SELECT ON v_articles_versions_actives TO anon;