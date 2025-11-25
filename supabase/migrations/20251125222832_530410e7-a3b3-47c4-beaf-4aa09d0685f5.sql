-- =====================================================
-- Migration: Renommage complet actes_reglementaires → textes_reglementaires
-- =====================================================

-- 1. Supprimer la table actes_reglementaires (vide et obsolète)
DROP TABLE IF EXISTS actes_reglementaires CASCADE;

-- 2. Ajouter colonne annee à textes_reglementaires
ALTER TABLE textes_reglementaires 
ADD COLUMN IF NOT EXISTS annee integer;

-- 3. Remplir automatiquement l'année depuis date_publication existante
UPDATE textes_reglementaires 
SET annee = EXTRACT(YEAR FROM date_publication)::integer
WHERE date_publication IS NOT NULL AND annee IS NULL;

-- 4. Créer fonction trigger pour auto-calculer l'année
CREATE OR REPLACE FUNCTION update_annee_from_date_publication()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.date_publication IS NOT NULL THEN
    NEW.annee := EXTRACT(YEAR FROM NEW.date_publication)::integer;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Créer trigger sur textes_reglementaires
DROP TRIGGER IF EXISTS set_annee_on_texte_change ON textes_reglementaires;
CREATE TRIGGER set_annee_on_texte_change
BEFORE INSERT OR UPDATE ON textes_reglementaires
FOR EACH ROW
EXECUTE FUNCTION update_annee_from_date_publication();

-- 6. Créer table de relation textes_domaines (si n'existe pas)
CREATE TABLE IF NOT EXISTS textes_domaines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  texte_id uuid NOT NULL REFERENCES textes_reglementaires(id) ON DELETE CASCADE,
  domaine_id uuid NOT NULL REFERENCES domaines_reglementaires(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(texte_id, domaine_id)
);

-- 7. Créer table de relation textes_sous_domaines (si n'existe pas)
CREATE TABLE IF NOT EXISTS textes_sous_domaines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  texte_id uuid NOT NULL REFERENCES textes_reglementaires(id) ON DELETE CASCADE,
  sous_domaine_id uuid NOT NULL REFERENCES sous_domaines_application(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(texte_id, sous_domaine_id)
);

-- 8. RLS policies pour textes_domaines
ALTER TABLE textes_domaines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "TextesDomaines: read by authenticated"
ON textes_domaines FOR SELECT
USING (true);

CREATE POLICY "TextesDomaines: staff manage"
ON textes_domaines FOR ALL
USING (has_role(auth.uid(), 'Super Admin') OR has_role(auth.uid(), 'Admin Global'))
WITH CHECK (has_role(auth.uid(), 'Super Admin') OR has_role(auth.uid(), 'Admin Global'));

-- 9. RLS policies pour textes_sous_domaines
ALTER TABLE textes_sous_domaines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "TextesSousDomaines: read by authenticated"
ON textes_sous_domaines FOR SELECT
USING (true);

CREATE POLICY "TextesSousDomaines: staff manage"
ON textes_sous_domaines FOR ALL
USING (has_role(auth.uid(), 'Super Admin') OR has_role(auth.uid(), 'Admin Global'))
WITH CHECK (has_role(auth.uid(), 'Super Admin') OR has_role(auth.uid(), 'Admin Global'));

-- 10. Supprimer anciennes fonctions RPC obsolètes
DROP FUNCTION IF EXISTS search_actes_reglementaires(text, integer);
DROP FUNCTION IF EXISTS get_applicable_actes_for_site(uuid);

-- 11. Créer nouvelle fonction RPC pour recherche full-text
CREATE OR REPLACE FUNCTION search_textes_reglementaires(
  search_term text,
  result_limit integer DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  type text,
  reference text,
  titre text,
  date_publication date,
  rank real
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.type,
    t.reference,
    t.titre,
    t.date_publication,
    ts_rank(to_tsvector('french', 
      coalesce(t.titre, '') || ' ' || 
      coalesce(t.reference, '') || ' ' || 
      coalesce(t.source_url, '')
    ), plainto_tsquery('french', search_term)) as rank
  FROM textes_reglementaires t
  WHERE to_tsvector('french', 
    coalesce(t.titre, '') || ' ' || 
    coalesce(t.reference, '') || ' ' || 
    coalesce(t.source_url, '')
  ) @@ plainto_tsquery('french', search_term)
  ORDER BY rank DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 12. Créer fonction RPC pour textes applicables à un site
CREATE OR REPLACE FUNCTION get_applicable_textes_for_site(p_site_id uuid)
RETURNS TABLE (
  id uuid,
  type text,
  reference text,
  titre text,
  date_publication date
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    t.id,
    t.type,
    t.reference,
    t.titre,
    t.date_publication
  FROM textes_reglementaires t
  INNER JOIN textes_domaines td ON td.texte_id = t.id
  INNER JOIN site_veille_domaines svd ON svd.domaine_id = td.domaine_id
  WHERE svd.site_id = p_site_id
  ORDER BY t.date_publication DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;