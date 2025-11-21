-- Create access_scopes table for user-site assignments
CREATE TABLE IF NOT EXISTS public.access_scopes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  tenant_id UUID,
  read_only BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, site_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_access_scopes_user_id ON public.access_scopes(user_id);
CREATE INDEX IF NOT EXISTS idx_access_scopes_site_id ON public.access_scopes(site_id);
CREATE INDEX IF NOT EXISTS idx_access_scopes_tenant_id ON public.access_scopes(tenant_id);

-- Enable RLS
ALTER TABLE public.access_scopes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own access scopes"
  ON public.access_scopes FOR SELECT
  USING (
    auth.uid() = user_id 
    OR has_client_access(auth.uid(), (SELECT client_id FROM sites WHERE id = site_id))
    OR has_role(auth.uid(), 'Super Admin')
    OR has_role(auth.uid(), 'Admin Global')
  );

CREATE POLICY "Admins can manage access scopes"
  ON public.access_scopes FOR ALL
  USING (
    has_role(auth.uid(), 'Super Admin') 
    OR has_role(auth.uid(), 'Admin Global')
    OR EXISTS (
      SELECT 1 FROM client_users cu
      WHERE cu.id = auth.uid() 
      AND cu.is_client_admin = true
      AND cu.client_id = (SELECT client_id FROM sites WHERE id = access_scopes.site_id)
    )
  )
  WITH CHECK (
    has_role(auth.uid(), 'Super Admin') 
    OR has_role(auth.uid(), 'Admin Global')
    OR EXISTS (
      SELECT 1 FROM client_users cu
      WHERE cu.id = auth.uid() 
      AND cu.is_client_admin = true
      AND cu.client_id = (SELECT client_id FROM sites WHERE id = access_scopes.site_id)
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_access_scopes_updated_at
  BEFORE UPDATE ON public.access_scopes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();