-- Create helper function to check if user is staff
CREATE OR REPLACE FUNCTION public.is_staff_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.staff_users
    WHERE id = _user_id AND actif = true
  );
$$;

-- Create function to get staff role
CREATE OR REPLACE FUNCTION public.get_staff_role(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role_id FROM public.staff_users
  WHERE id = _user_id AND actif = true
  LIMIT 1;
$$;

-- Create main middleware function to check staff permissions
CREATE OR REPLACE FUNCTION public.check_staff_permission(
  _user_id uuid,
  _permission_key text
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_staff boolean;
  v_role_id uuid;
  v_role_name text;
  v_has_permission boolean;
  v_result jsonb;
BEGIN
  -- Check 1: Is user a staff member?
  v_is_staff := is_staff_user(_user_id);
  
  IF NOT v_is_staff THEN
    RETURN jsonb_build_object(
      'authorized', false,
      'reason', 'not_staff',
      'message', 'User is not a staff member'
    );
  END IF;

  -- Check 2: Get staff role
  v_role_id := get_staff_role(_user_id);
  
  IF v_role_id IS NULL THEN
    RETURN jsonb_build_object(
      'authorized', false,
      'reason', 'no_role',
      'message', 'Staff user has no assigned role'
    );
  END IF;

  -- Get role name
  SELECT nom_role INTO v_role_name
  FROM public.staff_roles
  WHERE id = v_role_id;

  -- Check 3: Check specific permission
  SELECT autorise INTO v_has_permission
  FROM public.staff_role_permissions
  WHERE role_id = v_role_id
    AND permission_key = _permission_key;

  -- If permission not found, assume false
  v_has_permission := COALESCE(v_has_permission, false);

  IF NOT v_has_permission THEN
    RETURN jsonb_build_object(
      'authorized', false,
      'reason', 'permission_denied',
      'message', format('Role "%s" does not have permission "%s"', v_role_name, _permission_key),
      'role', v_role_name,
      'permission', _permission_key
    );
  END IF;

  -- All checks passed
  RETURN jsonb_build_object(
    'authorized', true,
    'role', v_role_name,
    'permission', _permission_key,
    'user_id', _user_id
  );
END;
$$;

-- Create batch permission check function
CREATE OR REPLACE FUNCTION public.check_staff_permissions_batch(
  _user_id uuid,
  _permission_keys text[]
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_staff boolean;
  v_role_id uuid;
  v_role_name text;
  v_permission_key text;
  v_results jsonb := '[]'::jsonb;
  v_authorized_count int := 0;
BEGIN
  -- Check if user is staff
  v_is_staff := is_staff_user(_user_id);
  
  IF NOT v_is_staff THEN
    RETURN jsonb_build_object(
      'authorized', false,
      'reason', 'not_staff',
      'message', 'User is not a staff member',
      'permissions', '[]'::jsonb
    );
  END IF;

  -- Get staff role
  v_role_id := get_staff_role(_user_id);
  
  IF v_role_id IS NULL THEN
    RETURN jsonb_build_object(
      'authorized', false,
      'reason', 'no_role',
      'message', 'Staff user has no assigned role',
      'permissions', '[]'::jsonb
    );
  END IF;

  -- Get role name
  SELECT nom_role INTO v_role_name
  FROM public.staff_roles
  WHERE id = v_role_id;

  -- Check each permission
  FOREACH v_permission_key IN ARRAY _permission_keys
  LOOP
    v_results := v_results || jsonb_build_object(
      'permission', v_permission_key,
      'authorized', COALESCE(
        (SELECT autorise 
         FROM public.staff_role_permissions
         WHERE role_id = v_role_id
           AND permission_key = v_permission_key),
        false
      )
    );
    
    IF COALESCE((SELECT autorise FROM public.staff_role_permissions WHERE role_id = v_role_id AND permission_key = v_permission_key), false) THEN
      v_authorized_count := v_authorized_count + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'authorized', v_authorized_count > 0,
    'role', v_role_name,
    'user_id', _user_id,
    'total_permissions', array_length(_permission_keys, 1),
    'authorized_permissions', v_authorized_count,
    'permissions', v_results
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.is_staff_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_staff_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_staff_permission(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_staff_permissions_batch(uuid, text[]) TO authenticated;

-- Add comments
COMMENT ON FUNCTION public.check_staff_permission IS 'Middleware function to verify staff session, role, and specific permission before authorizing action';
COMMENT ON FUNCTION public.check_staff_permissions_batch IS 'Batch check multiple permissions for a staff user';