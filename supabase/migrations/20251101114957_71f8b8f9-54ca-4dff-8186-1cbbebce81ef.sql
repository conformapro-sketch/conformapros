-- Fix infinite recursion in client_users RLS policies
-- The policies were referencing client_users within their own EXISTS subqueries

-- Step 1: Create helper function that bypasses RLS using SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.is_user_client_admin(user_id uuid, check_client_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_is_admin boolean;
BEGIN
  SELECT cu.is_client_admin INTO user_is_admin
  FROM client_users cu
  WHERE cu.id = user_id 
    AND cu.client_id = check_client_id
  LIMIT 1;
  
  RETURN COALESCE(user_is_admin, false);
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_user_client_admin(uuid, uuid) TO authenticated;

-- Step 2: Drop problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "ClientUsers: client_admin can view same client" ON client_users;
DROP POLICY IF EXISTS "ClientUsers: client_admin can manage non-admins" ON client_users;

-- Step 3: Create new policies using the helper function (breaks recursion)
CREATE POLICY "ClientUsers: client_admin can view same client v2"
ON client_users
FOR SELECT
TO authenticated
USING (
  public.is_user_client_admin(auth.uid(), client_users.client_id)
);

CREATE POLICY "ClientUsers: client_admin can manage non-admins v2"
ON client_users
FOR ALL
TO authenticated
USING (
  client_users.is_client_admin = false 
  AND public.is_user_client_admin(auth.uid(), client_users.client_id)
)
WITH CHECK (
  client_users.is_client_admin = false 
  AND public.is_user_client_admin(auth.uid(), client_users.client_id)
);