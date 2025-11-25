-- Fix security warnings from previous migration

-- Recreate functions with proper search_path
CREATE OR REPLACE FUNCTION check_domain_has_articles(p_domaine_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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

CREATE OR REPLACE FUNCTION check_sous_domaine_has_articles(p_sous_domaine_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

CREATE OR REPLACE FUNCTION prevent_domain_deletion_with_articles()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
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

CREATE OR REPLACE FUNCTION prevent_sous_domaine_deletion_with_articles()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
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