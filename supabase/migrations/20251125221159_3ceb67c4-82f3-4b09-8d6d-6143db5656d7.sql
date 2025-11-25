-- Vue SQL : versions actives des articles
-- Objectif : simplifier le chargement de la version en vigueur côté Bibliothèque et Veille
-- Retourne pour chaque article sa version active (statut = en_vigueur)

CREATE OR REPLACE VIEW v_articles_versions_actives AS
SELECT 
  a.id as article_id,
  av.id as version_id,
  av.contenu,
  av.date_effet,
  av.source_texte_id,
  av.numero_version,
  av.notes_modifications,
  -- Informations complémentaires de l'article pour faciliter les requêtes
  a.texte_id,
  a.numero as article_numero,
  a.titre as article_titre,
  a.resume as article_resume,
  a.est_introductif,
  a.porte_exigence,
  -- Informations du texte source pour traçabilité
  tr.reference as source_reference,
  tr.titre as source_titre,
  tr.type as source_type,
  av.created_at,
  av.created_by
FROM articles a
INNER JOIN article_versions av ON av.article_id = a.id
LEFT JOIN textes_reglementaires tr ON tr.id = av.source_texte_id
WHERE av.statut = 'en_vigueur';

-- Index sur la vue matérialisée (si besoin de performances accrues)
-- Note: Cette vue est simple et rapide, une vue matérialisée n'est pas nécessaire pour l'instant

-- Commentaire pour documentation
COMMENT ON VIEW v_articles_versions_actives IS 'Vue retournant pour chaque article sa version active (statut = en_vigueur) avec contenu, date d''effet, source, et métadonnées de l''article. Simplifie les requêtes dans Bibliothèque et Veille.';