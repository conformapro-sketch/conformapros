-- Add missing columns to incidents table for full incident tracking

ALTER TABLE incidents
  ADD COLUMN IF NOT EXISTS numero_incident TEXT,
  ADD COLUMN IF NOT EXISTS heure_incident TIME,
  ADD COLUMN IF NOT EXISTS zone TEXT,
  ADD COLUMN IF NOT EXISTS batiment TEXT,
  ADD COLUMN IF NOT EXISTS atelier TEXT,
  ADD COLUMN IF NOT EXISTS personne_impliquee_id UUID REFERENCES employes(id),
  ADD COLUMN IF NOT EXISTS personne_impliquee_nom TEXT,
  ADD COLUMN IF NOT EXISTS declarant_id UUID REFERENCES employes(id),
  ADD COLUMN IF NOT EXISTS declarant_nom TEXT,
  ADD COLUMN IF NOT EXISTS declarant_fonction TEXT,
  ADD COLUMN IF NOT EXISTS circonstances TEXT,
  ADD COLUMN IF NOT EXISTS facteur_humain BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS facteur_materiel BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS facteur_organisationnel BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS facteur_environnemental BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS analyse_causes TEXT,
  ADD COLUMN IF NOT EXISTS responsable_suivi_id UUID REFERENCES employes(id),
  ADD COLUMN IF NOT EXISTS mesures_correctives TEXT,
  ADD COLUMN IF NOT EXISTS date_cloture DATE,
  ADD COLUMN IF NOT EXISTS validateur_id UUID,
  ADD COLUMN IF NOT EXISTS date_validation DATE,
  ADD COLUMN IF NOT EXISTS est_recurrent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS arret_travail BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS jours_arret INTEGER,
  ADD COLUMN IF NOT EXISTS hospitalisation BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_by UUID,
  ADD COLUMN IF NOT EXISTS type_incident TEXT,
  ADD COLUMN IF NOT EXISTS categorie TEXT;

-- Generate numero_incident for existing records using a CTE
WITH numbered AS (
  SELECT id, 'INC-' || EXTRACT(YEAR FROM date_incident) || '-' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::TEXT, 4, '0') AS num
  FROM incidents
  WHERE numero_incident IS NULL
)
UPDATE incidents 
SET numero_incident = numbered.num
FROM numbered
WHERE incidents.id = numbered.id;