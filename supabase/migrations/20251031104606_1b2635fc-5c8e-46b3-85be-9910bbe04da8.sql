-- Update has_role() to accept text and normalize role names
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_uuid
    WHERE ur.user_id = _user_id
      AND (
        r.name = _role
        OR lower(replace(r.name, ' ', '_')) = lower(replace(_role, ' ', '_'))
      )
  );
$$;

-- Update has_client_access() to use text for super admin check
CREATE OR REPLACE FUNCTION public.has_client_access(_user_id uuid, _client_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_uuid
    WHERE ur.user_id = _user_id
      AND lower(replace(r.name, ' ', '_')) = 'super_admin'
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.client_id = _client_id
  );
$$;

-- Update has_site_access() to use text for super admin check and check via client
CREATE OR REPLACE FUNCTION public.has_site_access(_user_id uuid, _site_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_uuid
    WHERE ur.user_id = _user_id
      AND lower(replace(r.name, ' ', '_')) = 'super_admin'
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.sites s ON s.client_id = ur.client_id
    WHERE ur.user_id = _user_id
      AND s.id = _site_id
  );
$$;