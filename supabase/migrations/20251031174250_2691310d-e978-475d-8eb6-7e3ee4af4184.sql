-- Phase 1: Add avatar support to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Phase 2: Create user_domain_scopes table for regulatory domain access per user
CREATE TABLE IF NOT EXISTS public.user_domain_scopes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  domaine_id UUID NOT NULL REFERENCES public.domaines_reglementaires(id) ON DELETE CASCADE,
  decision permission_decision NOT NULL DEFAULT 'allow',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, domaine_id)
);

-- Enable RLS
ALTER TABLE public.user_domain_scopes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_domain_scopes
CREATE POLICY "UserDomainScopes: super_admin can manage all"
ON public.user_domain_scopes
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "UserDomainScopes: client admin can manage own client users"
ON public.user_domain_scopes
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = user_domain_scopes.user_id
    AND can_manage_client_user(auth.uid(), p.id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = user_domain_scopes.user_id
    AND can_manage_client_user(auth.uid(), p.id)
  )
);

CREATE POLICY "UserDomainScopes: users can view their own"
ON public.user_domain_scopes
FOR SELECT
USING (user_id = auth.uid());

-- Phase 3: RPC to get all client users with pagination (security definer to bypass RLS)
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
  -- Authorization: only Super Admin or users with admin_global role can access
  IF NOT (has_role(auth.uid(), 'super_admin'::app_role)) THEN
    RAISE EXCEPTION 'Not authorized: only Super Admins can view all client users';
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

-- Phase 4: RPC to set user domain scopes atomically
CREATE OR REPLACE FUNCTION public.set_user_domain_scopes(
  target_user_id UUID,
  domaine_ids UUID[]
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Authorization: only Super Admin or client admin managing same client
  IF NOT (
    has_role(auth.uid(), 'super_admin'::app_role) OR
    can_manage_client_user(auth.uid(), target_user_id)
  ) THEN
    RAISE EXCEPTION 'Not authorized to manage domain scopes for this user';
  END IF;

  -- Delete all existing scopes for this user
  DELETE FROM public.user_domain_scopes
  WHERE user_id = target_user_id;

  -- Insert new scopes
  IF domaine_ids IS NOT NULL AND array_length(domaine_ids, 1) > 0 THEN
    INSERT INTO public.user_domain_scopes (user_id, domaine_id, decision)
    SELECT target_user_id, unnest(domaine_ids), 'allow';
  END IF;

  -- Log to audit
  INSERT INTO public.role_audit_logs (user_id, action, entity_type, entity_id, changes)
  VALUES (
    auth.uid(),
    'update_domain_scopes',
    'user',
    target_user_id,
    jsonb_build_object('domaine_ids', domaine_ids)
  );
END;
$$;