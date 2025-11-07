-- Update set_user_site_permissions RPC to filter out 'inherit' decisions
-- This ensures only actual permissions (allow/deny) are stored in the database

CREATE OR REPLACE FUNCTION public.set_user_site_permissions(
  target_user_id UUID,
  target_client_id UUID,
  target_site_id UUID,
  permissions JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _actor_is_client_admin BOOLEAN;
  _actor_is_super_admin BOOLEAN;
  perm JSONB;
  _permission_count INTEGER := 0;
BEGIN
  -- Authorization checks: User must be either client admin for this tenant OR super admin
  SELECT EXISTS (
    SELECT 1 FROM client_users
    WHERE id = auth.uid()
      AND client_id = target_client_id
      AND is_client_admin = true
  ) INTO _actor_is_client_admin;
  
  SELECT has_role(auth.uid(), 'super_admin'::app_role) INTO _actor_is_super_admin;
  
  IF NOT (_actor_is_client_admin OR _actor_is_super_admin) THEN
    RAISE EXCEPTION 'Not authorized to manage permissions for this user';
  END IF;
  
  -- Delete existing permissions for this (user_id, site_id) pair
  DELETE FROM public.user_permissions
  WHERE user_id = target_user_id
    AND site_id = target_site_id;
  
  -- Insert new permissions, FILTERING OUT 'inherit' decisions and 'full' action
  FOR perm IN SELECT * FROM jsonb_array_elements(permissions)
  LOOP
    -- Skip 'inherit' decisions (these are not actual permissions)
    -- Skip 'full' action (it's a UI helper, not a real permission)
    IF (perm->>'decision') != 'inherit' AND (perm->>'action') != 'full' THEN
      INSERT INTO public.user_permissions (
        user_id,
        client_id,
        site_id,
        module,
        action,
        decision,
        scope,
        created_by
      ) VALUES (
        target_user_id,
        target_client_id,
        target_site_id,
        perm->>'module',
        perm->>'action',
        (perm->>'decision')::permission_decision,
        (perm->>'scope')::permission_scope,
        auth.uid()
      );
      _permission_count := _permission_count + 1;
    END IF;
  END LOOP;
  
  -- Log success for debugging
  RAISE NOTICE 'Saved % permissions for user % on site %', _permission_count, target_user_id, target_site_id;
END;
$$;