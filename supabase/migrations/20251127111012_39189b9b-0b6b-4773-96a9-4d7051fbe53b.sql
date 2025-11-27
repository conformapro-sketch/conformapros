CREATE OR REPLACE FUNCTION public.save_site_permissions(p_user_id uuid, p_site_id uuid, p_client_id uuid, p_permissions jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
        v_decision::permission_decision,
        v_scope::permission_scope
      );
    END IF;
  END LOOP;

  -- Log the action with correct action type
  PERFORM log_user_management_action(
    'permission_change',
    p_user_id,
    p_client_id,
    p_site_id,
    NULL,
    jsonb_build_object(
      'permission_count', jsonb_array_length(p_permissions)
    ),
    NULL
  );
END;
$function$;