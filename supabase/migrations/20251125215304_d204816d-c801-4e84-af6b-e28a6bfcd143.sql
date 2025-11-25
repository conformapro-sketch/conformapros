-- Table article_sous_domaines : classification des articles par sous-domaines
-- Objectif : lier chaque article à un ou plusieurs sous-domaines réglementaires
-- Table de jointure many-to-many

CREATE TABLE article_sous_domaines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  sous_domaine_id uuid NOT NULL REFERENCES sous_domaines_application(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  
  -- Contrainte unique : éviter les doublons
  UNIQUE(article_id, sous_domaine_id)
);

-- Index pour recherche et performance
CREATE INDEX idx_article_sous_domaines_article_id ON article_sous_domaines(article_id);
CREATE INDEX idx_article_sous_domaines_sous_domaine_id ON article_sous_domaines(sous_domaine_id);

-- RLS : activer la sécurité au niveau des lignes
ALTER TABLE article_sous_domaines ENABLE ROW LEVEL SECURITY;

-- Politique : tous les utilisateurs authentifiés peuvent lire
CREATE POLICY "ArticleSousDomaines: read by authenticated"
  ON article_sous_domaines
  FOR SELECT
  TO authenticated
  USING (true);

-- Politique : seul le staff (Super Admin, Admin Global) peut créer/modifier/supprimer
CREATE POLICY "ArticleSousDomaines: staff manage"
  ON article_sous_domaines
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
COMMENT ON TABLE article_sous_domaines IS 'Table de jointure : classification des articles par sous-domaines réglementaires. Permet à un article d''appartenir à plusieurs sous-domaines.';
COMMENT ON COLUMN article_sous_domaines.article_id IS 'Référence à l''article';
COMMENT ON COLUMN article_sous_domaines.sous_domaine_id IS 'Référence au sous-domaine réglementaire';