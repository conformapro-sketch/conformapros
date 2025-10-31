-- ============================================
-- MODULE INCIDENTS HSE
-- ============================================

-- Table principale incidents
CREATE TABLE IF NOT EXISTS public.incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_incident TEXT NOT NULL UNIQUE,
  
  -- Informations de base
  date_incident TIMESTAMP WITH TIME ZONE NOT NULL,
  heure_incident TIME,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  zone TEXT,
  batiment TEXT,
  atelier TEXT,
  
  -- Type et classification
  type_incident TEXT NOT NULL CHECK (type_incident IN (
    'accident_travail',
    'quasi_accident',
    'incident_environnemental',
    'incident_materiel',
    'incendie',
    'pollution',
    'autre'
  )),
  categorie TEXT CHECK (categorie IN (
    'securite',
    'incendie',
    'environnement',
    'hygiene',
    'materiel',
    'autre'
  )),
  gravite TEXT NOT NULL CHECK (gravite IN ('mineure', 'moyenne', 'majeure')),
  
  -- Personnes impliquées
  personne_impliquee_id UUID REFERENCES public.employes(id) ON DELETE SET NULL,
  personne_impliquee_nom TEXT,
  declarant_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  declarant_nom TEXT,
  declarant_fonction TEXT,
  
  -- Description
  description TEXT NOT NULL,
  circonstances TEXT,
  
  -- Analyse
  facteur_humain BOOLEAN DEFAULT false,
  facteur_materiel BOOLEAN DEFAULT false,
  facteur_organisationnel BOOLEAN DEFAULT false,
  facteur_environnemental BOOLEAN DEFAULT false,
  analyse_causes TEXT,
  
  -- Suivi
  responsable_suivi_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  mesures_correctives TEXT,
  statut TEXT NOT NULL DEFAULT 'en_cours' CHECK (statut IN ('en_cours', 'cloture')),
  date_cloture DATE,
  validateur_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  date_validation TIMESTAMP WITH TIME ZONE,
  
  -- Flags
  est_recurrent BOOLEAN DEFAULT false,
  arret_travail BOOLEAN DEFAULT false,
  jours_arret INTEGER,
  hospitalisation BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Table des causes racines (méthode 5 Pourquoi)
CREATE TABLE IF NOT EXISTS public.incident_causes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  niveau INTEGER NOT NULL CHECK (niveau >= 1 AND niveau <= 5),
  question TEXT NOT NULL,
  reponse TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des photos/documents
CREATE TABLE IF NOT EXISTS public.incident_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_type TEXT,
  description TEXT,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ajouter colonne incident_id à actions_correctives
ALTER TABLE public.actions_correctives 
ADD COLUMN IF NOT EXISTS incident_id UUID REFERENCES public.incidents(id) ON DELETE SET NULL;

-- Fonction pour générer numéro d'incident
CREATE OR REPLACE FUNCTION public.generate_incident_numero()
RETURNS TRIGGER AS $$
DECLARE
  year_part TEXT;
  sequence_num INTEGER;
  new_numero TEXT;
BEGIN
  IF NEW.numero_incident IS NULL OR NEW.numero_incident = '' THEN
    year_part := TO_CHAR(NEW.date_incident, 'YYYY');
    
    SELECT COALESCE(MAX(
      CAST(
        SUBSTRING(numero_incident FROM 'HSE-' || year_part || '-(\d+)') AS INTEGER
      )
    ), 0) + 1
    INTO sequence_num
    FROM public.incidents
    WHERE numero_incident LIKE 'HSE-' || year_part || '-%';
    
    new_numero := 'HSE-' || year_part || '-' || LPAD(sequence_num::TEXT, 3, '0');
    NEW.numero_incident := new_numero;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour numéro auto
CREATE TRIGGER generate_incident_numero_trigger
BEFORE INSERT ON public.incidents
FOR EACH ROW
EXECUTE FUNCTION public.generate_incident_numero();

-- Trigger pour updated_at
CREATE TRIGGER update_incidents_updated_at
BEFORE UPDATE ON public.incidents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_incidents_site ON public.incidents(site_id);
CREATE INDEX IF NOT EXISTS idx_incidents_date ON public.incidents(date_incident DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_statut ON public.incidents(statut);
CREATE INDEX IF NOT EXISTS idx_incidents_type ON public.incidents(type_incident);
CREATE INDEX IF NOT EXISTS idx_incidents_numero ON public.incidents(numero_incident);
CREATE INDEX IF NOT EXISTS idx_incident_causes_incident ON public.incident_causes(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_photos_incident ON public.incident_photos(incident_id);
CREATE INDEX IF NOT EXISTS idx_actions_correctives_incident ON public.actions_correctives(incident_id);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Incidents
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Incidents: read if site access"
ON public.incidents FOR SELECT
USING (has_site_access(auth.uid(), site_id));

CREATE POLICY "Incidents: manage if site access"
ON public.incidents FOR ALL
USING (has_site_access(auth.uid(), site_id))
WITH CHECK (has_site_access(auth.uid(), site_id));

-- Causes
ALTER TABLE public.incident_causes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "IncidentCauses: read if can access incident"
ON public.incident_causes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.incidents i
    WHERE i.id = incident_causes.incident_id
      AND has_site_access(auth.uid(), i.site_id)
  )
);

CREATE POLICY "IncidentCauses: manage if can access incident"
ON public.incident_causes FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.incidents i
    WHERE i.id = incident_causes.incident_id
      AND has_site_access(auth.uid(), i.site_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.incidents i
    WHERE i.id = incident_causes.incident_id
      AND has_site_access(auth.uid(), i.site_id)
  )
);

-- Photos
ALTER TABLE public.incident_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "IncidentPhotos: read if can access incident"
ON public.incident_photos FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.incidents i
    WHERE i.id = incident_photos.incident_id
      AND has_site_access(auth.uid(), i.site_id)
  )
);

CREATE POLICY "IncidentPhotos: manage if can access incident"
ON public.incident_photos FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.incidents i
    WHERE i.id = incident_photos.incident_id
      AND has_site_access(auth.uid(), i.site_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.incidents i
    WHERE i.id = incident_photos.incident_id
      AND has_site_access(auth.uid(), i.site_id)
  )
);