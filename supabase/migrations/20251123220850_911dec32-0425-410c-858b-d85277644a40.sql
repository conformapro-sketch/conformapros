-- ================================================================
-- PHASE 1: DATABASE ARCHITECTURE HARDENING
-- ================================================================

-- 1.1 User Management Audit Table
-- ================================================================
CREATE TABLE IF NOT EXISTS public.user_management_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type text NOT NULL CHECK (action_type IN ('create', 'update', 'delete', 'permission_change', 'site_assignment', 'role_change')),
  target_user_id uuid NOT NULL,
  performed_by uuid NOT NULL,
  client_id uuid REFERENCES public.clients(id),
  site_id uuid REFERENCES public.sites(id),
  before_state jsonb,
  after_state jsonb,
  changes jsonb,
  ip_address text,
  user_agent text,
  session_id text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_user_management_audit_target ON public.user_management_audit(target_user_id);
CREATE INDEX idx_user_management_audit_performer ON public.user_management_audit(performed_by);
CREATE INDEX idx_user_management_audit_client ON public.user_management_audit(client_id);
CREATE INDEX idx_user_management_audit_created ON public.user_management_audit(created_at DESC);

ALTER TABLE public.user_management_audit ENABLE ROW LEVEL SECURITY;

-- RLS: Staff can view all audit logs, client admins can view their client's logs
CREATE POLICY "Audit: staff view all"
ON public.user_management_audit FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'Super Admin')
  OR has_role(auth.uid(), 'Admin Global')
);

CREATE POLICY "Audit: client admins view own client"
ON public.user_management_audit FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.client_users cu
    WHERE cu.id = auth.uid()
      AND cu.is_client_admin = true
      AND cu.client_id = user_management_audit.client_id
  )
);

-- 1.2 Database Views for Optimized Queries
-- ================================================================

-- Staff overview: comprehensive user data across all clients
CREATE OR REPLACE VIEW public.v_staff_client_users_overview AS
SELECT 
  cu.id,
  cu.email,
  cu.nom,
  cu.prenom,
  cu.telephone,
  cu.actif,
  cu.is_client_admin,
  cu.avatar_url,
  cu.client_id,
  cu.created_at,
  cu.updated_at,
  c.nom as client_name,
  c.logo_url as client_logo,
  -- Count of assigned sites
  (SELECT COUNT(*) FROM access_scopes acs WHERE acs.user_id = cu.id) as site_count,
  -- Count of permissions
  (SELECT COUNT(*) FROM user_permissions up WHERE up.user_id = cu.id) as permission_count,
  -- Last login (if we track this)
  NULL::timestamptz as last_login,
  -- Roles array
  COALESCE(
    (SELECT jsonb_agg(jsonb_build_object('id', r.id, 'name', r.name, 'type', r.type))
     FROM user_roles ur
     JOIN roles r ON r.id = ur.role_uuid
     WHERE ur.user_id = cu.id),
    '[]'::jsonb
  ) as roles,
  -- Sites array
  COALESCE(
    (SELECT jsonb_agg(jsonb_build_object('id', s.id, 'nom', s.nom, 'code_site', s.code_site))
     FROM access_scopes acs
     JOIN sites s ON s.id = acs.site_id
     WHERE acs.user_id = cu.id),
    '[]'::jsonb
  ) as sites
FROM public.client_users cu
JOIN public.clients c ON c.id = cu.client_id;

-- Client admin overview: limited to their own client
CREATE OR REPLACE VIEW public.v_client_admin_users_overview AS
SELECT 
  cu.id,
  cu.email,
  cu.nom,
  cu.prenom,
  cu.telephone,
  cu.actif,
  cu.is_client_admin,
  cu.avatar_url,
  cu.client_id,
  cu.created_at,
  cu.updated_at,
  -- Count of assigned sites
  (SELECT COUNT(*) FROM access_scopes acs WHERE acs.user_id = cu.id) as site_count,
  -- Count of permissions
  (SELECT COUNT(*) FROM user_permissions up WHERE up.user_id = cu.id) as permission_count,
  -- Roles array
  COALESCE(
    (SELECT jsonb_agg(jsonb_build_object('id', r.id, 'name', r.name))
     FROM user_roles ur
     JOIN roles r ON r.id = ur.role_uuid
     WHERE ur.user_id = cu.id AND r.type = 'client'),
    '[]'::jsonb
  ) as roles,
  -- Sites array
  COALESCE(
    (SELECT jsonb_agg(jsonb_build_object('id', s.id, 'nom', s.nom))
     FROM access_scopes acs
     JOIN sites s ON s.id = acs.site_id
     WHERE acs.user_id = cu.id),
    '[]'::jsonb
  ) as sites
FROM public.client_users cu;

-- 1.3 Validation Function
-- ================================================================
CREATE OR REPLACE FUNCTION public.validate_site_permissions(
  p_user_id uuid,
  p_site_id uuid,
  p_permissions jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  validation_result jsonb := '{"valid": true, "errors": []}'::jsonb;
  perm jsonb;
  module_enabled boolean;
BEGIN
  -- Check if site exists
  IF NOT EXISTS (SELECT 1 FROM sites WHERE id = p_site_id) THEN
    validation_result := jsonb_set(validation_result, '{valid}', 'false');
    validation_result := jsonb_set(validation_result, '{errors}', 
      (validation_result->'errors') || '["Site does not exist"]'::jsonb);
  END IF;

  -- Validate each permission
  FOR perm IN SELECT * FROM jsonb_array_elements(p_permissions)
  LOOP
    -- Check if module is enabled for the site
    SELECT EXISTS (
      SELECT 1 FROM site_modules sm
      JOIN modules_systeme ms ON ms.id = sm.module_id
      WHERE sm.site_id = p_site_id 
        AND sm.actif = true
        AND LOWER(ms.code) = LOWER(perm->>'module')
    ) INTO module_enabled;

    IF NOT module_enabled THEN
      validation_result := jsonb_set(validation_result, '{valid}', 'false');
      validation_result := jsonb_set(validation_result, '{errors}', 
        (validation_result->'errors') || jsonb_build_array(
          'Module ' || (perm->>'module') || ' is not enabled for this site'
        ));
    END IF;
  END LOOP;

  RETURN validation_result;
END;
$$;

-- 1.4 Staff Management Functions
-- ================================================================
CREATE OR REPLACE FUNCTION public.staff_get_user_overview(
  p_search text DEFAULT NULL,
  p_client_id uuid DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 20
)
RETURNS TABLE(
  id uuid,
  email text,
  nom text,
  prenom text,
  telephone text,
  actif boolean,
  is_client_admin boolean,
  avatar_url text,
  client_id uuid,
  client_name text,
  client_logo text,
  site_count bigint,
  permission_count bigint,
  roles jsonb,
  sites jsonb,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only staff can call this
  IF NOT (has_role(auth.uid(), 'Super Admin') OR has_role(auth.uid(), 'Admin Global')) THEN
    RAISE EXCEPTION 'Access denied: staff only';
  END IF;

  RETURN QUERY
  WITH filtered_users AS (
    SELECT v.*
    FROM v_staff_client_users_overview v
    WHERE 
      (p_client_id IS NULL OR v.client_id = p_client_id)
      AND (p_status IS NULL 
        OR (p_status = 'actif' AND v.actif = true)
        OR (p_status = 'inactif' AND v.actif = false))
      AND (p_search IS NULL 
        OR v.email ILIKE '%' || p_search || '%'
        OR v.nom ILIKE '%' || p_search || '%'
        OR v.prenom ILIKE '%' || p_search || '%')
  ),
  counted AS (
    SELECT 
      fu.*,
      COUNT(*) OVER() as total_count
    FROM filtered_users fu
    ORDER BY fu.nom, fu.prenom
    LIMIT p_page_size
    OFFSET (p_page - 1) * p_page_size
  )
  SELECT 
    c.id,
    c.email,
    c.nom,
    c.prenom,
    c.telephone,
    c.actif,
    c.is_client_admin,
    c.avatar_url,
    c.client_id,
    c.client_name,
    c.client_logo,
    c.site_count,
    c.permission_count,
    c.roles,
    c.sites,
    c.total_count
  FROM counted c;
END;
$$;

-- 1.5 Client Admin Management Functions
-- ================================================================
CREATE OR REPLACE FUNCTION public.client_admin_get_user_overview(
  p_search text DEFAULT NULL,
  p_site_id uuid DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 20
)
RETURNS TABLE(
  id uuid,
  email text,
  nom text,
  prenom text,
  telephone text,
  actif boolean,
  is_client_admin boolean,
  avatar_url text,
  site_count bigint,
  permission_count bigint,
  roles jsonb,
  sites jsonb,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_client_id uuid;
BEGIN
  -- Get the client_id of the calling admin
  SELECT client_id INTO admin_client_id
  FROM client_users
  WHERE id = auth.uid() AND is_client_admin = true;

  IF admin_client_id IS NULL THEN
    RAISE EXCEPTION 'Access denied: client admin only';
  END IF;

  RETURN QUERY
  WITH filtered_users AS (
    SELECT v.*
    FROM v_client_admin_users_overview v
    WHERE 
      v.client_id = admin_client_id
      AND (p_status IS NULL 
        OR (p_status = 'actif' AND v.actif = true)
        OR (p_status = 'inactif' AND v.actif = false))
      AND (p_search IS NULL 
        OR v.email ILIKE '%' || p_search || '%'
        OR v.nom ILIKE '%' || p_search || '%'
        OR v.prenom ILIKE '%' || p_search || '%')
      AND (p_site_id IS NULL OR EXISTS (
        SELECT 1 FROM access_scopes acs
        WHERE acs.user_id = v.id AND acs.site_id = p_site_id
      ))
  ),
  counted AS (
    SELECT 
      fu.*,
      COUNT(*) OVER() as total_count
    FROM filtered_users fu
    ORDER BY fu.nom, fu.prenom
    LIMIT p_page_size
    OFFSET (p_page - 1) * p_page_size
  )
  SELECT 
    c.id,
    c.email,
    c.nom,
    c.prenom,
    c.telephone,
    c.actif,
    c.is_client_admin,
    c.avatar_url,
    c.site_count,
    c.permission_count,
    c.roles,
    c.sites,
    c.total_count
  FROM counted c;
END;
$$;

-- 1.6 Audit Logging Helper
-- ================================================================
CREATE OR REPLACE FUNCTION public.log_user_management_action(
  p_action_type text,
  p_target_user_id uuid,
  p_client_id uuid DEFAULT NULL,
  p_site_id uuid DEFAULT NULL,
  p_before_state jsonb DEFAULT NULL,
  p_after_state jsonb DEFAULT NULL,
  p_changes jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  audit_id uuid;
BEGIN
  INSERT INTO user_management_audit (
    action_type,
    target_user_id,
    performed_by,
    client_id,
    site_id,
    before_state,
    after_state,
    changes
  ) VALUES (
    p_action_type,
    p_target_user_id,
    auth.uid(),
    p_client_id,
    p_site_id,
    p_before_state,
    p_after_state,
    p_changes
  )
  RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$$;

-- Update save_site_permissions to log changes
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
  before_perms jsonb;
BEGIN
  -- Capture before state
  SELECT jsonb_agg(
    jsonb_build_object(
      'module', module,
      'action', action,
      'decision', decision,
      'scope', scope
    )
  ) INTO before_perms
  FROM user_permissions
  WHERE user_id = p_user_id AND site_id = p_site_id;

  -- Delete existing site-specific permissions
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

  -- Log the change
  PERFORM log_user_management_action(
    'permission_change',
    p_user_id,
    p_client_id,
    p_site_id,
    jsonb_build_object('permissions', before_perms),
    jsonb_build_object('permissions', p_permissions),
    jsonb_build_object('site_id', p_site_id)
  );

EXCEPTION
  WHEN others THEN
    RAISE EXCEPTION 'Error in save_site_permissions: %', SQLERRM;
END;
$$;