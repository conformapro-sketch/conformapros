-- Migration: Enforce user_permissions can only be created for staff-enabled site modules
-- This ensures data integrity even if the UI is bypassed

-- Create function to validate user_permissions before insert/update
CREATE OR REPLACE FUNCTION public.validate_user_permission_module()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_module_id UUID;
  v_is_enabled BOOLEAN;
BEGIN
  -- Only validate if this is a site-level permission
  IF NEW.site_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Resolve module_id from modules_systeme using the module code
  -- Handle case-insensitive comparison
  SELECT id INTO v_module_id
  FROM modules_systeme
  WHERE LOWER(code) = LOWER(NEW.module)
  LIMIT 1;

  -- If module not found in system, reject
  IF v_module_id IS NULL THEN
    RAISE EXCEPTION 'Module "%" n''existe pas dans le système', NEW.module;
  END IF;

  -- Check if this module is enabled for the specified site
  SELECT enabled INTO v_is_enabled
  FROM site_modules
  WHERE site_id = NEW.site_id
    AND module_id = v_module_id;

  -- If no record found or not enabled, reject
  IF v_is_enabled IS NULL OR v_is_enabled = FALSE THEN
    RAISE EXCEPTION 'Le module "%" n''est pas activé pour ce site (site_id: %)', NEW.module, NEW.site_id
      USING HINT = 'Les modules doivent être activés par le staff ConformaPro au niveau du site.';
  END IF;

  -- Validation passed
  RETURN NEW;
END;
$$;

-- Create trigger on user_permissions table
DROP TRIGGER IF EXISTS validate_user_permission_module_trigger ON user_permissions;

CREATE TRIGGER validate_user_permission_module_trigger
  BEFORE INSERT OR UPDATE ON user_permissions
  FOR EACH ROW
  EXECUTE FUNCTION validate_user_permission_module();

-- Add comment for documentation
COMMENT ON FUNCTION validate_user_permission_module() IS 
  'Validates that user permissions can only be created for modules that are explicitly enabled by staff for the site. Site-level permissions require the module to exist in site_modules with enabled=true.';