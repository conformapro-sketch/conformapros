-- Table articles : articles appartenant à un texte réglementaire
-- Objectif : déclarer chaque article indépendamment des versions
-- Les versions et effets juridiques sont gérés dans article_versions

-- Supprimer et recréer la table pour garantir la structure exacte
DROP TABLE IF EXISTS articles CASCADE;

CREATE TABLE articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  texte_id uuid NOT NULL REFERENCES textes_reglementaires(id) ON DELETE CASCADE,
  numero text NOT NULL, -- ex: "Art. 15", "Article premier"
  titre text NOT NULL,
  resume text,
  est_introductif boolean NOT NULL DEFAULT false, -- Article introductif sans exigence
  porte_exigence boolean NOT NULL DEFAULT true, -- Article portant une exigence réglementaire
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Contrainte unique : un numéro d'article par texte
  UNIQUE(texte_id, numero)
);

-- Index pour recherche et performance
CREATE INDEX idx_articles_texte_id ON articles(texte_id);
CREATE INDEX idx_articles_numero ON articles(numero);
CREATE INDEX idx_articles_porte_exigence ON articles(porte_exigence);
CREATE INDEX idx_articles_created_by ON articles(created_by);

-- Trigger pour updated_at
CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS : activer la sécurité au niveau des lignes
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Politique : tous les utilisateurs authentifiés peuvent lire
CREATE POLICY "Articles: read by authenticated"
  ON articles
  FOR SELECT
  TO authenticated
  USING (true);

-- Politique : seul le staff (Super Admin, Admin Global) peut créer/modifier/supprimer
CREATE POLICY "Articles: staff manage"
  ON articles
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
COMMENT ON TABLE articles IS 'Articles appartenant à un texte réglementaire. Chaque article est déclaré indépendamment de ses versions. Les versions et effets juridiques sont gérés dans article_versions.';
COMMENT ON COLUMN articles.texte_id IS 'Référence au texte réglementaire parent';
COMMENT ON COLUMN articles.numero IS 'Numéro de l''article (ex: Art. 15, Article premier)';
COMMENT ON COLUMN articles.titre IS 'Titre ou objet de l''article';
COMMENT ON COLUMN articles.resume IS 'Résumé optionnel de l''article';
COMMENT ON COLUMN articles.est_introductif IS 'True si l''article est introductif/déclaratif sans exigence';
COMMENT ON COLUMN articles.porte_exigence IS 'True si l''article porte une exigence réglementaire nécessitant évaluation de conformité';