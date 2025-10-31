-- Create modules_systeme table (master list of available modules)
CREATE TABLE IF NOT EXISTS public.modules_systeme (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  libelle text NOT NULL,
  description text,
  actif boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create site_modules table (tracks which modules are enabled per site)
CREATE TABLE IF NOT EXISTS public.site_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.modules_systeme(id) ON DELETE CASCADE,
  enabled boolean DEFAULT true,
  enabled_at timestamptz DEFAULT now(),
  enabled_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(site_id, module_id)
);

-- Create site_veille_domaines table (tracks regulatory domains for veille module per site)
CREATE TABLE IF NOT EXISTS public.site_veille_domaines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  domaine_id uuid NOT NULL REFERENCES public.domaines_reglementaires(id) ON DELETE CASCADE,
  enabled boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(site_id, domaine_id)
);

-- Enable RLS
ALTER TABLE public.modules_systeme ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_veille_domaines ENABLE ROW LEVEL SECURITY;

-- RLS Policies for modules_systeme (read-only reference data)
CREATE POLICY "ModulesSysteme: authenticated can read"
ON public.modules_systeme
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "ModulesSysteme: super_admin manage"
ON public.modules_systeme
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- RLS Policies for site_modules
CREATE POLICY "SiteModules: read if site access"
ON public.site_modules
FOR SELECT
TO authenticated
USING (public.has_site_access(auth.uid(), site_id));

CREATE POLICY "SiteModules: manage if site access"
ON public.site_modules
FOR ALL
TO authenticated
USING (public.has_site_access(auth.uid(), site_id))
WITH CHECK (public.has_site_access(auth.uid(), site_id));

-- RLS Policies for site_veille_domaines
CREATE POLICY "SiteVeilleDomaines: read if site access"
ON public.site_veille_domaines
FOR SELECT
TO authenticated
USING (public.has_site_access(auth.uid(), site_id));

CREATE POLICY "SiteVeilleDomaines: manage if site access"
ON public.site_veille_domaines
FOR ALL
TO authenticated
USING (public.has_site_access(auth.uid(), site_id))
WITH CHECK (public.has_site_access(auth.uid(), site_id));

-- Add triggers for updated_at
CREATE TRIGGER update_modules_systeme_updated_at
BEFORE UPDATE ON public.modules_systeme
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_site_modules_updated_at
BEFORE UPDATE ON public.site_modules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial system modules
INSERT INTO public.modules_systeme (code, libelle, description, actif) VALUES
('VEILLE', 'Veille réglementaire', 'Suivi des évolutions réglementaires et alertes', true),
('BIBLIOTHEQUE', 'Bibliothèque réglementaire', 'Accès à la base de textes et articles réglementaires', true),
('CONTROLES', 'Contrôles techniques', 'Gestion des contrôles périodiques d''équipements', true),
('CONFORMITE', 'Évaluation de conformité', 'Évaluation et suivi de la conformité réglementaire', true),
('INCIDENTS', 'Gestion des incidents', 'Déclaration et suivi des incidents', true),
('VISITES_MED', 'Visites médicales', 'Planification et suivi des visites médicales', true),
('EPI', 'Gestion des EPI', 'Gestion des équipements de protection individuelle', true)
ON CONFLICT (code) DO NOTHING;