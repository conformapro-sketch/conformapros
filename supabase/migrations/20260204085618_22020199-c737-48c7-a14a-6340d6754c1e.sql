-- 1. Update trigger function to respect cascade delete flag
CREATE OR REPLACE FUNCTION prevent_last_version_deletion()
RETURNS TRIGGER AS $$
DECLARE
  version_count INTEGER;
BEGIN
  -- Skip validation during cascade delete operations
  IF current_setting('app.cascade_delete', true) = 'true' THEN
    RETURN OLD;
  END IF;

  SELECT COUNT(*) INTO version_count
  FROM article_versions
  WHERE article_id = OLD.article_id;
  
  IF version_count = 1 THEN
    RAISE EXCEPTION 'Impossible de supprimer la dernière version d''un article. Un article doit avoir au moins une version.';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 2. Update trigger function to respect cascade delete flag  
CREATE OR REPLACE FUNCTION prevent_article_deletion_with_versions()
RETURNS TRIGGER AS $$
BEGIN
  -- Skip validation during cascade delete operations
  IF current_setting('app.cascade_delete', true) = 'true' THEN
    RETURN OLD;
  END IF;

  IF EXISTS (
    SELECT 1 FROM article_versions 
    WHERE article_id = OLD.id
  ) THEN
    RAISE EXCEPTION 'Impossible de supprimer cet article car il possède des versions. Supprimez d''abord toutes les versions.';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 3. Create the cascade delete RPC function
CREATE OR REPLACE FUNCTION delete_texte_cascade(p_texte_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_article_ids UUID[];
BEGIN
  -- Enable cascade delete mode (transaction-local)
  PERFORM set_config('app.cascade_delete', 'true', true);
  
  -- Get all article IDs for this texte
  SELECT ARRAY_AGG(id) INTO v_article_ids
  FROM articles WHERE texte_id = p_texte_id;
  
  IF v_article_ids IS NOT NULL AND array_length(v_article_ids, 1) > 0 THEN
    -- Delete article dependencies first
    DELETE FROM article_sous_domaines WHERE article_id = ANY(v_article_ids);
    DELETE FROM article_tags WHERE article_id = ANY(v_article_ids);
    DELETE FROM article_versions WHERE article_id = ANY(v_article_ids);
    DELETE FROM articles WHERE id = ANY(v_article_ids);
  END IF;
  
  -- Delete texte junction tables
  DELETE FROM textes_domaines WHERE texte_id = p_texte_id;
  DELETE FROM textes_sous_domaines WHERE texte_id = p_texte_id;
  DELETE FROM texte_tags WHERE texte_id = p_texte_id;
  DELETE FROM textes_codes WHERE texte_id = p_texte_id;
  DELETE FROM changelog_reglementaire WHERE acte_id = p_texte_id;
  DELETE FROM textes_articles WHERE texte_id = p_texte_id;
  
  -- Finally delete the texte
  DELETE FROM textes_reglementaires WHERE id = p_texte_id;
  
  -- Reset flag (auto-resets at transaction end anyway)
  PERFORM set_config('app.cascade_delete', 'false', true);
END;
$$;

-- 4. Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_texte_cascade(UUID) TO authenticated;