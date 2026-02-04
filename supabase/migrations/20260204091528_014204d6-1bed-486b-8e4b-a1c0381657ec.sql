-- Enhanced delete_texte_cascade function to handle ALL foreign key references
-- including article_versions.source_texte_id (versions that reference this texte as source)

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
    DELETE FROM codes_liens_articles 
      WHERE article_id = ANY(v_article_ids);
    DELETE FROM article_versions WHERE article_id = ANY(v_article_ids);
    DELETE FROM articles WHERE id = ANY(v_article_ids);
  END IF;
  
  -- CRITICAL: Handle article_versions that reference this texte as source_texte_id
  -- This affects versions of OTHER articles that cite this texte as their source
  -- Set source_texte_id to NULL for these orphaned references
  UPDATE article_versions 
  SET source_texte_id = NULL 
  WHERE source_texte_id = p_texte_id;
  
  -- Delete texte junction tables
  DELETE FROM textes_domaines WHERE texte_id = p_texte_id;
  DELETE FROM textes_sous_domaines WHERE texte_id = p_texte_id;
  DELETE FROM texte_tags WHERE texte_id = p_texte_id;
  DELETE FROM textes_codes WHERE texte_id = p_texte_id;
  DELETE FROM changelog_reglementaire WHERE acte_id = p_texte_id;
  
  -- Delete legacy textes_articles entries
  DELETE FROM textes_articles WHERE texte_id = p_texte_id;
  
  -- Finally delete the texte
  DELETE FROM textes_reglementaires WHERE id = p_texte_id;
  
  -- Reset flag (auto-resets at transaction end anyway)
  PERFORM set_config('app.cascade_delete', 'false', true);
END;
$$;

-- Ensure authenticated users can execute this function
GRANT EXECUTE ON FUNCTION delete_texte_cascade(UUID) TO authenticated;