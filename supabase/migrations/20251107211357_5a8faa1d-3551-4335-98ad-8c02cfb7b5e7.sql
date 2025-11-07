-- Fix type casting in set_user_site_permissions RPC function
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
BEGIN
  -- Authorization checks
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
  
  -- Insert new permissions with correct enum type casting
  FOR perm IN SELECT * FROM jsonb_array_elements(permissions)
  LOOP
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
  END LOOP;
END;
$$;