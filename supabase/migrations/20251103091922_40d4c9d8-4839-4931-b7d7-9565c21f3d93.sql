-- Phase 3: Migration pour gérer les versions orphelines (CORRIGÉE)
-- Identifier et marquer les versions créées manuellement sans effet juridique associé

-- Ajouter une colonne pour identifier les versions orphelines
ALTER TABLE article_versions 
ADD COLUMN IF NOT EXISTS is_manual_correction BOOLEAN DEFAULT FALSE;

-- Créer une vue pour identifier les versions orphelines
CREATE OR REPLACE VIEW v_orphan_article_versions AS
SELECT 
  av.id,
  av.article_id,
  av.version_numero,
  av.date_version,
  av.raison_modification,
  ta.numero_article,
  tr.reference_officielle,
  tr.titre AS texte_titre
FROM article_versions av
JOIN textes_articles ta ON ta.id = av.article_id
JOIN textes_reglementaires tr ON tr.id = ta.texte_id
LEFT JOIN articles_effets_juridiques aej 
  ON aej.article_cible_id = av.article_id 
  AND aej.date_effet = av.date_version
WHERE aej.id IS NULL
  AND av.raison_modification IS NOT NULL;

COMMENT ON VIEW v_orphan_article_versions IS 
'Vue pour identifier les versions d''articles créées manuellement sans effet juridique associé';

-- Fonction pour marquer les versions orphelines
CREATE OR REPLACE FUNCTION mark_orphan_versions()
RETURNS TABLE(marked_count INTEGER) AS $$
DECLARE
  count_marked INTEGER;
BEGIN
  UPDATE article_versions av
  SET 
    is_manual_correction = TRUE,
    raison_modification = COALESCE(raison_modification, '') || 
      CASE 
        WHEN raison_modification IS NULL OR raison_modification = '' THEN '[Version manuelle - À vérifier]'
        ELSE ' [Version manuelle - À vérifier]'
      END
  FROM v_orphan_article_versions vov
  WHERE av.id = vov.id
    AND av.is_manual_correction = FALSE;
  
  GET DIAGNOSTICS count_marked = ROW_COUNT;
  RETURN QUERY SELECT count_marked;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION mark_orphan_versions() IS 
'Marque les versions orphelines comme corrections manuelles pour traçabilité';