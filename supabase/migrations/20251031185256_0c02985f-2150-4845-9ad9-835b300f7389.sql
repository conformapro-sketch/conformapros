-- Step 1: Create public.client_users table
CREATE TABLE public.client_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nom TEXT,
  prenom TEXT,
  telephone TEXT,
  avatar_url TEXT,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  is_client_admin BOOLEAN NOT NULL DEFAULT false,
  tenant_id UUID,
  actif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_client_users_client_id ON public.client_users(client_id);
CREATE INDEX idx_client_users_email ON public.client_users(email);
CREATE INDEX idx_client_users_is_client_admin ON public.client_users(is_client_admin) WHERE is_client_admin = true;

-- Add trigger to auto-update updated_at
CREATE TRIGGER update_client_users_updated_at
  BEFORE UPDATE ON public.client_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Step 2: Enable RLS
ALTER TABLE public.client_users ENABLE ROW LEVEL SECURITY;

-- Super Admin full access
CREATE POLICY "ClientUsers: super_admin full access"
  ON public.client_users
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'Super Admin'))
  WITH CHECK (has_role(auth.uid(), 'Super Admin'));

-- Admin Global full access
CREATE POLICY "ClientUsers: admin_global full access"
  ON public.client_users
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'Admin Global'))
  WITH CHECK (has_role(auth.uid(), 'Admin Global'));

-- Client admins can view users of their client
CREATE POLICY "ClientUsers: client_admin can view same client"
  ON public.client_users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.client_users me
      WHERE me.id = auth.uid()
        AND me.client_id = client_users.client_id
        AND me.is_client_admin = true
    )
  );

-- Client admins can manage non-admin users of their client
CREATE POLICY "ClientUsers: client_admin can manage non-admins"
  ON public.client_users
  FOR ALL
  TO authenticated
  USING (
    client_users.is_client_admin = false
    AND EXISTS (
      SELECT 1 FROM public.client_users me
      WHERE me.id = auth.uid()
        AND me.client_id = client_users.client_id
        AND me.is_client_admin = true
    )
  )
  WITH CHECK (
    client_users.is_client_admin = false
    AND EXISTS (
      SELECT 1 FROM public.client_users me
      WHERE me.id = auth.uid()
        AND me.client_id = client_users.client_id
        AND me.is_client_admin = true
    )
  );

-- Self read access
CREATE POLICY "ClientUsers: users can view own record"
  ON public.client_users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Self limited update (for profile edits)
CREATE POLICY "ClientUsers: users can update own record"
  ON public.client_users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Step 3: Backfill data from profiles
INSERT INTO public.client_users (
  id, email, nom, prenom, telephone, avatar_url, 
  client_id, is_client_admin, tenant_id, actif, 
  created_at, updated_at
)
SELECT 
  id, email, nom, prenom, telephone, avatar_url,
  managed_client_id, is_client_admin, tenant_id, actif,
  created_at, updated_at
FROM public.profiles
WHERE managed_client_id IS NOT NULL
ON CONFLICT (id) DO NOTHING;