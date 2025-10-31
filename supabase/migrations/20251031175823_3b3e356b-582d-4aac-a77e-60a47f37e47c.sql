-- Update get_all_client_users function to allow Admin Global and Client Admins
CREATE OR REPLACE FUNCTION public.get_all_client_users(
  search_term TEXT DEFAULT NULL,
  filter_client_id UUID DEFAULT NULL,
  filter_status TEXT DEFAULT NULL,
  page_num INT DEFAULT 1,
  page_size INT DEFAULT 10
)
RETURNS TABLE(
  id UUID,
  email TEXT,
  nom TEXT,
  prenom TEXT,
  telephone TEXT,
  actif BOOLEAN,
  is_client_admin BOOLEAN,
  managed_client_id UUID,
  tenant_id UUID,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  client_data JSONB,
  roles_data JSONB,
  sites_data JSONB,
  total_count BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  offset_val INT;
BEGIN
  -- Authorization: Super Admin or Admin Global see all. 
  -- Client admins can see only when filtering a client they can access.
  IF NOT (
    has_role(auth.uid(), 'super_admin'::app_role) OR
    has_role(auth.uid(), 'admin_global') OR
    (filter_client_id IS NOT NULL AND has_client_access(auth.uid(), filter_client_id))
  ) THEN
    RAISE EXCEPTION 'Not authorized to view client users';
  END IF;

  offset_val := (page_num - 1) * page_size;

  RETURN QUERY
  WITH filtered_profiles AS (
    SELECT 
      p.id,
      p.email,
      p.nom,
      p.prenom,
      p.telephone,
      p.actif,
      p.is_client_admin,
      p.managed_client_id,
      p.tenant_id,
      p.avatar_url,
      p.created_at,
      p.updated_at
    FROM public.profiles p
    WHERE p.managed_client_id IS NOT NULL  -- Only client users
      AND (search_term IS NULL OR (
        p.email ILIKE '%' || search_term || '%' OR
        p.nom ILIKE '%' || search_term || '%' OR
        p.prenom ILIKE '%' || search_term || '%'
      ))
      AND (filter_client_id IS NULL OR p.managed_client_id = filter_client_id)
      AND (filter_status IS NULL OR 
        (filter_status = 'actif' AND p.actif = true) OR
        (filter_status = 'inactif' AND p.actif = false)
      )
    ORDER BY p.created_at DESC
  ),
  total AS (
    SELECT COUNT(*) as cnt FROM filtered_profiles
  )
  SELECT 
    fp.id,
    fp.email,
    fp.nom,
    fp.prenom,
    fp.telephone,
    fp.actif,
    fp.is_client_admin,
    fp.managed_client_id,
    fp.tenant_id,
    fp.avatar_url,
    fp.created_at,
    fp.updated_at,
    COALESCE(
      jsonb_build_object(
        'id', c.id,
        'nom', c.nom,
        'nom_legal', c.nom_legal,
        'logo_url', c.logo_url
      ),
      '{}'::jsonb
    ) as client_data,
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
        WHERE ur.user_id = fp.id
      ),
      '[]'::jsonb
    ) as roles_data,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'site_id', s.id,
            'nom_site', s.nom_site
          )
        )
        FROM public.access_scopes acs
        LEFT JOIN public.sites s ON s.id = acs.site_id
        WHERE acs.user_id = fp.id
      ),
      '[]'::jsonb
    ) as sites_data,
    (SELECT cnt FROM total) as total_count
  FROM filtered_profiles fp
  LEFT JOIN public.clients c ON c.id = fp.managed_client_id
  LIMIT page_size
  OFFSET offset_val;
END;
$$;