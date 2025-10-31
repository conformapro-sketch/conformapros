-- Add site_id column to user_permissions for site-specific permissions
ALTER TABLE public.user_permissions 
ADD COLUMN site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE;

-- Add index for performance
CREATE INDEX idx_user_permissions_site_id ON public.user_permissions(site_id);

-- Add index for common query pattern (user + site)
CREATE INDEX idx_user_permissions_user_site ON public.user_permissions(user_id, site_id);

-- Create function to get user's accessible sites with permissions count
CREATE OR REPLACE FUNCTION public.get_user_sites_with_permissions(p_user_id UUID)
RETURNS TABLE(
  site_id UUID,
  site_name TEXT,
  site_active BOOLEAN,
  permission_count BIGINT
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as site_id,
    s.nom as site_name,
    s.actif as site_active,
    COUNT(up.id) as permission_count
  FROM public.sites s
  INNER JOIN public.client_users cu ON cu.client_id = s.client_id
  LEFT JOIN public.user_permissions up ON up.site_id = s.id AND up.user_id = p_user_id
  WHERE cu.id = p_user_id
  GROUP BY s.id, s.nom, s.actif
  ORDER BY s.nom;
END;
$$;