-- Drop unused justification columns from site_article_status
ALTER TABLE public.site_article_status 
  DROP COLUMN IF EXISTS motif_non_applicable,
  DROP COLUMN IF EXISTS commentaire_non_applicable;