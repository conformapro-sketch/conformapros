-- Phase 1: Bibliothèque & Veille Réglementaire - Database Schema Enhancements

-- 1.1 Enhance article_versions table with versioning metadata
ALTER TABLE article_versions 
  ADD COLUMN IF NOT EXISTS modification_type TEXT DEFAULT 'ajout',
  ADD COLUMN IF NOT EXISTS source_text_id UUID REFERENCES textes_reglementaires(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source_article_reference TEXT,
  ADD COLUMN IF NOT EXISTS effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS effective_to DATE,
  ADD COLUMN IF NOT EXISTS version_label TEXT,
  ADD COLUMN IF NOT EXISTS replaced_version_id UUID REFERENCES article_versions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS notes_modification TEXT,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Add constraint for modification_type
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_modification_type'
  ) THEN
    ALTER TABLE article_versions 
      ADD CONSTRAINT check_modification_type 
      CHECK (modification_type IN ('ajout', 'modification', 'abrogation', 'remplacement'));
  END IF;
END $$;

-- 1.2 Add is_exigence flag to textes_articles (defaults to true = mandatory requirement)
ALTER TABLE textes_articles 
  ADD COLUMN IF NOT EXISTS is_exigence BOOLEAN DEFAULT true;

-- 1.3 Create plans_action_attachments table
CREATE TABLE IF NOT EXISTS plans_action_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id UUID NOT NULL REFERENCES plans_action(id) ON DELETE CASCADE,
  titre TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  uploaded_by UUID REFERENCES client_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for plans_action_attachments
ALTER TABLE plans_action_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view attachments if they have access to the related site
CREATE POLICY "Users can view action attachments if site access"
ON plans_action_attachments FOR SELECT
USING (
  has_site_access(auth.uid(), (
    SELECT site_id FROM plans_action WHERE id = plans_action_attachments.action_id
  ))
);

-- RLS Policy: Users can manage attachments if they have site access
CREATE POLICY "Users can manage action attachments if site access"
ON plans_action_attachments FOR ALL
USING (
  has_site_access(auth.uid(), (
    SELECT site_id FROM plans_action WHERE id = plans_action_attachments.action_id
  ))
)
WITH CHECK (
  has_site_access(auth.uid(), (
    SELECT site_id FROM plans_action WHERE id = plans_action_attachments.action_id
  ))
);

-- 1.4 Create veille_alerts table
CREATE TABLE IF NOT EXISTS veille_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  article_id UUID REFERENCES textes_articles(id) ON DELETE CASCADE,
  version_id UUID REFERENCES article_versions(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  read_by UUID REFERENCES client_users(id)
);

-- Add constraint for alert_type
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_alert_type'
  ) THEN
    ALTER TABLE veille_alerts 
      ADD CONSTRAINT check_alert_type 
      CHECK (alert_type IN ('new_version', 'version_modified', 're_evaluate', 'version_abrogated'));
  END IF;
END $$;

-- Create index for faster alert queries
CREATE INDEX IF NOT EXISTS idx_veille_alerts_site_unread 
  ON veille_alerts(site_id, is_read, created_at DESC);

-- Enable RLS for veille_alerts
ALTER TABLE veille_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view alerts for their assigned sites
CREATE POLICY "Users can view alerts for their sites"
ON veille_alerts FOR SELECT
USING (has_site_access(auth.uid(), site_id));

-- RLS Policy: Users can update (mark as read) alerts for their sites
CREATE POLICY "Users can mark alerts as read for their sites"
ON veille_alerts FOR UPDATE
USING (has_site_access(auth.uid(), site_id))
WITH CHECK (has_site_access(auth.uid(), site_id));

-- RLS Policy: Staff can manage all alerts
CREATE POLICY "Staff can manage all alerts"
ON veille_alerts FOR ALL
USING (has_role(auth.uid(), 'Super Admin') OR has_role(auth.uid(), 'Admin Global'))
WITH CHECK (has_role(auth.uid(), 'Super Admin') OR has_role(auth.uid(), 'Admin Global'));

-- 1.5 Create codes_structures table for hierarchical code navigation
CREATE TABLE IF NOT EXISTS codes_structures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id UUID NOT NULL REFERENCES codes_juridiques(id) ON DELETE CASCADE,
  niveau TEXT NOT NULL,
  numero TEXT NOT NULL,
  titre TEXT NOT NULL,
  parent_id UUID REFERENCES codes_structures(id) ON DELETE CASCADE,
  ordre INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add constraint for niveau
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_niveau'
  ) THEN
    ALTER TABLE codes_structures 
      ADD CONSTRAINT check_niveau 
      CHECK (niveau IN ('livre', 'titre', 'chapitre', 'section', 'sous_section'));
  END IF;
END $$;

-- Create indexes for hierarchical queries
CREATE INDEX IF NOT EXISTS idx_codes_structures_code_id 
  ON codes_structures(code_id);
CREATE INDEX IF NOT EXISTS idx_codes_structures_parent_id 
  ON codes_structures(parent_id);
CREATE INDEX IF NOT EXISTS idx_codes_structures_ordre 
  ON codes_structures(code_id, parent_id, ordre);

-- Enable RLS for codes_structures
ALTER TABLE codes_structures ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Everyone can view code structures
CREATE POLICY "Everyone can view code structures"
ON codes_structures FOR SELECT
USING (true);

-- RLS Policy: Staff can manage code structures
CREATE POLICY "Staff can manage code structures"
ON codes_structures FOR ALL
USING (has_role(auth.uid(), 'Super Admin'))
WITH CHECK (has_role(auth.uid(), 'Super Admin'));

-- 1.6 Create trigger for automatic version propagation alerts
CREATE OR REPLACE FUNCTION propagate_version_alerts()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create alerts if this is a new active version
  IF NEW.is_active = true THEN
    -- Insert alerts for all sites that have this article marked as applicable
    INSERT INTO veille_alerts (site_id, article_id, version_id, alert_type, message)
    SELECT 
      sas.site_id,
      NEW.article_id,
      NEW.id,
      CASE 
        WHEN NEW.modification_type = 'abrogation' THEN 'version_abrogated'
        ELSE 'new_version'
      END,
      CASE 
        WHEN NEW.modification_type = 'abrogation' THEN 
          'L''article ' || COALESCE((SELECT numero FROM textes_articles WHERE id = NEW.article_id), '') || ' a été abrogé'
        ELSE 
          'Une nouvelle version de l''article ' || COALESCE((SELECT numero FROM textes_articles WHERE id = NEW.article_id), '') || ' est disponible'
      END
    FROM site_article_status sas
    WHERE sas.article_id = NEW.article_id 
      AND sas.applicabilite IN ('obligatoire', 'a_surveiller')
      -- Avoid duplicate alerts
      AND NOT EXISTS (
        SELECT 1 FROM veille_alerts va 
        WHERE va.site_id = sas.site_id 
          AND va.version_id = NEW.id
      );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on article_versions
DROP TRIGGER IF EXISTS trigger_propagate_version_alerts ON article_versions;
CREATE TRIGGER trigger_propagate_version_alerts
  AFTER INSERT OR UPDATE OF is_active ON article_versions
  FOR EACH ROW
  EXECUTE FUNCTION propagate_version_alerts();

-- 1.7 Create storage buckets for attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('conformite-preuves', 'conformite-preuves', true),
  ('plans-action-attachments', 'plans-action-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for conformite-preuves bucket
CREATE POLICY "Authenticated users can upload conformity proofs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'conformite-preuves');

CREATE POLICY "Public can view conformity proofs"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'conformite-preuves');

CREATE POLICY "Users can update their conformity proofs"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'conformite-preuves');

CREATE POLICY "Users can delete their conformity proofs"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'conformite-preuves');

-- RLS policies for plans-action-attachments bucket
CREATE POLICY "Authenticated users can upload action attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'plans-action-attachments');

CREATE POLICY "Public can view action attachments"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'plans-action-attachments');

CREATE POLICY "Users can update their action attachments"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'plans-action-attachments');

CREATE POLICY "Users can delete their action attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'plans-action-attachments');