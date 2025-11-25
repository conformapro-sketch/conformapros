-- Table article_versions : versioning des articles dans le temps
-- Objectif : enregistrer toutes les modifications, créations et abrogations d'articles
-- Chaque version est créée par un texte réglementaire source

-- Enum pour le statut de version
DO $$ BEGIN
  CREATE TYPE statut_version_article AS ENUM ('en_vigueur', 'abrogee', 'remplacee');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Supprimer et recréer la table pour garantir la structure exacte
DROP TABLE IF EXISTS article_versions CASCADE;

CREATE TABLE article_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  numero_version integer NOT NULL CHECK (numero_version >= 1),
  date_effet date NOT NULL, -- Date d'entrée en vigueur de cette version
  statut statut_version_article NOT NULL DEFAULT 'en_vigueur',
  source_texte_id uuid NOT NULL REFERENCES textes_reglementaires(id) ON DELETE RESTRICT,
  contenu text NOT NULL, -- Texte intégral de l'article dans cette version
  notes_modifications text, -- Notes optionnelles sur les modifications
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Contrainte unique : un seul numéro de version par article
  UNIQUE(article_id, numero_version)
);

-- Index pour recherche et performance
CREATE INDEX idx_article_versions_article_id ON article_versions(article_id);
CREATE INDEX idx_article_versions_numero_version ON article_versions(article_id, numero_version);
CREATE INDEX idx_article_versions_date_effet ON article_versions(date_effet DESC);
CREATE INDEX idx_article_versions_statut ON article_versions(statut);
CREATE INDEX idx_article_versions_source_texte_id ON article_versions(source_texte_id);
CREATE INDEX idx_article_versions_created_by ON article_versions(created_by);

-- Index composite pour trouver rapidement la version en vigueur d'un article
CREATE INDEX idx_article_versions_article_en_vigueur ON article_versions(article_id, statut) 
  WHERE statut = 'en_vigueur';

-- Trigger pour updated_at
CREATE TRIGGER update_article_versions_updated_at
  BEFORE UPDATE ON article_versions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS : activer la sécurité au niveau des lignes
ALTER TABLE article_versions ENABLE ROW LEVEL SECURITY;

-- Politique : tous les utilisateurs authentifiés peuvent lire
CREATE POLICY "ArticleVersions: read by authenticated"
  ON article_versions
  FOR SELECT
  TO authenticated
  USING (true);

-- Politique : seul le staff (Super Admin, Admin Global) peut créer/modifier/supprimer
CREATE POLICY "ArticleVersions: staff manage"
  ON article_versions
  FOR ALL
  TO authenticated
  USING (
    has_role(auth.uid(), 'Super Admin') OR 
    has_role(auth.uid(), 'Admin Global')
  )
  WITH CHECK (
    has_role(auth.uid(), 'Super Admin') OR 
    has_role(auth.uid(), 'Admin Global')
  );

-- Commentaires pour documentation
COMMENT ON TABLE article_versions IS 'Versions successives des articles. Chaque modification législative crée une nouvelle version. Toutes les créations, modifications et abrogations sont enregistrées ici.';
COMMENT ON COLUMN article_versions.article_id IS 'Référence à l''article parent';
COMMENT ON COLUMN article_versions.numero_version IS 'Numéro séquentiel de version (commence à 1)';
COMMENT ON COLUMN article_versions.date_effet IS 'Date d''entrée en vigueur de cette version';
COMMENT ON COLUMN article_versions.statut IS 'Statut actuel de la version : en_vigueur, abrogee, remplacee';
COMMENT ON COLUMN article_versions.source_texte_id IS 'Texte réglementaire ayant créé/modifié/abrogé cette version';
COMMENT ON COLUMN article_versions.contenu IS 'Texte intégral de l''article dans cette version';
COMMENT ON COLUMN article_versions.notes_modifications IS 'Notes optionnelles décrivant les modifications apportées';