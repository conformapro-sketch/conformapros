-- Create cascade delete function for articles
CREATE OR REPLACE FUNCTION delete_article_cascade(p_article_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Enable cascade delete bypass for trigger validation
  PERFORM set_config('app.cascade_delete', 'true', true);
  
  -- Delete article junction tables
  DELETE FROM article_sous_domaines WHERE article_id = p_article_id;
  DELETE FROM article_tags WHERE article_id = p_article_id;
  DELETE FROM codes_liens_articles WHERE article_id = p_article_id;
  
  -- Delete all versions of this article
  DELETE FROM article_versions WHERE article_id = p_article_id;
  
  -- Delete the article itself
  DELETE FROM articles WHERE id = p_article_id;
  
  -- Reset cascade delete flag
  PERFORM set_config('app.cascade_delete', 'false', true);
END;
$$;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION delete_article_cascade(UUID) TO authenticated;