-- Fix function search path security warning
-- Set immutable search_path for all functions to prevent privilege escalation

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_uuid
    WHERE ur.user_id = _user_id
      AND (
        LOWER(REPLACE(r.name, ' ', '_')) = LOWER(_role)
        OR r.name = _role
        OR ur.role::TEXT = _role
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.has_client_access(_user_id UUID, _client_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO public, pg_temp
AS $$
  SELECT EXISTS (
    -- Team users with super admin or admin global roles have access to all clients
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_uuid
    WHERE ur.user_id = _user_id
      AND r.type = 'team'
      AND (r.name = 'Super Admin' OR r.name = 'Admin Global')
  ) OR EXISTS (
    -- Users assigned to specific client
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id AND ur.client_id = _client_id
  ) OR EXISTS (
    -- Client users
    SELECT 1 FROM public.client_users cu
    WHERE cu.id = _user_id AND cu.client_id = _client_id
  );
$$;

CREATE OR REPLACE FUNCTION public.has_site_access(_user_id UUID, _site_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.sites s ON s.client_id = ur.client_id
    WHERE ur.user_id = _user_id AND s.id = _site_id
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_uuid
    WHERE ur.user_id = _user_id
      AND r.type = 'team'
      AND (r.name = 'Super Admin' OR r.name = 'Admin Global')
  ) OR EXISTS (
    SELECT 1 FROM public.client_users cu
    JOIN public.sites s ON s.client_id = cu.client_id
    WHERE cu.id = _user_id AND s.id = _site_id
  );
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nom, prenom)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'nom', NEW.raw_user_meta_data->>'prenom')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;