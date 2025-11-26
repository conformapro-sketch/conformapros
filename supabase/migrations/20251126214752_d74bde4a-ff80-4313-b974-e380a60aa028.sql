-- Add RLS policies for staff_users table
ALTER TABLE staff_users ENABLE ROW LEVEL SECURITY;

-- Allow Super Admin and Admin Global to view all staff users
CREATE POLICY "StaffUsers: staff can view all"
ON staff_users
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'Super Admin') OR 
  has_role(auth.uid(), 'Admin Global')
);

-- Allow Super Admin and Admin Global to manage all staff users
CREATE POLICY "StaffUsers: staff can manage all"
ON staff_users
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'Super Admin') OR 
  has_role(auth.uid(), 'Admin Global')
)
WITH CHECK (
  has_role(auth.uid(), 'Super Admin') OR 
  has_role(auth.uid(), 'Admin Global')
);

-- Helper function to sync current user to staff_users if they're a Super Admin or Admin Global
CREATE OR REPLACE FUNCTION sync_current_user_to_staff()
RETURNS TABLE(staff_user_id uuid, message text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_email text;
  v_user_id uuid;
  v_role_id uuid;
  v_staff_user_id uuid;
BEGIN
  -- Get current user info
  SELECT auth.uid() INTO v_user_id;
  SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;
  
  -- Check if user is Super Admin or Admin Global
  IF NOT (has_role(v_user_id, 'Super Admin') OR has_role(v_user_id, 'Admin Global')) THEN
    RETURN QUERY SELECT NULL::uuid, 'User is not a Super Admin or Admin Global'::text;
    RETURN;
  END IF;
  
  -- Check if user already exists in staff_users
  SELECT id INTO v_staff_user_id FROM staff_users WHERE id = v_user_id;
  
  IF v_staff_user_id IS NOT NULL THEN
    RETURN QUERY SELECT v_staff_user_id, 'User already exists in staff_users'::text;
    RETURN;
  END IF;
  
  -- Get a default staff role (create one if it doesn't exist)
  SELECT id INTO v_role_id FROM staff_roles WHERE nom_role = 'Super Admin' LIMIT 1;
  
  IF v_role_id IS NULL THEN
    INSERT INTO staff_roles (nom_role, description)
    VALUES ('Super Admin', 'Administrateur système avec accès complet')
    RETURNING id INTO v_role_id;
  END IF;
  
  -- Insert user into staff_users using their auth.users.id
  INSERT INTO staff_users (id, nom, prenom, email, role_id, actif)
  VALUES (
    v_user_id,
    COALESCE(SPLIT_PART(v_user_email, '@', 1), 'Admin'),
    'System',
    v_user_email,
    v_role_id,
    true
  )
  RETURNING id INTO v_staff_user_id;
  
  RETURN QUERY SELECT v_staff_user_id, 'User successfully synced to staff_users'::text;
END;
$$;