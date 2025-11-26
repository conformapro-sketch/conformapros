-- Validation 1 & 5: Un article ne peut exister sans version, empêcher suppression si versions liées
-- Trigger pour empêcher la suppression d'un article s'il a des versions
CREATE OR REPLACE FUNCTION prevent_article_deletion_with_versions()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM article_versions 
    WHERE article_id = OLD.id
  ) THEN
    RAISE EXCEPTION 'Impossible de supprimer cet article car il possède des versions. Supprimez d''abord toutes les versions.';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_article_has_no_versions_before_delete
BEFORE DELETE ON articles
FOR EACH ROW
EXECUTE FUNCTION prevent_article_deletion_with_versions();

-- Validation 1 (suite): Empêcher la suppression de la dernière version d'un article
CREATE OR REPLACE FUNCTION prevent_last_version_deletion()
RETURNS TRIGGER AS $$
DECLARE
  version_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO version_count
  FROM article_versions
  WHERE article_id = OLD.article_id;
  
  IF version_count = 1 THEN
    RAISE EXCEPTION 'Impossible de supprimer la dernière version d''un article. Un article doit avoir au moins une version.';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_article_has_at_least_one_version
BEFORE DELETE ON article_versions
FOR EACH ROW
EXECUTE FUNCTION prevent_last_version_deletion();

-- Validation 2: Une version doit toujours avoir un source_texte_id
-- Déjà en place via NOT NULL constraint dans le schéma existant

-- Validation 3: Interdire plusieurs versions avec le même numero_version pour un même article
CREATE UNIQUE INDEX IF NOT EXISTS idx_article_versions_unique_numero 
ON article_versions(article_id, numero_version);

-- Validation 4: Interdire contenu vide si porte_exigence = true
CREATE OR REPLACE FUNCTION validate_version_content_if_exigence()
RETURNS TRIGGER AS $$
DECLARE
  article_porte_exigence BOOLEAN;
BEGIN
  -- Récupérer le flag porte_exigence de l'article parent
  SELECT porte_exigence INTO article_porte_exigence
  FROM articles
  WHERE id = NEW.article_id;
  
  -- Si l'article porte une exigence, le contenu ne peut pas être vide
  IF article_porte_exigence = true AND (NEW.contenu IS NULL OR TRIM(NEW.contenu) = '') THEN
    RAISE EXCEPTION 'Le contenu d''une version ne peut pas être vide si l''article porte une exigence réglementaire (porte_exigence = true).';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_version_content_if_exigence
BEFORE INSERT OR UPDATE ON article_versions
FOR EACH ROW
EXECUTE FUNCTION validate_version_content_if_exigence();

-- Commentaires pour documentation
COMMENT ON FUNCTION prevent_article_deletion_with_versions() IS 'Empêche la suppression d''un article s''il possède des versions liées';
COMMENT ON FUNCTION prevent_last_version_deletion() IS 'Empêche la suppression de la dernière version d''un article pour maintenir l''intégrité';
COMMENT ON FUNCTION validate_version_content_if_exigence() IS 'Valide que le contenu n''est pas vide si l''article porte une exigence réglementaire';
COMMENT ON INDEX idx_article_versions_unique_numero IS 'Garantit l''unicité du numéro de version par article';