-- Add foreign key from article_versions.created_by to profiles(id)
ALTER TABLE article_versions
ADD CONSTRAINT article_versions_created_by_profiles_fkey 
FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;

-- Fix articles_effets_juridiques to point to articles instead of textes_articles
ALTER TABLE articles_effets_juridiques 
DROP CONSTRAINT IF EXISTS articles_effets_juridiques_article_id_fkey;

ALTER TABLE articles_effets_juridiques
ADD CONSTRAINT articles_effets_juridiques_article_id_fkey 
FOREIGN KEY (article_id) REFERENCES textes_articles(id) ON DELETE CASCADE;

-- Fix articles_sous_domaines to point to articles instead of textes_articles (if needed)
-- Check if constraint exists and points to wrong table
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'articles_sous_domaines_article_id_fkey'
    AND conrelid = 'articles_sous_domaines'::regclass
  ) THEN
    ALTER TABLE articles_sous_domaines
    DROP CONSTRAINT articles_sous_domaines_article_id_fkey;
    
    ALTER TABLE articles_sous_domaines
    ADD CONSTRAINT articles_sous_domaines_article_id_fkey
    FOREIGN KEY (article_id) REFERENCES textes_articles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Note: We're keeping textes_articles for now as it may contain data
-- If confirmed empty and unused, we can drop it in a future migration