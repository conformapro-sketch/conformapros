-- Create storage bucket for actes annexes
INSERT INTO storage.buckets (id, name, public)
VALUES ('actes_annexes', 'actes_annexes', true)
ON CONFLICT (id) DO NOTHING;

-- Add storage policies for authenticated users
CREATE POLICY "Authenticated users can upload annexes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'actes_annexes');

CREATE POLICY "Authenticated users can read annexes"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'actes_annexes');

CREATE POLICY "Super admin can delete annexes"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'actes_annexes' AND
  has_role(auth.uid(), 'super_admin'::app_role)
);

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_actes_type_acte ON actes_reglementaires(type_acte);
CREATE INDEX IF NOT EXISTS idx_actes_statut ON actes_reglementaires(statut_vigueur);
CREATE INDEX IF NOT EXISTS idx_actes_annee ON actes_reglementaires(annee);
CREATE INDEX IF NOT EXISTS idx_articles_texte_id ON textes_articles(texte_id);
CREATE INDEX IF NOT EXISTS idx_articles_ordre ON textes_articles(ordre);
CREATE INDEX IF NOT EXISTS idx_changelog_acte_id ON changelog_reglementaire(acte_id);
CREATE INDEX IF NOT EXISTS idx_annexes_acte_id ON actes_annexes(acte_id);
CREATE INDEX IF NOT EXISTS idx_applicabilite_mapping_acte ON actes_applicabilite_mapping(acte_id);
CREATE INDEX IF NOT EXISTS idx_applicabilite_mapping_domaine ON actes_applicabilite_mapping(sous_domaine_id);