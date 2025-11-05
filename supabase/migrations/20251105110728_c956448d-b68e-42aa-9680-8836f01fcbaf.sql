-- Create user_permissions table for individual client user permissions
CREATE TABLE IF NOT EXISTS public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('allow', 'deny')),
  scope TEXT NOT NULL CHECK (scope IN ('global', 'tenant', 'site')) DEFAULT 'tenant',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, client_id, module, action)
);

-- Enable RLS
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "UserPermissions: super_admin full access" ON public.user_permissions;
DROP POLICY IF EXISTS "UserPermissions: client_admin can manage own tenant" ON public.user_permissions;
DROP POLICY IF EXISTS "UserPermissions: users can view own" ON public.user_permissions;

-- RLS Policies for user_permissions
CREATE POLICY "UserPermissions: super_admin full access"
ON public.user_permissions
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "UserPermissions: client_admin can manage own tenant"
ON public.user_permissions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM client_users cu
    WHERE cu.id = auth.uid()
    AND cu.client_id = user_permissions.client_id
    AND cu.is_client_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM client_users cu
    WHERE cu.id = auth.uid()
    AND cu.client_id = user_permissions.client_id
    AND cu.is_client_admin = true
  )
);

CREATE POLICY "UserPermissions: users can view own"
ON public.user_permissions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Clean up dual identities: Remove profiles for users who are ONLY client users
DELETE FROM public.profiles 
WHERE id IN (
  SELECT cu.id 
  FROM client_users cu
  WHERE NOT EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = cu.id
  )
);

-- Update RLS on domaines_reglementaires to restrict to team only
DROP POLICY IF EXISTS "Domaines: read" ON public.domaines_reglementaires;
DROP POLICY IF EXISTS "Domaines: team members only" ON public.domaines_reglementaires;
DROP POLICY IF EXISTS "Content: super_admin manage" ON public.domaines_reglementaires;

CREATE POLICY "Domaines: team members only"
ON public.domaines_reglementaires
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_uuid
    WHERE ur.user_id = auth.uid()
    AND r.type = 'team'
  )
);

CREATE POLICY "Content: super_admin manage"
ON public.domaines_reglementaires
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));