-- Add missing columns to match existing code expectations

-- Update clients table - add nom_legal and matricule_fiscale
ALTER TABLE public.clients 
  ADD COLUMN IF NOT EXISTS nom_legal text,
  ADD COLUMN IF NOT EXISTS matricule_fiscale text;

-- Copy nom to nom_legal for existing records
UPDATE public.clients SET nom_legal = nom WHERE nom_legal IS NULL;

-- Update sites table - add nom_site, code_site, matricule_fiscale  
ALTER TABLE public.sites
  ADD COLUMN IF NOT EXISTS nom_site text,
  ADD COLUMN IF NOT EXISTS code_site text,
  ADD COLUMN IF NOT EXISTS matricule_fiscale text;

-- Copy nom to nom_site for existing records
UPDATE public.sites SET nom_site = nom WHERE nom_site IS NULL;

-- Update employes table - add matricule and statut_emploi
ALTER TABLE public.employes
  ADD COLUMN IF NOT EXISTS matricule text,
  ADD COLUMN IF NOT EXISTS statut_emploi text DEFAULT 'actif';

-- Create medical visits tables that the code expects
CREATE TABLE IF NOT EXISTS public.med_visites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employe_id uuid NOT NULL REFERENCES public.employes(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  site_id uuid REFERENCES public.sites(id) ON DELETE SET NULL,
  type_visite text NOT NULL,
  date_planifiee date NOT NULL,
  date_realisee date,
  statut_visite text NOT NULL DEFAULT 'PLANIFIEE',
  motif text,
  medecin_travail text,
  resultat_aptitude text,
  prochaine_echeance date,
  commentaires text,
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.med_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visite_id uuid NOT NULL REFERENCES public.med_visites(id) ON DELETE CASCADE,
  type_document text NOT NULL,
  titre text NOT NULL,
  description text,
  url_document text NOT NULL,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.med_notes_confidentielles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visite_id uuid NOT NULL REFERENCES public.med_visites(id) ON DELETE CASCADE,
  contenu text NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(visite_id)
);

CREATE TABLE IF NOT EXISTS public.med_periodicite_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  libelle text NOT NULL,
  description text,
  periodicite_mois integer NOT NULL,
  actif boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.med_visites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.med_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.med_notes_confidentielles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.med_periodicite_rules ENABLE ROW LEVEL SECURITY;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_med_visites_employe_id ON public.med_visites(employe_id);
CREATE INDEX IF NOT EXISTS idx_med_visites_client_id ON public.med_visites(client_id);
CREATE INDEX IF NOT EXISTS idx_med_visites_site_id ON public.med_visites(site_id);
CREATE INDEX IF NOT EXISTS idx_med_documents_visite_id ON public.med_documents(visite_id);

-- Add RLS policies for medical tables
CREATE POLICY "MedVisites: read if client access" ON public.med_visites
FOR SELECT TO authenticated
USING (
  public.has_client_access(auth.uid(), client_id) OR
  public.has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "MedVisites: manage if client access" ON public.med_visites
FOR ALL TO authenticated
USING (
  public.has_client_access(auth.uid(), client_id) OR
  public.has_role(auth.uid(), 'super_admin')
)
WITH CHECK (
  public.has_client_access(auth.uid(), client_id) OR
  public.has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "MedDocuments: read if can access visit" ON public.med_documents
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.med_visites mv
    WHERE mv.id = visite_id
    AND (public.has_client_access(auth.uid(), mv.client_id) OR public.has_role(auth.uid(), 'super_admin'))
  )
);

CREATE POLICY "MedDocuments: manage if can access visit" ON public.med_documents
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.med_visites mv
    WHERE mv.id = visite_id
    AND (public.has_client_access(auth.uid(), mv.client_id) OR public.has_role(auth.uid(), 'super_admin'))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.med_visites mv
    WHERE mv.id = visite_id
    AND (public.has_client_access(auth.uid(), mv.client_id) OR public.has_role(auth.uid(), 'super_admin'))
  )
);

-- Medical notes are sensitive - only accessible to medical staff
CREATE POLICY "MedNotes: super_admin only" ON public.med_notes_confidentielles
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Periodicity rules readable by all authenticated users
CREATE POLICY "MedPeriodicite: read" ON public.med_periodicite_rules
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "MedPeriodicite: super_admin manage" ON public.med_periodicite_rules
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Add trigger for med_visites updated_at
CREATE TRIGGER update_med_visites_updated_at 
BEFORE UPDATE ON public.med_visites 
FOR EACH ROW 
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_med_notes_updated_at 
BEFORE UPDATE ON public.med_notes_confidentielles 
FOR EACH ROW 
EXECUTE FUNCTION public.update_updated_at_column();