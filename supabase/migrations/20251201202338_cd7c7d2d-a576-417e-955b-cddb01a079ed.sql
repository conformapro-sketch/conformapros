-- Create changelog_reglementaire table for tracking regulatory text changes
CREATE TABLE IF NOT EXISTS changelog_reglementaire (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  acte_id UUID REFERENCES textes_reglementaires(id) ON DELETE CASCADE,
  type_changement TEXT NOT NULL,
  date_changement TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  version TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create index for faster queries by acte_id
CREATE INDEX IF NOT EXISTS idx_changelog_reglementaire_acte_id 
ON changelog_reglementaire(acte_id);

-- Create index for ordering by date
CREATE INDEX IF NOT EXISTS idx_changelog_reglementaire_date 
ON changelog_reglementaire(date_changement DESC);

-- Enable RLS
ALTER TABLE changelog_reglementaire ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read changelog
CREATE POLICY "Changelog: authenticated users read" 
ON changelog_reglementaire FOR SELECT 
TO authenticated 
USING (true);

-- Policy: Staff can manage changelog
CREATE POLICY "Changelog: staff manage" 
ON changelog_reglementaire FOR ALL 
TO authenticated 
USING (
  has_role(auth.uid(), 'Super Admin') OR has_role(auth.uid(), 'Admin Global')
) 
WITH CHECK (
  has_role(auth.uid(), 'Super Admin') OR has_role(auth.uid(), 'Admin Global')
);