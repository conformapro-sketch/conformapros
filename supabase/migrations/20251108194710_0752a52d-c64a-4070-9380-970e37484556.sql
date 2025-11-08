-- Create missing incident-related tables

-- 1. incident_causes table (for root cause analysis)
CREATE TABLE IF NOT EXISTS incident_causes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  niveau INTEGER NOT NULL,
  question TEXT NOT NULL,
  reponse TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE incident_causes ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "IncidentCauses: read if client access"
  ON incident_causes FOR SELECT
  USING (
    has_client_access(auth.uid(), (
      SELECT client_id FROM incidents WHERE id = incident_causes.incident_id
    ))
  );

CREATE POLICY "IncidentCauses: manage if client access"
  ON incident_causes FOR ALL
  USING (
    has_client_access(auth.uid(), (
      SELECT client_id FROM incidents WHERE id = incident_causes.incident_id
    ))
  )
  WITH CHECK (
    has_client_access(auth.uid(), (
      SELECT client_id FROM incidents WHERE id = incident_causes.incident_id
    ))
  );

-- 2. incident_photos table
CREATE TABLE IF NOT EXISTS incident_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_type TEXT,
  description TEXT,
  uploaded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE incident_photos ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "IncidentPhotos: read if client access"
  ON incident_photos FOR SELECT
  USING (
    has_client_access(auth.uid(), (
      SELECT client_id FROM incidents WHERE id = incident_photos.incident_id
    ))
  );

CREATE POLICY "IncidentPhotos: manage if client access"
  ON incident_photos FOR ALL
  USING (
    has_client_access(auth.uid(), (
      SELECT client_id FROM incidents WHERE id = incident_photos.incident_id
    ))
  )
  WITH CHECK (
    has_client_access(auth.uid(), (
      SELECT client_id FROM incidents WHERE id = incident_photos.incident_id
    ))
  );

-- 3. incident_history table (for audit trail)
CREATE TABLE IF NOT EXISTS incident_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  modified_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE incident_history ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "IncidentHistory: read if client access"
  ON incident_history FOR SELECT
  USING (
    has_client_access(auth.uid(), (
      SELECT client_id FROM incidents WHERE id = incident_history.incident_id
    ))
  );

CREATE POLICY "IncidentHistory: insert if client access"
  ON incident_history FOR INSERT
  WITH CHECK (
    has_client_access(auth.uid(), (
      SELECT client_id FROM incidents WHERE id = incident_history.incident_id
    ))
  );

-- 4. actions_correctives table (for corrective actions from incidents)
CREATE TABLE IF NOT EXISTS actions_correctives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
  titre TEXT NOT NULL,
  description TEXT,
  priorite TEXT DEFAULT 'moyenne',
  statut TEXT DEFAULT 'a_faire',
  date_echeance DATE,
  responsable_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE actions_correctives ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "ActionsCorrectiv: read if client access"
  ON actions_correctives FOR SELECT
  USING (
    has_client_access(auth.uid(), (
      SELECT client_id FROM incidents WHERE id = actions_correctives.incident_id
    ))
  );

CREATE POLICY "ActionsCorrectiv: manage if client access"
  ON actions_correctives FOR ALL
  USING (
    has_client_access(auth.uid(), (
      SELECT client_id FROM incidents WHERE id = actions_correctives.incident_id
    ))
  )
  WITH CHECK (
    has_client_access(auth.uid(), (
      SELECT client_id FROM incidents WHERE id = actions_correctives.incident_id
    ))
  );

-- Trigger for actions_correctives updated_at
CREATE TRIGGER update_actions_correctives_updated_at
  BEFORE UPDATE ON actions_correctives
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();