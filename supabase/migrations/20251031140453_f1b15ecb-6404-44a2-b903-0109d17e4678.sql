-- Phase 1: Fix System Roles - Only Super Admin should be is_system = true
UPDATE public.roles
SET is_system = false
WHERE name NOT IN ('Super Admin');

UPDATE public.roles
SET is_system = true
WHERE name = 'Super Admin';

-- Phase 2: Prevent Super Admin Role Modification
CREATE OR REPLACE FUNCTION prevent_super_admin_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.name = 'Super Admin' AND NEW.name != 'Super Admin' THEN
    RAISE EXCEPTION 'Cannot modify Super Admin role name';
  END IF;
  
  IF OLD.name = 'Super Admin' AND NEW.is_system = false THEN
    RAISE EXCEPTION 'Cannot remove system status from Super Admin role';
  END IF;
  
  IF OLD.name = 'Super Admin' AND NEW.archived_at IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot archive Super Admin role';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_super_admin_role
BEFORE UPDATE ON public.roles
FOR EACH ROW
WHEN (OLD.name = 'Super Admin')
EXECUTE FUNCTION prevent_super_admin_modification();

-- Phase 3: Prevent Deleting Super Admin Role
CREATE OR REPLACE FUNCTION prevent_super_admin_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.name = 'Super Admin' THEN
    RAISE EXCEPTION 'Cannot delete Super Admin role';
  END IF;
  RETURN OLD;
END;
$$;

CREATE TRIGGER protect_super_admin_deletion
BEFORE DELETE ON public.roles
FOR EACH ROW
WHEN (OLD.name = 'Super Admin')
EXECUTE FUNCTION prevent_super_admin_deletion();

-- Phase 4: Prevent Removing Last Super Admin User
CREATE OR REPLACE FUNCTION prevent_super_admin_removal()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  role_name text;
  super_admin_count integer;
BEGIN
  -- Check if this is a Super Admin role being deleted
  SELECT name INTO role_name
  FROM roles
  WHERE id = OLD.role_uuid;
  
  IF role_name = 'Super Admin' THEN
    -- Count remaining Super Admins (excluding the one being deleted)
    SELECT COUNT(*) INTO super_admin_count
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_uuid
    WHERE r.name = 'Super Admin'
      AND ur.id != OLD.id;
    
    IF super_admin_count = 0 THEN
      RAISE EXCEPTION 'Cannot remove the last Super Admin user';
    END IF;
  END IF;
  
  RETURN OLD;
END;
$$;

CREATE TRIGGER protect_last_super_admin
BEFORE DELETE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION prevent_super_admin_removal();

-- Phase 5: Prevent Changing Last Super Admin's Role
CREATE OR REPLACE FUNCTION prevent_super_admin_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_role_name text;
  new_role_name text;
  super_admin_count integer;
BEGIN
  SELECT name INTO old_role_name FROM roles WHERE id = OLD.role_uuid;
  SELECT name INTO new_role_name FROM roles WHERE id = NEW.role_uuid;
  
  IF old_role_name = 'Super Admin' AND new_role_name != 'Super Admin' THEN
    -- Count remaining Super Admins (excluding this user)
    SELECT COUNT(*) INTO super_admin_count
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_uuid
    WHERE r.name = 'Super Admin'
      AND ur.user_id != OLD.user_id;
    
    IF super_admin_count = 0 THEN
      RAISE EXCEPTION 'Cannot change role of the last Super Admin user';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_super_admin_role_change
BEFORE UPDATE OF role_uuid ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION prevent_super_admin_role_change();

-- Phase 6: Fix has_role function to use text instead of app_role enum
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_uuid
    WHERE ur.user_id = _user_id
      AND (
        r.name = _role
        OR lower(replace(r.name, ' ', '_')) = lower(replace(_role, ' ', '_'))
      )
  )
$$;