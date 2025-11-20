-- Add missing columns to site_modules
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'site_modules' AND column_name = 'enabled_at') THEN
    ALTER TABLE public.site_modules ADD COLUMN enabled_at TIMESTAMP WITH TIME ZONE DEFAULT now();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'site_modules' AND column_name = 'disabled_at') THEN
    ALTER TABLE public.site_modules ADD COLUMN disabled_at TIMESTAMP WITH TIME ZONE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'site_modules' AND column_name = 'updated_at') THEN
    ALTER TABLE public.site_modules ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
  END IF;
END $$;

DROP TRIGGER IF EXISTS update_site_modules_updated_at ON public.site_modules;
CREATE TRIGGER update_site_modules_updated_at BEFORE UPDATE ON public.site_modules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.user_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, site_id)
);

ALTER TABLE public.user_sites ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_user_sites_user_id ON public.user_sites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sites_site_id ON public.user_sites(site_id);
CREATE INDEX IF NOT EXISTS idx_site_modules_site_id ON public.site_modules(site_id);
CREATE INDEX IF NOT EXISTS idx_site_modules_module_id ON public.site_modules(module_id);
CREATE INDEX IF NOT EXISTS idx_site_modules_actif ON public.site_modules(actif) WHERE actif = true;

DROP POLICY IF EXISTS "SiteModules: read if site access" ON public.site_modules;
DROP POLICY IF EXISTS "SiteModules: super_admin manage" ON public.site_modules;
DROP POLICY IF EXISTS "SiteModules: admin_global manage" ON public.site_modules;
DROP POLICY IF EXISTS "UserSites: users can view own assignments" ON public.user_sites;
DROP POLICY IF EXISTS "UserSites: super_admin manage" ON public.user_sites;
DROP POLICY IF EXISTS "UserSites: admin_global manage" ON public.user_sites;

CREATE POLICY "SiteModules: read if site access" ON public.site_modules FOR SELECT TO authenticated
USING (has_site_access(auth.uid(), site_id));

CREATE POLICY "SiteModules: super_admin manage" ON public.site_modules FOR ALL TO authenticated
USING (has_role(auth.uid(), 'Super Admin'::text))
WITH CHECK (has_role(auth.uid(), 'Super Admin'::text));

CREATE POLICY "SiteModules: admin_global manage" ON public.site_modules FOR ALL TO authenticated
USING (has_role(auth.uid(), 'Admin Global'::text))
WITH CHECK (has_role(auth.uid(), 'Admin Global'::text));

CREATE POLICY "UserSites: users can view own assignments" ON public.user_sites FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "UserSites: super_admin manage" ON public.user_sites FOR ALL TO authenticated
USING (has_role(auth.uid(), 'Super Admin'::text))
WITH CHECK (has_role(auth.uid(), 'Super Admin'::text));

CREATE POLICY "UserSites: admin_global manage" ON public.user_sites FOR ALL TO authenticated
USING (has_role(auth.uid(), 'Admin Global'::text))
WITH CHECK (has_role(auth.uid(), 'Admin Global'::text));

CREATE OR REPLACE FUNCTION public.is_module_enabled_for_site(_site_id UUID, _module_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.site_modules
    WHERE site_id = _site_id AND module_id = _module_id AND actif = true
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_sites(_user_id UUID)
RETURNS TABLE (site_id UUID, site_name TEXT, client_id UUID, client_name TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT s.id, s.nom, c.id, c.nom FROM public.user_sites us
  JOIN public.sites s ON s.id = us.site_id
  JOIN public.clients c ON c.id = s.client_id
  WHERE us.user_id = _user_id
  UNION
  SELECT s.id, s.nom, c.id, c.nom FROM public.sites s
  JOIN public.clients c ON c.id = s.client_id
  WHERE EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_uuid
    WHERE ur.user_id = _user_id AND r.type = 'team' AND (r.name = 'Super Admin' OR r.name = 'Admin Global')
  );
$$;

CREATE OR REPLACE FUNCTION public.get_site_enabled_modules(_site_id UUID)
RETURNS TABLE (module_id UUID, code TEXT, libelle TEXT, description TEXT, icon TEXT, couleur TEXT, ordre INTEGER)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT m.id, m.code, m.libelle, m.description, m.icon, m.couleur, m.ordre
  FROM public.modules_systeme m
  JOIN public.site_modules sm ON sm.module_id = m.id
  WHERE sm.site_id = _site_id AND sm.actif = true AND m.actif = true
  ORDER BY m.ordre;
$$;