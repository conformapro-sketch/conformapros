-- Prevent dual identity: staff users (team roles) cannot be added as client users
-- and client users cannot be given team roles

-- Function to check if user has team role
CREATE OR REPLACE FUNCTION public.user_has_team_role(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_uuid
    WHERE ur.user_id = p_user_id
      AND r.type = 'team'
  );
END;
$$;

-- Function to check if user is client user
CREATE OR REPLACE FUNCTION public.user_is_client_user(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.client_users
    WHERE id = p_user_id
  );
END;
$$;

-- Trigger function: prevent adding team role if user is client user
CREATE OR REPLACE FUNCTION public.prevent_team_role_for_client_users()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role_type TEXT;
BEGIN
  -- Get role type
  SELECT type INTO v_role_type
  FROM public.roles
  WHERE id = NEW.role_uuid;
  
  -- If it's a team role, check if user is client user
  IF v_role_type = 'team' AND public.user_is_client_user(NEW.user_id) THEN
    RAISE EXCEPTION 'Cannot assign team role: user already exists as client user. Staff and client identities must be separate.';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger function: prevent adding client user if user has team role
CREATE OR REPLACE FUNCTION public.prevent_client_user_for_team_users()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.user_has_team_role(NEW.id) THEN
    RAISE EXCEPTION 'Cannot create client user: user already has team role. Staff and client identities must be separate.';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS trg_prevent_team_role_for_client_users ON public.user_roles;
CREATE TRIGGER trg_prevent_team_role_for_client_users
  BEFORE INSERT ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_team_role_for_client_users();

DROP TRIGGER IF EXISTS trg_prevent_client_user_for_team_users ON public.client_users;
CREATE TRIGGER trg_prevent_client_user_for_team_users
  BEFORE INSERT ON public.client_users
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_client_user_for_team_users();