-- Add missing columns to textes_reglementaires
ALTER TABLE public.textes_reglementaires ADD COLUMN IF NOT EXISTS statut_vigueur TEXT DEFAULT 'en_vigueur';
ALTER TABLE public.textes_reglementaires ADD COLUMN IF NOT EXISTS reference_officielle TEXT;

-- Add missing columns to textes_articles  
ALTER TABLE public.textes_articles ADD COLUMN IF NOT EXISTS titre_court TEXT;

-- Create equipements_controle table (for technical controls)
CREATE TABLE IF NOT EXISTS public.equipements_controle (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipement_id UUID NOT NULL REFERENCES public.equipements(id) ON DELETE CASCADE,
  date_controle DATE NOT NULL,
  type_controle TEXT NOT NULL,
  organisme_controleur TEXT,
  resultat TEXT,
  observations TEXT,
  prochain_controle DATE,
  document_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.equipements_controle ENABLE ROW LEVEL SECURITY;

-- RLS policies for equipements_controle
CREATE POLICY "EquipementsControle: read if site access" ON public.equipements_controle
  FOR SELECT USING (
    has_site_access(auth.uid(), (SELECT site_id FROM public.equipements WHERE id = equipements_controle.equipement_id))
  );

CREATE POLICY "EquipementsControle: manage if site access" ON public.equipements_controle
  FOR ALL USING (
    has_site_access(auth.uid(), (SELECT site_id FROM public.equipements WHERE id = equipements_controle.equipement_id))
  ) WITH CHECK (
    has_site_access(auth.uid(), (SELECT site_id FROM public.equipements WHERE id = equipements_controle.equipement_id))
  );

-- Trigger
CREATE TRIGGER update_equipements_controle_updated_at
  BEFORE UPDATE ON public.equipements_controle
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();