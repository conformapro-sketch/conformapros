-- ============================================
-- Module Formations HSE
-- ============================================

-- Table principale des formations
CREATE TABLE IF NOT EXISTS public.formations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL UNIQUE, -- ex: F-2025-023
  intitule TEXT NOT NULL,
  domaine TEXT NOT NULL, -- sécurité, incendie, hygiène, environnement, etc.
  type_formation TEXT NOT NULL DEFAULT 'obligatoire', -- obligatoire / interne / recyclage
  objectif TEXT,
  
  -- Formateur/Organisme
  formateur_nom TEXT,
  formateur_contact TEXT,
  formateur_email TEXT,
  organisme_formation TEXT,
  
  -- Localisation
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  lieu TEXT, -- salle, site, en ligne, etc.
  
  -- Planification
  date_prevue DATE,
  date_realisee DATE,
  duree_heures NUMERIC(5,2), -- durée en heures
  
  -- Validité et renouvellement
  validite_mois INTEGER, -- durée de validité en mois (ex: 24 pour 2 ans)
  prochaine_echeance DATE, -- calculé automatiquement
  
  -- Statut
  statut TEXT NOT NULL DEFAULT 'planifiee', -- planifiee / realisee / expiree / annulee
  
  -- Métadonnées
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des participants aux formations
CREATE TABLE IF NOT EXISTS public.formation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formation_id UUID NOT NULL REFERENCES public.formations(id) ON DELETE CASCADE,
  employe_id UUID NOT NULL REFERENCES public.employes(id) ON DELETE CASCADE,
  
  -- Présence
  present BOOLEAN DEFAULT false,
  
  -- Résultat
  reussite BOOLEAN,
  note NUMERIC(5,2),
  commentaire TEXT,
  
  -- Certificat
  certificat_url TEXT,
  certificat_numero TEXT,
  date_certificat DATE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(formation_id, employe_id)
);

-- Table des documents de formation
CREATE TABLE IF NOT EXISTS public.formation_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formation_id UUID NOT NULL REFERENCES public.formations(id) ON DELETE CASCADE,
  
  type_document TEXT NOT NULL, -- feuille_emargement / rapport / certificat_global / support_formation / autre
  titre TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_size BIGINT,
  
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_formations_site ON public.formations(site_id);
CREATE INDEX IF NOT EXISTS idx_formations_statut ON public.formations(statut);
CREATE INDEX IF NOT EXISTS idx_formations_date_realisee ON public.formations(date_realisee);
CREATE INDEX IF NOT EXISTS idx_formations_prochaine_echeance ON public.formations(prochaine_echeance);
CREATE INDEX IF NOT EXISTS idx_formation_participants_formation ON public.formation_participants(formation_id);
CREATE INDEX IF NOT EXISTS idx_formation_participants_employe ON public.formation_participants(employe_id);
CREATE INDEX IF NOT EXISTS idx_formation_documents_formation ON public.formation_documents(formation_id);

-- Trigger pour updated_at
CREATE TRIGGER update_formations_updated_at
  BEFORE UPDATE ON public.formations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_formation_participants_updated_at
  BEFORE UPDATE ON public.formation_participants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Fonction pour calculer automatiquement la prochaine échéance
CREATE OR REPLACE FUNCTION public.calculate_formation_echeance()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculer prochaine_echeance si date_realisee et validite_mois sont renseignés
  IF NEW.date_realisee IS NOT NULL AND NEW.validite_mois IS NOT NULL THEN
    NEW.prochaine_echeance := NEW.date_realisee + (NEW.validite_mois || ' months')::INTERVAL;
  END IF;
  
  -- Mettre à jour le statut automatiquement
  IF NEW.date_realisee IS NOT NULL THEN
    IF NEW.prochaine_echeance IS NOT NULL AND NEW.prochaine_echeance < CURRENT_DATE THEN
      NEW.statut := 'expiree';
    ELSIF NEW.statut = 'planifiee' THEN
      NEW.statut := 'realisee';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_formation_echeance
  BEFORE INSERT OR UPDATE ON public.formations
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_formation_echeance();

-- Fonction pour générer une référence unique
CREATE OR REPLACE FUNCTION public.generate_formation_reference()
RETURNS TRIGGER AS $$
DECLARE
  year_part TEXT;
  sequence_num INTEGER;
  new_ref TEXT;
BEGIN
  IF NEW.reference IS NULL OR NEW.reference = '' THEN
    year_part := TO_CHAR(CURRENT_DATE, 'YYYY');
    
    -- Trouver le prochain numéro de séquence pour l'année
    SELECT COALESCE(MAX(
      CAST(
        SUBSTRING(reference FROM 'F-' || year_part || '-(\d+)') AS INTEGER
      )
    ), 0) + 1
    INTO sequence_num
    FROM public.formations
    WHERE reference LIKE 'F-' || year_part || '-%';
    
    new_ref := 'F-' || year_part || '-' || LPAD(sequence_num::TEXT, 3, '0');
    NEW.reference := new_ref;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_formation_reference
  BEFORE INSERT ON public.formations
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_formation_reference();

-- RLS Policies

-- Formations
ALTER TABLE public.formations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Formations: read if site access"
ON public.formations
FOR SELECT
TO authenticated
USING (has_site_access(auth.uid(), site_id));

CREATE POLICY "Formations: manage if site access"
ON public.formations
FOR ALL
TO authenticated
USING (has_site_access(auth.uid(), site_id))
WITH CHECK (has_site_access(auth.uid(), site_id));

-- Formation participants
ALTER TABLE public.formation_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "FormationParticipants: read if site access"
ON public.formation_participants
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.formations f
    WHERE f.id = formation_participants.formation_id
    AND has_site_access(auth.uid(), f.site_id)
  )
);

CREATE POLICY "FormationParticipants: manage if site access"
ON public.formation_participants
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.formations f
    WHERE f.id = formation_participants.formation_id
    AND has_site_access(auth.uid(), f.site_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.formations f
    WHERE f.id = formation_participants.formation_id
    AND has_site_access(auth.uid(), f.site_id)
  )
);

-- Formation documents
ALTER TABLE public.formation_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "FormationDocuments: read if site access"
ON public.formation_documents
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.formations f
    WHERE f.id = formation_documents.formation_id
    AND has_site_access(auth.uid(), f.site_id)
  )
);

CREATE POLICY "FormationDocuments: manage if site access"
ON public.formation_documents
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.formations f
    WHERE f.id = formation_documents.formation_id
    AND has_site_access(auth.uid(), f.site_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.formations f
    WHERE f.id = formation_documents.formation_id
    AND has_site_access(auth.uid(), f.site_id)
  )
);

-- Commentaires
COMMENT ON TABLE public.formations IS 'Gestion des formations HSE (sécurité, incendie, hygiène, environnement)';
COMMENT ON TABLE public.formation_participants IS 'Liste des participants et résultats par formation';
COMMENT ON TABLE public.formation_documents IS 'Documents associés aux formations (certificats, feuilles d''émargement, rapports)';
