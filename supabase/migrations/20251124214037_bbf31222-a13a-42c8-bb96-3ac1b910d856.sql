-- Phase 1: Critical Database Fixes

-- 1. Add enabled_by column to site_modules
ALTER TABLE site_modules 
ADD COLUMN IF NOT EXISTS enabled_by UUID REFERENCES auth.users(id);

-- 2. Add deleted_at to codes_juridiques (if not exists)
ALTER TABLE codes_juridiques 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_site_modules_site_id ON site_modules(site_id) WHERE actif = true;
CREATE INDEX IF NOT EXISTS idx_site_modules_module_id ON site_modules(module_id) WHERE actif = true;
CREATE INDEX IF NOT EXISTS idx_access_scopes_user_id ON access_scopes(user_id);
CREATE INDEX IF NOT EXISTS idx_access_scopes_site_id ON access_scopes(site_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_site ON user_permissions(user_id, site_id);
CREATE INDEX IF NOT EXISTS idx_client_users_client_id ON client_users(client_id) WHERE actif = true;
CREATE INDEX IF NOT EXISTS idx_sites_client_id ON sites(client_id);

-- 4. Create RPC for bulk site modules fetch (performance optimization)
CREATE OR REPLACE FUNCTION get_bulk_site_modules(site_ids UUID[])
RETURNS TABLE(
  site_id UUID,
  modules JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sm.site_id,
    jsonb_agg(
      jsonb_build_object(
        'id', m.id,
        'code', m.code,
        'libelle', m.libelle,
        'icon', m.icon,
        'couleur', m.couleur
      )
    ) as modules
  FROM site_modules sm
  JOIN modules_systeme m ON m.id = sm.module_id
  WHERE sm.site_id = ANY(site_ids)
    AND sm.actif = true
    AND m.actif = true
  GROUP BY sm.site_id;
END;
$$;

-- 5. Fix get_all_client_users RPC to use correct column names
DROP FUNCTION IF EXISTS get_all_client_users(text, uuid, text, integer, integer);

CREATE OR REPLACE FUNCTION get_all_client_users(
  search_term text DEFAULT NULL,
  filter_client_id uuid DEFAULT NULL,
  filter_status text DEFAULT NULL,
  page_num integer DEFAULT 1,
  page_size integer DEFAULT 20
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
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  client_data jsonb,
  roles_data jsonb,
  sites_data jsonb,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
            'site_id', s.id,
            'nom_site', s.nom,
            'code_site', s.code_site,
            'gouvernorat', s.gouvernorat,
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