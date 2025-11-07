-- Step 1: Create secure function to save user permissions with proper authorization
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
  is_client_admin BOOLEAN;
  is_super_admin BOOLEAN;
  perm JSONB;
BEGIN
  -- Authorization checks
  SELECT EXISTS (
    SELECT 1 FROM client_users
    WHERE id = auth.uid()
      AND client_id = target_client_id
      AND is_client_admin = true
  ) INTO is_client_admin;
  
  SELECT has_role(auth.uid(), 'super_admin'::app_role) INTO is_super_admin;
  
  IF NOT (is_client_admin OR is_super_admin) THEN
    RAISE EXCEPTION 'Not authorized to manage permissions for this user';
  END IF;
  
  -- Delete existing permissions for this (user_id, site_id) pair
  DELETE FROM public.user_permissions
  WHERE user_id = target_user_id
    AND site_id = target_site_id;
  
  -- Insert new permissions
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
      (perm->>'decision')::text,
      (perm->>'scope')::text,
      auth.uid()
    );
  END LOOP;
END;
$$;

-- Step 2: Drop legacy/duplicate RLS policies on user_permissions
DROP POLICY IF EXISTS "UserPermissions: client_admin manage subordinates" ON public.user_permissions;
DROP POLICY IF EXISTS "UserPermissions: users view own" ON public.user_permissions;
DROP POLICY IF EXISTS "Users can view their own permissions" ON public.user_permissions;
DROP POLICY IF EXISTS "Client admins can manage their users permissions" ON public.user_permissions;
DROP POLICY IF EXISTS "Super admins can manage all permissions" ON public.user_permissions;

-- Step 3: Create clean RLS policies
-- Policy 1: Users can view their own permissions
CREATE POLICY "user_permissions_select_own"
ON public.user_permissions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy 2: Client admins can manage permissions for their client's users
CREATE POLICY "user_permissions_client_admin_all"
ON public.user_permissions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM client_users cu
    WHERE cu.id = auth.uid()
      AND cu.client_id = user_permissions.client_id
      AND cu.is_client_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM client_users cu
    WHERE cu.id = auth.uid()
      AND cu.client_id = user_permissions.client_id
      AND cu.is_client_admin = true
  )
);

-- Policy 3: Super admins have full access
CREATE POLICY "user_permissions_super_admin_all"
ON public.user_permissions
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));