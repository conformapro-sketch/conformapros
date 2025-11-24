-- =====================================================
-- PERMISSION HIERARCHY VALIDATION
-- =====================================================
-- Drop existing validate_site_permissions function first
DROP FUNCTION IF EXISTS validate_site_permissions(uuid, uuid, jsonb);
DROP FUNCTION IF EXISTS validate_site_permissions(jsonb);

-- Create new validate_site_permissions function to enforce hierarchy
CREATE FUNCTION validate_site_permissions(
  p_permissions jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_permission jsonb;
  v_module text;
  v_action text;
  v_decision text;
  v_view_decision text;
BEGIN
  -- Iterate through each permission
  FOR v_permission IN SELECT * FROM jsonb_array_elements(p_permissions)
  LOOP
    v_module := v_permission->>'module';
    v_action := v_permission->>'action';
    v_decision := v_permission->>'decision';
    
    -- If action is create/edit/delete/export and decision is 'allow'
    IF v_action IN ('create', 'edit', 'delete', 'export') AND v_decision = 'allow' THEN
      -- Check if 'view' permission exists and is 'allow'
      SELECT v_perm->>'decision' INTO v_view_decision
      FROM jsonb_array_elements(p_permissions) v_perm
      WHERE v_perm->>'module' = v_module 
        AND v_perm->>'action' = 'view';
      
      -- If view is not explicitly allowed, reject
      IF v_view_decision IS NULL OR v_view_decision != 'allow' THEN
        RAISE EXCEPTION 'Permission hierarchy violation: % action requires view permission for module %', v_action, v_module;
      END IF;
    END IF;
  END LOOP;
  
  RETURN true;
END;
$$;

-- Update save_site_permissions to use validation
CREATE OR REPLACE FUNCTION save_site_permissions(
  p_user_id uuid,
  p_site_id uuid,
  p_client_id uuid,
  p_permissions jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_permission jsonb;
  v_module text;
  v_action text;
  v_decision text;
  v_scope text;
BEGIN
  -- Validate permission hierarchy
  PERFORM validate_site_permissions(p_permissions);
  
  -- Delete existing permissions for this user/site combination
  DELETE FROM user_permissions
  WHERE user_id = p_user_id
    AND site_id = p_site_id
    AND client_id = p_client_id;

  -- Insert new permissions
  FOR v_permission IN SELECT * FROM jsonb_array_elements(p_permissions)
  LOOP
    v_module := v_permission->>'module';
    v_action := v_permission->>'action';
    v_decision := v_permission->>'decision';
    v_scope := COALESCE(v_permission->>'scope', 'site');
    
    -- Only insert if decision is not 'inherit'
    IF v_decision IN ('allow', 'deny') THEN
      INSERT INTO user_permissions (
        user_id,
        client_id,
        site_id,
        module,
        action,
        decision,
        scope
      ) VALUES (
        p_user_id,
        p_client_id,
        p_site_id,
        v_module,
        v_action,
        v_decision::text,
        v_scope::text
      );
    END IF;
  END LOOP;

  -- Log the action
  PERFORM log_user_management_action(
    'set_permissions',
    'user_permissions',
    p_user_id::text,
    jsonb_build_object(
      'site_id', p_site_id,
      'permission_count', jsonb_array_length(p_permissions)
    ),
    p_client_id
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION validate_site_permissions(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION save_site_permissions(uuid, uuid, uuid, jsonb) TO authenticated;