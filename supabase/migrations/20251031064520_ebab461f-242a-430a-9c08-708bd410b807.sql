-- Create view to alias domaines_reglementaires as domaines_application for backward compatibility
CREATE OR REPLACE VIEW public.domaines_application AS
SELECT * FROM public.domaines_reglementaires;

-- Add more missing columns to med_visites
ALTER TABLE public.med_visites
  ADD COLUMN IF NOT EXISTS restrictions text,
  ADD COLUMN IF NOT EXISTS validite_jusqua date,
  ADD COLUMN IF NOT EXISTS medecin_nom text,
  ADD COLUMN IF NOT EXISTS medecin_organisme text,
  ADD COLUMN IF NOT EXISTS sms_flags jsonb;

-- Add more columns to med_notes_confidentielles
ALTER TABLE public.med_notes_confidentielles
  ADD COLUMN IF NOT EXISTS observations text,
  ADD COLUMN IF NOT EXISTS examens_realises text,
  ADD COLUMN IF NOT EXISTS contre_indications text,
  ADD COLUMN IF NOT EXISTS propositions_amenagement text;

-- Add columns to med_documents
ALTER TABLE public.med_documents
  ADD COLUMN IF NOT EXISTS file_name text,
  ADD COLUMN IF NOT EXISTS type_doc text;

-- Copy type_document to type_doc
UPDATE public.med_documents SET type_doc = type_document WHERE type_doc IS NULL;

-- Add columns to clients table
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS statut text DEFAULT 'actif';

-- Add columns to sites table
ALTER TABLE public.sites
  ADD COLUMN IF NOT EXISTS gouvernorat text,
  ADD COLUMN IF NOT EXISTS classification text,
  ADD COLUMN IF NOT EXISTS effectif integer;

-- Copy nombre_employes to effectif
UPDATE public.sites SET effectif = nombre_employes WHERE effectif IS NULL;

-- Add periodicite_mois column to med_periodicite_rules if not exists (already created in previous migration)
-- This is for the EquipementFormModal which queries different tables

-- Create tables for equipements if they're needed
CREATE TABLE IF NOT EXISTS public.equipements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  nom text NOT NULL,
  type_equipement text NOT NULL,
  marque text,
  modele text,
  numero_serie text,
  date_mise_service date,
  periodicite_mois integer,
  derniere_verification date,
  prochaine_verification date,
  statut text DEFAULT 'en_service',
  localisation text,
  observations text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on equipements
ALTER TABLE public.equipements ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for equipements
CREATE POLICY "Equipements: read if site access" ON public.equipements
FOR SELECT TO authenticated
USING (public.has_site_access(auth.uid(), site_id));

CREATE POLICY "Equipements: manage if site access" ON public.equipements
FOR ALL TO authenticated
USING (public.has_site_access(auth.uid(), site_id))
WITH CHECK (public.has_site_access(auth.uid(), site_id));

-- Add trigger
CREATE TRIGGER update_equipements_updated_at 
BEFORE UPDATE ON public.equipements 
FOR EACH ROW 
EXECUTE FUNCTION public.update_updated_at_column();