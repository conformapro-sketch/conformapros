-- Create RPC function for fetching all client users with pagination and filtering
CREATE OR REPLACE FUNCTION public.get_all_client_users(
  search_term text DEFAULT NULL,
  filter_client_id uuid DEFAULT NULL,
  filter_status text DEFAULT NULL,
  page_num integer DEFAULT 1,
  page_size integer DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  email text,
  nom text,
  prenom text,
  telephone text,
  actif boolean,
  is_client_admin boolean,
  avatar_url text,
  client_id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  client_data jsonb,
  roles_data jsonb,
  sites_data jsonb,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
      cu.avatar_url,
      cu.client_id,
      cu.created_at,
      cu.updated_at
    FROM client_users cu
    WHERE 
      (filter_client_id IS NULL OR cu.client_id = filter_client_id)
      AND (filter_status IS NULL 
        OR (filter_status = 'actif' AND cu.actif = true)
        OR (filter_status = 'inactif' AND cu.actif = false))
      AND (search_term IS NULL 
        OR cu.email ILIKE '%' || search_term || '%'
        OR cu.nom ILIKE '%' || search_term || '%'
        OR cu.prenom ILIKE '%' || search_term || '%')
  ),
  counted_users AS (
    SELECT 
      fu.*,
      COUNT(*) OVER() AS total_count
    FROM filtered_users fu
    ORDER BY fu.nom, fu.prenom
    LIMIT page_size
    OFFSET (page_num - 1) * page_size
  )
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
    jsonb_build_object(
      'id', c.id,
      'nom', c.nom,
      'nom_legal', c.nom_legal,
      'logo_url', c.logo_url
    ) AS client_data,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', r.id,
            'name', r.name,
            'type', r.type
          )
        )
        FROM user_roles ur
        JOIN roles r ON r.id = ur.role_uuid
        WHERE ur.user_id = cu.id
      ),
      '[]'::jsonb
    ) AS roles_data,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', s.id,
            'nom', s.nom,
            'code_site', s.code_site,
            'access_scope_id', acs.id,
            'read_only', acs.read_only
          )
        )
        FROM access_scopes acs
        JOIN sites s ON s.id = acs.site_id
        WHERE acs.user_id = cu.id
      ),
      '[]'::jsonb
    ) AS sites_data,
    cu.total_count
  FROM counted_users cu
  LEFT JOIN clients c ON c.id = cu.client_id;
END;
$$;