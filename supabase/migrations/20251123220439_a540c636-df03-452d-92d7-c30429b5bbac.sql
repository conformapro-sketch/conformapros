-- Ensure RLS is enabled on user_permissions
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- Policy: Super Admin & Admin Global can fully manage all user permissions
CREATE POLICY "UserPermissions: team admins manage all"
ON public.user_permissions
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'Super Admin')
  OR has_role(auth.uid(), 'Admin Global')
)
WITH CHECK (
  has_role(auth.uid(), 'Super Admin')
  OR has_role(auth.uid(), 'Admin Global')
);

-- Policy: Client admins can manage permissions within their client
CREATE POLICY "UserPermissions: client_admin manage client"
ON public.user_permissions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.client_users cu
    WHERE cu.id = auth.uid()
      AND cu.is_client_admin = true
      AND cu.client_id = user_permissions.client_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.client_users cu
    WHERE cu.id = auth.uid()
      AND cu.is_client_admin = true
      AND cu.client_id = user_permissions.client_id
  )
);

-- Policy: Users can read their own effective permissions
CREATE POLICY "UserPermissions: users view own"
ON public.user_permissions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Harden save_site_permissions function to surface errors clearly
CREATE OR REPLACE FUNCTION public.save_site_permissions(
  p_user_id uuid,
  p_site_id uuid,
  p_client_id uuid,
  p_permissions jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  perm jsonb;
BEGIN
  -- Delete existing site-specific permissions for this user/site
  DELETE FROM user_permissions 
  WHERE user_id = p_user_id 
    AND site_id = p_site_id;

  -- Insert new permissions (excluding 'inherit')
  FOR perm IN SELECT * FROM jsonb_array_elements(p_permissions)
  LOOP
    IF (perm->>'decision')::text != 'inherit' THEN
      INSERT INTO user_permissions (
        user_id, 
        client_id, 
        site_id,
        module, 
        action, 
        decision, 
        scope
      )
      VALUES (
        p_user_id,
        p_client_id,
        p_site_id,
        (perm->>'module')::text,
        (perm->>'action')::text,
        (perm->>'decision')::permission_decision,
        (perm->>'scope')::permission_scope
      );
    END IF;
  END LOOP;
EXCEPTION
  WHEN others THEN
    RAISE EXCEPTION 'Error in save_site_permissions: %', SQLERRM;
END;
$$;