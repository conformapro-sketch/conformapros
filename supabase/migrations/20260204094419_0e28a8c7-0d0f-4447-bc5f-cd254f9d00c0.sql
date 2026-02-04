-- Security Hardening: Fix 6 functions with mutable search_path
-- These functions need SET search_path TO 'public' for security

-- Fix 1: prevent_domain_deletion_with_articles
CREATE OR REPLACE FUNCTION public.prevent_domain_deletion_with_articles()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    IF check_domain_has_articles(OLD.id) THEN
      RAISE EXCEPTION 'Cannot delete domain: it has articles linked to its sub-domains. Remove article associations first.';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- Fix 2: sync_site_nom
CREATE OR REPLACE FUNCTION public.sync_site_nom()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  -- If nom_site changes, update nom
  IF NEW.nom_site != OLD.nom_site THEN
    NEW.nom = NEW.nom_site;
  END IF;
  -- If nom changes, update nom_site
  IF NEW.nom != OLD.nom THEN
    NEW.nom_site = NEW.nom;
  END IF;
  RETURN NEW;
END;
$function$;

-- Fix 3: update_annee_from_date_publication
CREATE OR REPLACE FUNCTION public.update_annee_from_date_publication()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.date_publication IS NOT NULL THEN
    NEW.annee := EXTRACT(YEAR FROM NEW.date_publication)::integer;
  END IF;
  RETURN NEW;
END;
$function$;

-- Fix 4: validate_version_contenu
CREATE OR REPLACE FUNCTION public.validate_version_contenu()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
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
$function$;

-- Fix 5: prevent_last_version_deletion
CREATE OR REPLACE FUNCTION public.prevent_last_version_deletion()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  version_count INTEGER;
BEGIN
  -- Skip validation during cascade delete operations
  IF current_setting('app.cascade_delete', true) = 'true' THEN
    RETURN OLD;
  END IF;

  SELECT COUNT(*) INTO version_count
  FROM article_versions
  WHERE article_id = OLD.article_id;
  
  IF version_count = 1 THEN
    RAISE EXCEPTION 'Impossible de supprimer la dernière version d''un article. Un article doit avoir au moins une version.';
  END IF;
  RETURN OLD;
END;
$function$;

-- Fix 6: prevent_article_deletion_with_versions
CREATE OR REPLACE FUNCTION public.prevent_article_deletion_with_versions()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  -- Skip validation during cascade delete operations
  IF current_setting('app.cascade_delete', true) = 'true' THEN
    RETURN OLD;
  END IF;

  IF EXISTS (
    SELECT 1 FROM article_versions 
    WHERE article_id = OLD.id
  ) THEN
    RAISE EXCEPTION 'Impossible de supprimer cet article car il possède des versions. Supprimez d''abord toutes les versions.';
  END IF;
  RETURN OLD;
END;
$function$;

-- Fix 7: prevent_sous_domaine_deletion_with_articles
CREATE OR REPLACE FUNCTION public.prevent_sous_domaine_deletion_with_articles()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    IF check_sous_domaine_has_articles(OLD.id) THEN
      RAISE EXCEPTION 'Cannot delete sub-domain: it has articles linked to it. Remove article associations first.';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- Add RLS INSERT policy for user_roles if missing
-- This allows role assignment by staff
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_roles' 
    AND policyname = 'staff_can_insert_user_roles'
  ) THEN
    CREATE POLICY "staff_can_insert_user_roles"
      ON public.user_roles
      FOR INSERT
      TO authenticated
      WITH CHECK (
        has_role(auth.uid(), 'Super Admin') 
        OR has_role(auth.uid(), 'Admin Global')
      );
  END IF;
END $$;