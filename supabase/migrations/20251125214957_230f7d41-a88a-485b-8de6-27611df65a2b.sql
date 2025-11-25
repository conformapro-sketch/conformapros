-- Table textes_reglementaires : métadonnées des textes officiels publiés
-- Objectif : représenter l'existence matérielle du texte publié uniquement
-- Les effets juridiques (abrogation, modification) sont gérés dans article_versions

-- Type de texte réglementaire
DO $$ BEGIN
  CREATE TYPE type_texte_reglementaire AS ENUM ('loi', 'decret', 'arrete', 'circulaire');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Supprimer et recréer la table textes_reglementaires pour garantir la structure exacte
DROP TABLE IF EXISTS textes_reglementaires CASCADE;

CREATE TABLE textes_reglementaires (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type type_texte_reglementaire NOT NULL,
  reference text NOT NULL UNIQUE, -- ex: "Loi n°2016-10"
  titre text NOT NULL,
  date_publication date NOT NULL,
  source_url text, -- URL vers le texte officiel (JORT, etc.)
  pdf_url text, -- URL vers le PDF du texte
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index pour recherche et performance
CREATE INDEX idx_textes_reglementaires_type ON textes_reglementaires(type);
CREATE INDEX idx_textes_reglementaires_date_publication ON textes_reglementaires(date_publication DESC);
CREATE INDEX idx_textes_reglementaires_reference ON textes_reglementaires(reference);
CREATE INDEX idx_textes_reglementaires_created_by ON textes_reglementaires(created_by);

-- Trigger pour updated_at
CREATE TRIGGER update_textes_reglementaires_updated_at
  BEFORE UPDATE ON textes_reglementaires
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS : activer la sécurité au niveau des lignes
ALTER TABLE textes_reglementaires ENABLE ROW LEVEL SECURITY;

-- Politique : tous les utilisateurs authentifiés peuvent lire
CREATE POLICY "TextesReglementaires: read by authenticated"
  ON textes_reglementaires
  FOR SELECT
  TO authenticated
  USING (true);

-- Politique : seul le staff (Super Admin, Admin Global) peut créer/modifier/supprimer
CREATE POLICY "TextesReglementaires: staff manage"
  ON textes_reglementaires
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
COMMENT ON TABLE textes_reglementaires IS 'Métadonnées des textes officiels publiés (lois, décrets, arrêtés, circulaires). Ne contient aucune logique de statut juridique - celle-ci est gérée dans article_versions.';
COMMENT ON COLUMN textes_reglementaires.type IS 'Type de texte : loi, decret, arrete, circulaire';
COMMENT ON COLUMN textes_reglementaires.reference IS 'Référence officielle unique (ex: Loi n°2016-10)';
COMMENT ON COLUMN textes_reglementaires.titre IS 'Titre complet du texte réglementaire';
COMMENT ON COLUMN textes_reglementaires.date_publication IS 'Date de publication officielle';
COMMENT ON COLUMN textes_reglementaires.source_url IS 'URL vers le texte sur le site officiel (JORT, etc.)';
COMMENT ON COLUMN textes_reglementaires.pdf_url IS 'URL vers le PDF officiel du texte';