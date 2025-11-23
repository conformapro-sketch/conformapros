-- Phase 1: Add site_id column to user_permissions for site-specific permissions
ALTER TABLE public.user_permissions 
ADD COLUMN IF NOT EXISTS site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_permissions_site_id 
ON public.user_permissions(site_id);

CREATE INDEX IF NOT EXISTS idx_user_permissions_user_site 
ON public.user_permissions(user_id, site_id);

-- Phase 2: Create function to get user's sites with permission counts
CREATE OR REPLACE FUNCTION public.get_user_sites_with_permissions(p_user_id UUID)
RETURNS TABLE(
  site_id UUID,
  site_name TEXT,
  site_active BOOLEAN,
  permission_count BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as site_id,
    s.nom as site_name,
    TRUE as site_active,
    COUNT(DISTINCT up.id) as permission_count
  FROM sites s
  INNER JOIN access_scopes acs ON acs.site_id = s.id
  LEFT JOIN user_permissions up ON up.site_id = s.id AND up.user_id = p_user_id
  WHERE acs.user_id = p_user_id
  GROUP BY s.id, s.nom
  ORDER BY s.nom;
END;
$$;

-- Phase 3.1: Function to retrieve site-specific permissions
CREATE OR REPLACE FUNCTION public.get_site_permissions(
  p_user_id UUID,
  p_site_id UUID
)
RETURNS TABLE(
  module TEXT,
  action TEXT,
  decision permission_decision,
  scope permission_scope
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.module,
    up.action,
    up.decision,
    up.scope
  FROM user_permissions up
  WHERE up.user_id = p_user_id 
    AND up.site_id = p_site_id;
END;
$$;

-- Phase 3.2: Function to save site-specific permissions
CREATE OR REPLACE FUNCTION public.save_site_permissions(
  p_user_id UUID,
  p_site_id UUID,
  p_client_id UUID,
  p_permissions JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  perm JSONB;
BEGIN
  -- Delete existing site-specific permissions for this user/site
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
END;
$$;

-- Phase 4: Function to set user domain scopes
CREATE OR REPLACE FUNCTION public.set_user_domain_scopes(
  target_user_id UUID,
  domaine_ids UUID[]
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Delete existing domains
  DELETE FROM user_domain_scopes 
  WHERE user_id = target_user_id;

  -- Insert new domains
  IF array_length(domaine_ids, 1) > 0 THEN
    INSERT INTO user_domain_scopes (user_id, domaine_id)
    SELECT target_user_id, unnest(domaine_ids);
  END IF;
END;
$$;

-- Phase 5: Create user_domain_scopes table if not exists
CREATE TABLE IF NOT EXISTS public.user_domain_scopes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  domaine_id UUID NOT NULL REFERENCES public.domaines_reglementaires(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, domaine_id)
);

CREATE INDEX IF NOT EXISTS idx_user_domain_scopes_user 
ON user_domain_scopes(user_id);

CREATE INDEX IF NOT EXISTS idx_user_domain_scopes_domaine 
ON user_domain_scopes(domaine_id);

-- RLS policies for user_domain_scopes
ALTER TABLE user_domain_scopes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own domains" ON user_domain_scopes;
CREATE POLICY "Users can view their own domains"
ON user_domain_scopes FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all domains" ON user_domain_scopes;
CREATE POLICY "Admins can manage all domains"
ON user_domain_scopes FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'Super Admin') OR 
  has_role(auth.uid(), 'Admin Global')
)
WITH CHECK (
  has_role(auth.uid(), 'Super Admin') OR 
  has_role(auth.uid(), 'Admin Global')
);