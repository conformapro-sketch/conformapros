-- Phase 2: Create missing tables with RLS policies
-- Phase 3: Add missing columns to existing tables

-- ============================================
-- PHASE 2: CREATE MISSING TABLES
-- ============================================

-- 1. epi_mouvements - Track EPI movement history
CREATE TABLE IF NOT EXISTS epi_mouvements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  epi_article_id UUID NOT NULL REFERENCES epi_articles(id) ON DELETE CASCADE,
  employe_id UUID NOT NULL REFERENCES employes(id) ON DELETE CASCADE,
  type_mouvement TEXT NOT NULL CHECK (type_mouvement IN ('attribution', 'retour', 'remplacement', 'perte')),
  date_mouvement DATE NOT NULL DEFAULT CURRENT_DATE,
  quantite INTEGER NOT NULL DEFAULT 1,
  remarque TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on epi_mouvements
ALTER TABLE epi_mouvements ENABLE ROW LEVEL SECURITY;

-- RLS policies for epi_mouvements
CREATE POLICY "EPIMouvements: read if client access"
  ON epi_mouvements FOR SELECT
  USING (
    has_client_access(auth.uid(), (
      SELECT e.client_id FROM employes e WHERE e.id = epi_mouvements.employe_id
    ))
  );

CREATE POLICY "EPIMouvements: manage if client access"
  ON epi_mouvements FOR ALL
  USING (
    has_client_access(auth.uid(), (
      SELECT e.client_id FROM employes e WHERE e.id = epi_mouvements.employe_id
    ))
  )
  WITH CHECK (
    has_client_access(auth.uid(), (
      SELECT e.client_id FROM employes e WHERE e.id = epi_mouvements.employe_id
    ))
  );

-- 2. codes_domaines - Link codes juridiques with regulatory domains
CREATE TABLE IF NOT EXISTS codes_domaines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id UUID NOT NULL REFERENCES codes_juridiques(id) ON DELETE CASCADE,
  domaine_id UUID NOT NULL REFERENCES domaines_reglementaires(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(code_id, domaine_id)
);

-- Enable RLS on codes_domaines
ALTER TABLE codes_domaines ENABLE ROW LEVEL SECURITY;

-- RLS policies for codes_domaines (public read)
CREATE POLICY "CodesDomaines: read"
  ON codes_domaines FOR SELECT
  USING (true);

CREATE POLICY "CodesDomaines: super_admin manage"
  ON codes_domaines FOR ALL
  USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- 3. textes_codes - Link regulatory texts with legal codes
CREATE TABLE IF NOT EXISTS textes_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  texte_id UUID NOT NULL REFERENCES textes_reglementaires(id) ON DELETE CASCADE,
  code_id UUID NOT NULL REFERENCES codes_juridiques(id) ON DELETE CASCADE,
  type_relation TEXT DEFAULT 'contient',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(texte_id, code_id)
);

-- Enable RLS on textes_codes
ALTER TABLE textes_codes ENABLE ROW LEVEL SECURITY;

-- RLS policies for textes_codes (public read)
CREATE POLICY "TextesCodes: read"
  ON textes_codes FOR SELECT
  USING (true);

CREATE POLICY "TextesCodes: super_admin manage"
  ON textes_codes FOR ALL
  USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- 4. prestataires - Service providers base table
CREATE TABLE IF NOT EXISTS prestataires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  type_prestation TEXT NOT NULL,
  siret TEXT,
  email TEXT,
  telephone TEXT,
  adresse TEXT,
  ville TEXT,
  code_postal TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on prestataires
ALTER TABLE prestataires ENABLE ROW LEVEL SECURITY;

-- RLS policies for prestataires
CREATE POLICY "Prestataires: read if client access"
  ON prestataires FOR SELECT
  USING (has_client_access(auth.uid(), client_id));

CREATE POLICY "Prestataires: manage if client access"
  ON prestataires FOR ALL
  USING (has_client_access(auth.uid(), client_id))
  WITH CHECK (has_client_access(auth.uid(), client_id));

-- Trigger for prestataires updated_at
CREATE TRIGGER update_prestataires_updated_at
  BEFORE UPDATE ON prestataires
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. visites_medicales_documents - Medical visit documents
CREATE TABLE IF NOT EXISTS visites_medicales_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visite_id UUID NOT NULL REFERENCES visites_medicales(id) ON DELETE CASCADE,
  type_document TEXT NOT NULL,
  url_document TEXT NOT NULL,
  titre TEXT NOT NULL,
  date_document DATE,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on visites_medicales_documents
ALTER TABLE visites_medicales_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies for visites_medicales_documents
CREATE POLICY "VisitesMedicalesDocuments: read if client access"
  ON visites_medicales_documents FOR SELECT
  USING (
    has_client_access(auth.uid(), (
      SELECT e.client_id FROM visites_medicales vm
      JOIN employes e ON e.id = vm.employe_id
      WHERE vm.id = visites_medicales_documents.visite_id
    ))
  );

CREATE POLICY "VisitesMedicalesDocuments: manage if client access"
  ON visites_medicales_documents FOR ALL
  USING (
    has_client_access(auth.uid(), (
      SELECT e.client_id FROM visites_medicales vm
      JOIN employes e ON e.id = vm.employe_id
      WHERE vm.id = visites_medicales_documents.visite_id
    ))
  )
  WITH CHECK (
    has_client_access(auth.uid(), (
      SELECT e.client_id FROM visites_medicales vm
      JOIN employes e ON e.id = vm.employe_id
      WHERE vm.id = visites_medicales_documents.visite_id
    ))
  );

-- ============================================
-- PHASE 3: ADD MISSING COLUMNS
-- ============================================

-- Add missing columns to codes_juridiques
ALTER TABLE codes_juridiques 
  ADD COLUMN IF NOT EXISTS nom_officiel TEXT,
  ADD COLUMN IF NOT EXISTS abreviation TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Trigger for codes_juridiques updated_at
DROP TRIGGER IF EXISTS update_codes_juridiques_updated_at ON codes_juridiques;
CREATE TRIGGER update_codes_juridiques_updated_at
  BEFORE UPDATE ON codes_juridiques
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add missing column to employes
ALTER TABLE employes 
  ADD COLUMN IF NOT EXISTS matricule TEXT;

-- Add missing column to article_versions
ALTER TABLE article_versions 
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false;

-- ============================================
-- PHASE 4: CREATE COMPATIBILITY VIEW
-- ============================================

-- Create view for backward compatibility (equipements_controle -> equipements_controles)
CREATE OR REPLACE VIEW equipements_controle AS
SELECT * FROM equipements_controles;