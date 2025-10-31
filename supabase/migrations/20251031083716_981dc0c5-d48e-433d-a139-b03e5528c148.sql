-- Create tenants table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on tenants
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Add missing columns to clients table
ALTER TABLE public.clients 
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS rne_rc TEXT,
  ADD COLUMN IF NOT EXISTS secteur TEXT,
  ADD COLUMN IF NOT EXISTS gouvernorat TEXT,
  ADD COLUMN IF NOT EXISTS delegation TEXT,
  ADD COLUMN IF NOT EXISTS adresse_siege TEXT,
  ADD COLUMN IF NOT EXISTS site_web TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS couleur_primaire TEXT,
  ADD COLUMN IF NOT EXISTS billing_mode TEXT DEFAULT 'client',
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'TND',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create index on tenant_id for performance
CREATE INDEX IF NOT EXISTS idx_clients_tenant_id ON public.clients(tenant_id);

-- Create index on secteur for filtering
CREATE INDEX IF NOT EXISTS idx_clients_secteur ON public.clients(secteur);

-- Create index on gouvernorat for filtering
CREATE INDEX IF NOT EXISTS idx_clients_gouvernorat ON public.clients(gouvernorat);

-- Update profiles table to have tenant_id if it doesn't exist
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL;

-- Create index on profiles.tenant_id
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON public.profiles(tenant_id);

-- RLS policies for tenants
CREATE POLICY "Tenants: users can view their own tenant" 
ON public.tenants 
FOR SELECT 
USING (id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Tenants: super_admin can manage all" 
ON public.tenants 
FOR ALL 
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Update trigger for tenants
CREATE TRIGGER update_tenants_updated_at
BEFORE UPDATE ON public.tenants
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();