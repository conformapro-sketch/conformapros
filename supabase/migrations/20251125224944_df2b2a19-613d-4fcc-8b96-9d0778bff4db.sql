-- ================================================
-- VALIDATIONS COHÉRENCE BIBLIOTHÈQUE RÉGLEMENTAIRE
-- ================================================

-- 1. Une version doit toujours avoir un source_texte_id
ALTER TABLE article_versions 
ALTER COLUMN source_texte_id SET NOT NULL;

-- 2. Interdire plusieurs versions avec le même numero_version pour un même article
CREATE UNIQUE INDEX IF NOT EXISTS idx_article_versions_unique_numero 
ON article_versions(article_id, numero_version);

-- 3. Interdire une version avec contenu vide si l'article porte une exigence
-- Note: On utilise un trigger plutôt qu'un CHECK car il faut vérifier la valeur dans la table articles
CREATE OR REPLACE FUNCTION validate_version_contenu()
RETURNS TRIGGER AS $$
DECLARE
  v_porte_exigence boolean;
BEGIN
  -- Récupérer porte_exigence de l'article
  SELECT porte_exigence INTO v_porte_exigence
  FROM articles
  WHERE id = NEW.article_id;

  -- Si l'article porte une exigence, le contenu ne peut pas être vide
  IF v_porte_exigence = true AND (NEW.contenu IS NULL OR TRIM(NEW.contenu) = '') THEN
    RAISE EXCEPTION 'Une version d''article portant exigence ne peut avoir un contenu vide';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_version_contenu
BEFORE INSERT OR UPDATE ON article_versions
FOR EACH ROW
EXECUTE FUNCTION validate_version_contenu();

-- 4. Empêcher la suppression d'un article si lié à des versions
CREATE OR REPLACE FUNCTION prevent_article_deletion_with_versions()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM article_versions WHERE article_id = OLD.id) THEN
    RAISE EXCEPTION 'Impossible de supprimer un article ayant des versions. Supprimez d''abord toutes les versions.';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_article_deletion_with_versions
BEFORE DELETE ON articles
FOR EACH ROW
EXECUTE FUNCTION prevent_article_deletion_with_versions();

-- 5. Empêcher la suppression de la dernière version d'un article
CREATE OR REPLACE FUNCTION prevent_last_version_deletion()
RETURNS TRIGGER AS $$
DECLARE
  v_version_count integer;
BEGIN
  -- Compter les versions restantes pour cet article (en excluant celle qu'on supprime)
  SELECT COUNT(*) INTO v_version_count
  FROM article_versions
  WHERE article_id = OLD.article_id
    AND id != OLD.id;

  -- Si c'est la dernière version, interdire la suppression
  IF v_version_count = 0 THEN
    RAISE EXCEPTION 'Impossible de supprimer la dernière version d''un article. Un article doit avoir au moins une version.';
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_last_version_deletion
BEFORE DELETE ON article_versions
FOR EACH ROW
EXECUTE FUNCTION prevent_last_version_deletion();

-- Commentaires pour documentation
COMMENT ON TRIGGER trigger_validate_version_contenu ON article_versions IS 
'Garantit qu''une version d''article portant exigence a un contenu non vide';

COMMENT ON TRIGGER trigger_prevent_article_deletion_with_versions ON articles IS 
'Empêche la suppression d''un article ayant des versions liées';

COMMENT ON TRIGGER trigger_prevent_last_version_deletion ON article_versions IS 
'Empêche la suppression de la dernière version d''un article (un article doit avoir au moins une version)';

COMMENT ON INDEX idx_article_versions_unique_numero IS 
'Garantit l''unicité du numéro de version par article';