-- Create reglementaire_tags table
CREATE TABLE public.reglementaire_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL UNIQUE,
  couleur TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create texte_tags junction table
CREATE TABLE public.texte_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  texte_id UUID NOT NULL REFERENCES public.textes_reglementaires(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.reglementaire_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(texte_id, tag_id)
);

-- Create article_tags junction table
CREATE TABLE public.article_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.reglementaire_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(article_id, tag_id)
);

-- Enable RLS
ALTER TABLE public.reglementaire_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.texte_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reglementaire_tags
CREATE POLICY "Tags: read by authenticated" ON public.reglementaire_tags
  FOR SELECT USING (true);

CREATE POLICY "Tags: staff manage" ON public.reglementaire_tags
  FOR ALL USING (has_role(auth.uid(), 'Super Admin') OR has_role(auth.uid(), 'Admin Global'))
  WITH CHECK (has_role(auth.uid(), 'Super Admin') OR has_role(auth.uid(), 'Admin Global'));

-- RLS Policies for texte_tags
CREATE POLICY "TexteTags: read by authenticated" ON public.texte_tags
  FOR SELECT USING (true);

CREATE POLICY "TexteTags: staff manage" ON public.texte_tags
  FOR ALL USING (has_role(auth.uid(), 'Super Admin') OR has_role(auth.uid(), 'Admin Global'))
  WITH CHECK (has_role(auth.uid(), 'Super Admin') OR has_role(auth.uid(), 'Admin Global'));

-- RLS Policies for article_tags
CREATE POLICY "ArticleTags: read by authenticated" ON public.article_tags
  FOR SELECT USING (true);

CREATE POLICY "ArticleTags: staff manage" ON public.article_tags
  FOR ALL USING (has_role(auth.uid(), 'Super Admin') OR has_role(auth.uid(), 'Admin Global'))
  WITH CHECK (has_role(auth.uid(), 'Super Admin') OR has_role(auth.uid(), 'Admin Global'));

-- Create indexes for performance
CREATE INDEX idx_texte_tags_texte_id ON public.texte_tags(texte_id);
CREATE INDEX idx_texte_tags_tag_id ON public.texte_tags(tag_id);
CREATE INDEX idx_article_tags_article_id ON public.article_tags(article_id);
CREATE INDEX idx_article_tags_tag_id ON public.article_tags(tag_id);

-- Trigger to update updated_at on tags
CREATE TRIGGER update_reglementaire_tags_updated_at
  BEFORE UPDATE ON public.reglementaire_tags
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();