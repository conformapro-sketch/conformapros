-- Phase 1: Fix RLS Policies for Audit Logging
-- Add INSERT policy for staff users
CREATE POLICY "Audit: staff can insert logs"
ON public.user_management_audit
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'Super Admin')
  OR has_role(auth.uid(), 'Admin Global')
);

-- Add INSERT policy for client admins
CREATE POLICY "Audit: client admins can insert logs"
ON public.user_management_audit
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.client_users cu
    WHERE cu.id = auth.uid()
      AND cu.is_client_admin = true
      AND cu.client_id = user_management_audit.client_id
  )
);

-- Phase 2: Add explicit INSERT/UPDATE/DELETE policies for user_permissions
-- Make policies more explicit for clarity and debugging
CREATE POLICY "UserPermissions: staff insert"
ON public.user_permissions
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'Super Admin')
  OR has_role(auth.uid(), 'Admin Global')
);

CREATE POLICY "UserPermissions: staff update"
ON public.user_permissions
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'Super Admin')
  OR has_role(auth.uid(), 'Admin Global')
)
WITH CHECK (
  has_role(auth.uid(), 'Super Admin')
  OR has_role(auth.uid(), 'Admin Global')
);

CREATE POLICY "UserPermissions: staff delete"
ON public.user_permissions
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'Super Admin')
  OR has_role(auth.uid(), 'Admin Global')
);

CREATE POLICY "UserPermissions: client_admin insert"
ON public.user_permissions
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.client_users cu
    WHERE cu.id = auth.uid()
      AND cu.is_client_admin = true
      AND cu.client_id = user_permissions.client_id
  )
);

CREATE POLICY "UserPermissions: client_admin update"
ON public.user_permissions
FOR UPDATE
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

CREATE POLICY "UserPermissions: client_admin delete"
ON public.user_permissions
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.client_users cu
    WHERE cu.id = auth.uid()
      AND cu.is_client_admin = true
      AND cu.client_id = user_permissions.client_id
  )
);

-- Phase 3: Fix set_user_domain_scopes RPC with proper error handling
CREATE OR REPLACE FUNCTION public.set_user_domain_scopes(
  target_user_id UUID,
  domaine_ids UUID[]
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Delete existing domains
  DELETE FROM user_domain_scopes 
  WHERE user_id = target_user_id;

  -- Insert new domains
  IF array_length(domaine_ids, 1) > 0 THEN
    INSERT INTO user_domain_scopes (user_id, domaine_id)
    SELECT target_user_id, unnest(domaine_ids);
  END IF;

EXCEPTION
  WHEN others THEN
    RAISE EXCEPTION 'Error in set_user_domain_scopes for user %: %', target_user_id, SQLERRM;
END;
$$;

-- Add explicit INSERT policy for user_domain_scopes
CREATE POLICY "UserDomainScopes: staff insert"
ON public.user_domain_scopes
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'Super Admin')
  OR has_role(auth.uid(), 'Admin Global')
);

CREATE POLICY "UserDomainScopes: client_admin insert"
ON public.user_domain_scopes
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.client_users cu
    WHERE cu.id = auth.uid()
      AND cu.is_client_admin = true
      AND cu.client_id = (
        SELECT cu2.client_id 
        FROM public.client_users cu2 
        WHERE cu2.id = user_domain_scopes.user_id
      )
  )
);