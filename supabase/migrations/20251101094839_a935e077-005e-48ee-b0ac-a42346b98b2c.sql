-- Fix get_all_client_users authorization logic
CREATE OR REPLACE FUNCTION public.get_all_client_users(
  search_term text DEFAULT NULL::text,
  filter_client_id uuid DEFAULT NULL::uuid,
  filter_status text DEFAULT NULL::text,
  page_num integer DEFAULT 1,
  page_size integer DEFAULT 10
)
RETURNS TABLE(
  id uuid,
  email text,
  nom text,
  prenom text,
  telephone text,
  actif boolean,
  is_client_admin boolean,
  client_id uuid,
  tenant_id uuid,
  avatar_url text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  client_data jsonb,
  roles_data jsonb,
  sites_data jsonb,
  total_count bigint
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  offset_val INT;
  is_super_admin BOOLEAN;
  is_admin_global BOOLEAN;
BEGIN
  -- Authorization check
  SELECT has_role(auth.uid(), 'Super Admin') INTO is_super_admin;
  SELECT has_role(auth.uid(), 'Admin Global') INTO is_admin_global;
  
  -- Fixed authorization logic: Super Admin and Admin Global have full access
  IF NOT (is_super_admin OR is_admin_global) THEN
    -- For non-admin users, require specific client filter
    IF filter_client_id IS NULL THEN
      RAISE EXCEPTION 'Not authorized to view all client users';
    ELSIF NOT has_client_access(auth.uid(), filter_client_id) THEN
      RAISE EXCEPTION 'Not authorized to view this client users';
    END IF;
  END IF;

  offset_val := (page_num - 1) * page_size;

  RETURN QUERY
  WITH filtered_users AS (
    SELECT 
      cu.id,
      cu.email,
      cu.nom,
      cu.prenom,
      cu.telephone,
      cu.actif,
      cu.is_client_admin,
      cu.client_id,
      cu.tenant_id,
      cu.avatar_url,
      cu.created_at,
      cu.updated_at
    FROM public.client_users cu
    WHERE (search_term IS NULL OR (
      cu.email ILIKE '%' || search_term || '%' OR
      cu.nom ILIKE '%' || search_term || '%' OR
      cu.prenom ILIKE '%' || search_term || '%'
    ))
    AND (filter_client_id IS NULL OR cu.client_id = filter_client_id)
    AND (filter_status IS NULL OR 
      (filter_status = 'actif' AND cu.actif = true) OR
      (filter_status = 'inactif' AND cu.actif = false)
    )
    ORDER BY cu.created_at DESC
  ),
  total AS (
    SELECT COUNT(*) as cnt FROM filtered_users
  )
  SELECT 
    fu.id,
    fu.email,
    fu.nom,
    fu.prenom,
    fu.telephone,
    fu.actif,
    fu.is_client_admin,
    fu.client_id,
    fu.tenant_id,
    fu.avatar_url,
    fu.created_at,
    fu.updated_at,
    -- Client data
    COALESCE(
      jsonb_build_object(
        'id', c.id,
        'nom', c.nom,
        'nom_legal', c.nom_legal,
        'logo_url', c.logo_url
      ),
      '{}'::jsonb
    ) as client_data,
    -- Roles data
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', ur.id,
            'role_uuid', ur.role_uuid,
            'client_id', ur.client_id,
            'roles', jsonb_build_object(
              'id', r.id,
              'name', r.name,
              'description', r.description,
              'type', r.type
            )
          )
        )
        FROM public.user_roles ur
        LEFT JOIN public.roles r ON r.id = ur.role_uuid
        WHERE ur.user_id = fu.id
      ),
      '[]'::jsonb
    ) as roles_data,
    -- Sites data
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'site_id', acs.site_id,
            'nom_site', s.nom_site,
            'read_only', acs.read_only,
            'created_at', acs.created_at
          )
        )
        FROM public.access_scopes acs
        LEFT JOIN public.sites s ON s.id = acs.site_id
        WHERE acs.user_id = fu.id
      ),
      '[]'::jsonb
    ) as sites_data,
    (SELECT cnt FROM total) as total_count
  FROM filtered_users fu
  LEFT JOIN public.clients c ON c.id = fu.client_id
  LIMIT page_size
  OFFSET offset_val;
END;
$function$;