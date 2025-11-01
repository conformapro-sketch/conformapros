-- Fix get_user_sites_with_permissions function
-- The function was referencing s.actif which doesn't exist in sites table
CREATE OR REPLACE FUNCTION public.get_user_sites_with_permissions(p_user_id uuid)
 RETURNS TABLE(site_id uuid, site_name text, site_active boolean, permission_count bigint)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as site_id,
    s.nom_site as site_name,
    TRUE as site_active,  -- Sites table doesn't have actif column, assume all are active
    COUNT(DISTINCT up.id) as permission_count
  FROM sites s
  INNER JOIN access_scopes acs ON acs.site_id = s.id
  LEFT JOIN user_permissions up ON up.site_id = s.id AND up.user_id = p_user_id
  WHERE acs.user_id = p_user_id
  GROUP BY s.id, s.nom_site
  ORDER BY s.nom_site;
END;
$function$;