-- Add tenant_id column to sites table for multi-tenant filtering
-- This is denormalized from clients.tenant_id for query performance
ALTER TABLE public.sites 
ADD COLUMN IF NOT EXISTS tenant_id uuid;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_sites_tenant_id ON public.sites(tenant_id);

-- Backfill existing sites with their client's tenant_id
UPDATE public.sites s
SET tenant_id = c.tenant_id
FROM public.clients c
WHERE s.client_id = c.id
  AND s.tenant_id IS NULL;

-- Drop old RLS policies
DROP POLICY IF EXISTS "Sites: read if has access" ON public.sites;
DROP POLICY IF EXISTS "Sites: super_admin or client access can insert" ON public.sites;
DROP POLICY IF EXISTS "Sites: manage if client access" ON public.sites;
DROP POLICY IF EXISTS "Sites: super_admin manage" ON public.sites;

-- SELECT policy: allow if user has site access or is super_admin
CREATE POLICY "Sites: read if has access"
ON public.sites
FOR SELECT
TO authenticated
USING (
  has_site_access(auth.uid(), id)
  OR has_role(auth.uid(), 'super_admin')
);

-- INSERT policy: allow super_admin or users with client access
CREATE POLICY "Sites: insert if authorized"
ON public.sites
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'super_admin')
  OR has_client_access(auth.uid(), client_id)
);

-- UPDATE policy: allow super_admin or users with client access
CREATE POLICY "Sites: update if authorized"
ON public.sites
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'super_admin')
  OR has_client_access(auth.uid(), client_id)
)
WITH CHECK (
  has_role(auth.uid(), 'super_admin')
  OR has_client_access(auth.uid(), client_id)
);

-- DELETE policy: super_admin only
CREATE POLICY "Sites: delete if super_admin"
ON public.sites
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'super_admin'));