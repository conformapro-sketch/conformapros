-- Phase 1: Add deleted_at column to textes_reglementaires
ALTER TABLE textes_reglementaires 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Phase 2: Create index for soft-delete optimization
CREATE INDEX IF NOT EXISTS idx_textes_reglementaires_deleted_at 
ON textes_reglementaires(deleted_at) 
WHERE deleted_at IS NULL;

-- Phase 3: Fix RLS policy for domaines_reglementaires
DROP POLICY IF EXISTS "Content: super_admin manage" ON domaines_reglementaires;
DROP POLICY IF EXISTS "Domaines: staff manage" ON domaines_reglementaires;

CREATE POLICY "Domaines: staff manage" 
ON domaines_reglementaires
FOR ALL 
TO authenticated
USING (
  has_role(auth.uid(), 'Super Admin') OR has_role(auth.uid(), 'Admin Global')
) 
WITH CHECK (
  has_role(auth.uid(), 'Super Admin') OR has_role(auth.uid(), 'Admin Global')
);