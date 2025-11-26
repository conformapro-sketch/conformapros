-- Create junction table linking code structures to articles
CREATE TABLE IF NOT EXISTS public.codes_liens_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  structure_id UUID NOT NULL REFERENCES public.codes_structures(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(structure_id, article_id)
);

-- Add indexes for performance
CREATE INDEX idx_codes_liens_articles_structure_id ON public.codes_liens_articles(structure_id);
CREATE INDEX idx_codes_liens_articles_article_id ON public.codes_liens_articles(article_id);

-- Enable RLS
ALTER TABLE public.codes_liens_articles ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow authenticated users to read, staff to manage
CREATE POLICY "CodesLiensArticles: read by authenticated"
  ON public.codes_liens_articles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "CodesLiensArticles: staff manage"
  ON public.codes_liens_articles
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'Super Admin') OR has_role(auth.uid(), 'Admin Global'))
  WITH CHECK (has_role(auth.uid(), 'Super Admin') OR has_role(auth.uid(), 'Admin Global'));

-- Add updated_at trigger to codes_juridiques if not already present
CREATE OR REPLACE FUNCTION public.update_codes_juridiques_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_codes_juridiques_updated_at ON public.codes_juridiques;
CREATE TRIGGER trigger_update_codes_juridiques_updated_at
  BEFORE UPDATE ON public.codes_juridiques
  FOR EACH ROW
  EXECUTE FUNCTION public.update_codes_juridiques_updated_at();

COMMENT ON TABLE public.codes_liens_articles IS 'Junction table linking hierarchical code structures to regulatory articles';
COMMENT ON COLUMN public.codes_liens_articles.structure_id IS 'Reference to a specific section/chapter/title in a legal code';
COMMENT ON COLUMN public.codes_liens_articles.article_id IS 'Reference to a regulatory article';