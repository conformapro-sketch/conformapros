-- Fonction pour supprimer une version d'article avec réparation automatique
CREATE OR REPLACE FUNCTION public.delete_article_version(p_version_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_version RECORD;
  v_prev RECORD;
BEGIN
  -- Récupérer la version cible
  SELECT * INTO v_version
  FROM article_versions
  WHERE id = p_version_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Version introuvable';
  END IF;

  -- Soft delete de la version
  UPDATE article_versions
  SET deleted_at = now()
  WHERE id = p_version_id;

  -- Si la version supprimée est active (effective_to IS NULL)
  IF v_version.effective_to IS NULL THEN
    -- Chercher la version précédente non supprimée
    SELECT *
    INTO v_prev
    FROM article_versions
    WHERE article_id = v_version.article_id
      AND deleted_at IS NULL
      AND id <> p_version_id
      AND (
        (effective_from IS NOT NULL AND effective_from < COALESCE(v_version.effective_from, v_version.date_version::date))
        OR (effective_from IS NULL AND date_version::date < COALESCE(v_version.effective_from, v_version.date_version::date))
      )
    ORDER BY 
      COALESCE(effective_from, date_version::date) DESC
    LIMIT 1;

    IF FOUND THEN
      -- Réactiver la version précédente
      UPDATE article_versions
      SET effective_to = NULL
      WHERE id = v_prev.id;

      -- Mettre à jour le contenu courant de l'article
      UPDATE textes_articles
      SET contenu = v_prev.contenu, updated_at = now()
      WHERE id = v_version.article_id;
    END IF;
  END IF;
END;
$$;