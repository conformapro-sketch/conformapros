-- Create conformite table (for tracking conformity status)
CREATE TABLE IF NOT EXISTS public.conformite (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  applicabilite_id UUID NOT NULL REFERENCES public.applicabilite(id) ON DELETE CASCADE,
  etat TEXT NOT NULL DEFAULT 'en_attente',
  score_conformite INTEGER,
  commentaire TEXT,
  evaluateur_id UUID,
  date_evaluation DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create preuves table (for evidence documents)
CREATE TABLE IF NOT EXISTS public.preuves (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conformite_id UUID NOT NULL REFERENCES public.conformite(id) ON DELETE CASCADE,
  titre TEXT NOT NULL,
  type_document TEXT,
  url_document TEXT NOT NULL,
  date_document DATE,
  description TEXT,
  uploaded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create actions_correctives table
CREATE TABLE IF NOT EXISTS public.actions_correctives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conformite_id UUID NOT NULL REFERENCES public.conformite(id) ON DELETE CASCADE,
  titre TEXT NOT NULL,
  description TEXT,
  manquement TEXT,
  statut TEXT NOT NULL DEFAULT 'a_faire',
  priorite TEXT NOT NULL DEFAULT 'moyenne',
  responsable_id UUID,
  date_echeance DATE,
  cout_estime NUMERIC,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add missing columns to applicabilite
ALTER TABLE public.applicabilite ADD COLUMN IF NOT EXISTS justification TEXT;

-- Add missing columns to textes_reglementaires  
ALTER TABLE public.textes_reglementaires ADD COLUMN IF NOT EXISTS type TEXT;

-- Add missing columns to textes_articles
ALTER TABLE public.textes_articles ADD COLUMN IF NOT EXISTS numero TEXT;

-- Enable RLS
ALTER TABLE public.conformite ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preuves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actions_correctives ENABLE ROW LEVEL SECURITY;

-- RLS policies for conformite
CREATE POLICY "Conformite: read if site access" ON public.conformite
  FOR SELECT USING (
    has_site_access(auth.uid(), (SELECT site_id FROM public.applicabilite WHERE id = conformite.applicabilite_id))
  );

CREATE POLICY "Conformite: manage if site access" ON public.conformite
  FOR ALL USING (
    has_site_access(auth.uid(), (SELECT site_id FROM public.applicabilite WHERE id = conformite.applicabilite_id))
  ) WITH CHECK (
    has_site_access(auth.uid(), (SELECT site_id FROM public.applicabilite WHERE id = conformite.applicabilite_id))
  );

-- RLS policies for preuves
CREATE POLICY "Preuves: read if site access" ON public.preuves
  FOR SELECT USING (
    has_site_access(auth.uid(), (
      SELECT a.site_id FROM public.applicabilite a
      JOIN public.conformite c ON c.applicabilite_id = a.id
      WHERE c.id = preuves.conformite_id
    ))
  );

CREATE POLICY "Preuves: manage if site access" ON public.preuves
  FOR ALL USING (
    has_site_access(auth.uid(), (
      SELECT a.site_id FROM public.applicabilite a
      JOIN public.conformite c ON c.applicabilite_id = a.id
      WHERE c.id = preuves.conformite_id
    ))
  ) WITH CHECK (
    has_site_access(auth.uid(), (
      SELECT a.site_id FROM public.applicabilite a
      JOIN public.conformite c ON c.applicabilite_id = a.id
      WHERE c.id = preuves.conformite_id
    ))
  );

-- RLS policies for actions_correctives
CREATE POLICY "ActionsCorrectives: read if site access" ON public.actions_correctives
  FOR SELECT USING (
    has_site_access(auth.uid(), (
      SELECT a.site_id FROM public.applicabilite a
      JOIN public.conformite c ON c.applicabilite_id = a.id
      WHERE c.id = actions_correctives.conformite_id
    ))
  );

CREATE POLICY "ActionsCorrectives: manage if site access" ON public.actions_correctives
  FOR ALL USING (
    has_site_access(auth.uid(), (
      SELECT a.site_id FROM public.applicabilite a
      JOIN public.conformite c ON c.applicabilite_id = a.id
      WHERE c.id = actions_correctives.conformite_id
    ))
  ) WITH CHECK (
    has_site_access(auth.uid(), (
      SELECT a.site_id FROM public.applicabilite a
      JOIN public.conformite c ON c.applicabilite_id = a.id
      WHERE c.id = actions_correctives.conformite_id
    ))
  );

-- Triggers
CREATE TRIGGER update_conformite_updated_at
  BEFORE UPDATE ON public.conformite
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_actions_correctives_updated_at
  BEFORE UPDATE ON public.actions_correctives
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();