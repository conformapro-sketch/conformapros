-- Add remaining missing columns

-- Add missing columns to textes_articles
ALTER TABLE textes_articles
ADD COLUMN IF NOT EXISTS titre_court TEXT;

-- Add missing column to clients
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS nom_legal TEXT;

-- Add missing columns to plans_action
ALTER TABLE plans_action
ADD COLUMN IF NOT EXISTS manquement TEXT;

-- Create med_visites table if it doesn't exist
CREATE TABLE IF NOT EXISTS med_visites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employe_id UUID NOT NULL REFERENCES employes(id),
  date_visite DATE NOT NULL,
  type_visite TEXT,
  statut_visite TEXT DEFAULT 'planifiee',
  medecin_nom TEXT,
  medecin_organisme TEXT,
  resultat_aptitude TEXT,
  observations TEXT,
  date_prochaine_visite DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on med_visites
ALTER TABLE med_visites ENABLE ROW LEVEL SECURITY;

-- Create policies for med_visites
CREATE POLICY "MedVisites: manage if client access"
ON med_visites FOR ALL
USING (
  has_client_access(auth.uid(), (SELECT client_id FROM employes WHERE employes.id = med_visites.employe_id))
)
WITH CHECK (
  has_client_access(auth.uid(), (SELECT client_id FROM employes WHERE employes.id = med_visites.employe_id))
);

CREATE POLICY "MedVisites: read if client access"
ON med_visites FOR SELECT
USING (
  has_client_access(auth.uid(), (SELECT client_id FROM employes WHERE employes.id = med_visites.employe_id))
);