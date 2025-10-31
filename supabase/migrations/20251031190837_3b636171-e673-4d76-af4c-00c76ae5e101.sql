-- Create the missing access_scopes table
CREATE TABLE IF NOT EXISTS public.access_scopes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  site_id uuid REFERENCES public.sites(id) ON DELETE CASCADE NOT NULL,
  tenant_id uuid,
  read_only boolean DEFAULT false NOT NULL,
  created_by uuid,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, site_id)
);

-- Enable RLS
ALTER TABLE public.access_scopes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for access_scopes
CREATE POLICY "AccessScopes: super_admin can manage all"
  ON public.access_scopes
  FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "AccessScopes: client_admin can manage own client"
  ON public.access_scopes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM client_users cu
      WHERE cu.id = auth.uid()
      AND cu.tenant_id = access_scopes.tenant_id
      AND cu.is_client_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM client_users cu
      WHERE cu.id = auth.uid()
      AND cu.tenant_id = access_scopes.tenant_id
      AND cu.is_client_admin = true
    )
  );

CREATE POLICY "AccessScopes: users can view own"
  ON public.access_scopes
  FOR SELECT
  USING (user_id = auth.uid());

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_access_scopes_user ON access_scopes(user_id);
CREATE INDEX IF NOT EXISTS idx_access_scopes_site ON access_scopes(site_id);
CREATE INDEX IF NOT EXISTS idx_access_scopes_tenant ON access_scopes(tenant_id);

CREATE INDEX IF NOT EXISTS idx_client_users_tenant_id ON client_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_client_users_client_tenant ON client_users(client_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_site ON user_permissions(user_id, site_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_site ON user_permissions(site_id);

-- Create helper function for fetching user sites with permissions
CREATE OR REPLACE FUNCTION public.get_user_sites_with_permissions(p_user_id uuid)
RETURNS TABLE(
  site_id uuid, 
  site_name text, 
  site_active boolean, 
  permission_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as site_id,
    s.nom_site as site_name,
    s.actif as site_active,
    COUNT(DISTINCT up.id) as permission_count
  FROM sites s
  INNER JOIN access_scopes acs ON acs.site_id = s.id
  LEFT JOIN user_permissions up ON up.site_id = s.id AND up.user_id = p_user_id
  WHERE acs.user_id = p_user_id
  GROUP BY s.id, s.nom_site, s.actif
  ORDER BY s.nom_site;
END;
$function$;

-- Trigger for updated_at
CREATE TRIGGER update_access_scopes_updated_at
  BEFORE UPDATE ON public.access_scopes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();