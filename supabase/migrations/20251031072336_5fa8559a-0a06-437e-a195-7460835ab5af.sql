-- Create remaining reference/lookup tables for the app

-- Types of equipment (for equipment controls)
CREATE TABLE IF NOT EXISTS public.types_equipement (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  libelle TEXT NOT NULL,
  periodicite_mois INTEGER,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Control organizations
CREATE TABLE IF NOT EXISTS public.organismes_controle (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom TEXT NOT NULL,
  agrement TEXT,
  telephone TEXT,
  email TEXT,
  adresse TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Equipment control history (alias/view)
CREATE OR REPLACE VIEW public.historique_controles AS
SELECT * FROM public.equipements_controle;

-- Add column to conformite for missing fields
ALTER TABLE public.conformite ADD COLUMN IF NOT EXISTS derniere_mise_a_jour TIMESTAMP WITH TIME ZONE DEFAULT now();
ALTER TABLE public.conformite ADD COLUMN IF NOT EXISTS mise_a_jour_par UUID;
ALTER TABLE public.conformite ADD COLUMN IF NOT EXISTS score INTEGER;

-- Add column to applicabilite for missing fields
ALTER TABLE public.applicabilite ADD COLUMN IF NOT EXISTS activite TEXT;
ALTER TABLE public.applicabilite ADD COLUMN IF NOT EXISTS applicable TEXT DEFAULT 'obligatoire';

-- Enable RLS on new tables
ALTER TABLE public.types_equipement ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organismes_controle ENABLE ROW LEVEL SECURITY;

-- RLS policies - allow read for all authenticated users
CREATE POLICY "TypesEquipement: read" ON public.types_equipement
  FOR SELECT USING (true);

CREATE POLICY "TypesEquipement: super_admin manage" ON public.types_equipement
  FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "OrganismesControle: read" ON public.organismes_controle
  FOR SELECT USING (true);

CREATE POLICY "OrganismesControle: super_admin manage" ON public.organismes_controle
  FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));