-- Prompt 19: Add validation rules and constraints

-- 1. Add unique constraint on domain codes
ALTER TABLE domaines_reglementaires
  DROP CONSTRAINT IF EXISTS domaines_reglementaires_code_key;

ALTER TABLE domaines_reglementaires
  ADD CONSTRAINT domaines_reglementaires_code_key UNIQUE (code);

-- 2. Add composite unique constraint on sub-domain codes within a domain
ALTER TABLE sous_domaines_application
  DROP CONSTRAINT IF EXISTS sous_domaines_application_domaine_code_key;

ALTER TABLE sous_domaines_application
  ADD CONSTRAINT sous_domaines_application_domaine_code_key UNIQUE (domaine_id, code);

-- 3. Create function to check if domain has linked articles
CREATE OR REPLACE FUNCTION check_domain_has_articles(p_domaine_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if any articles are linked to sub-domains of this domain
  RETURN EXISTS (
    SELECT 1 
    FROM articles_sous_domaines asd
    JOIN sous_domaines_application sda ON asd.sous_domaine_id = sda.id
    WHERE sda.domaine_id = p_domaine_id
    AND sda.deleted_at IS NULL
    LIMIT 1
  );
END;
$$;

-- 4. Create function to check if sub-domain has linked articles
CREATE OR REPLACE FUNCTION check_sous_domaine_has_articles(p_sous_domaine_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM articles_sous_domaines
    WHERE sous_domaine_id = p_sous_domaine_id
    LIMIT 1
  );
END;
$$;

-- 5. Add trigger to prevent domain deletion if it has linked articles
CREATE OR REPLACE FUNCTION prevent_domain_deletion_with_articles()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    IF check_domain_has_articles(OLD.id) THEN
      RAISE EXCEPTION 'Cannot delete domain: it has articles linked to its sub-domains. Remove article associations first.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_prevent_domain_deletion ON domaines_reglementaires;
CREATE TRIGGER trigger_prevent_domain_deletion
  BEFORE UPDATE ON domaines_reglementaires
  FOR EACH ROW
  EXECUTE FUNCTION prevent_domain_deletion_with_articles();

-- 6. Add trigger to prevent sub-domain deletion if it has linked articles
CREATE OR REPLACE FUNCTION prevent_sous_domaine_deletion_with_articles()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    IF check_sous_domaine_has_articles(OLD.id) THEN
      RAISE EXCEPTION 'Cannot delete sub-domain: it has articles linked to it. Remove article associations first.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_prevent_sous_domaine_deletion ON sous_domaines_application;
CREATE TRIGGER trigger_prevent_sous_domaine_deletion
  BEFORE UPDATE ON sous_domaines_application
  FOR EACH ROW
  EXECUTE FUNCTION prevent_sous_domaine_deletion_with_articles();

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION check_domain_has_articles TO authenticated;
GRANT EXECUTE ON FUNCTION check_sous_domaine_has_articles TO authenticated;