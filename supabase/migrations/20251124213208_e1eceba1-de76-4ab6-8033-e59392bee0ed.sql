-- Fix missing columns and tables for client user management

-- 1. Add missing columns to domaines_reglementaires
ALTER TABLE public.domaines_reglementaires 
ADD COLUMN IF NOT EXISTS actif BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 2. Add missing columns to permission_actions
ALTER TABLE public.permission_actions 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS label TEXT;

-- Update label from nom where it's null
UPDATE public.permission_actions SET label = nom WHERE label IS NULL;

-- 3. Add missing columns to module_features
ALTER TABLE public.module_features 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS actif BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 4. Add missing columns to modules_systeme (rename ordre to display_order for consistency)
ALTER TABLE public.modules_systeme 
ADD COLUMN IF NOT EXISTS display_order INTEGER;

-- Copy ordre values to display_order
UPDATE public.modules_systeme SET display_order = ordre WHERE display_order IS NULL;

-- 5. Create site_veille_domaines table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.site_veille_domaines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  domaine_id UUID NOT NULL REFERENCES public.domaines_reglementaires(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(site_id, domaine_id)
);

-- Enable RLS on site_veille_domaines
ALTER TABLE public.site_veille_domaines ENABLE ROW LEVEL SECURITY;

-- RLS policies for site_veille_domaines
CREATE POLICY "SiteVeilleDomaines: read if site access" ON public.site_veille_domaines
FOR SELECT TO authenticated
USING (public.has_site_access(auth.uid(), site_id));

CREATE POLICY "SiteVeilleDomaines: manage if site access" ON public.site_veille_domaines
FOR ALL TO authenticated
USING (public.has_site_access(auth.uid(), site_id))
WITH CHECK (public.has_site_access(auth.uid(), site_id));

-- Add trigger for updated_at on site_veille_domaines
CREATE TRIGGER update_site_veille_domaines_updated_at 
BEFORE UPDATE ON public.site_veille_domaines 
FOR EACH ROW 
EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for updated_at on module_features
CREATE TRIGGER update_module_features_updated_at 
BEFORE UPDATE ON public.module_features 
FOR EACH ROW 
EXECUTE FUNCTION public.update_updated_at_column();