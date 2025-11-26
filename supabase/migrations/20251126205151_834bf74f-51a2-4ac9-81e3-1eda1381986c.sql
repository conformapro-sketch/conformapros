-- Create staff_role_permissions table for granular staff permissions
CREATE TABLE IF NOT EXISTS public.staff_role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES public.staff_roles(id) ON DELETE CASCADE,
  permission_key text NOT NULL,
  autorise boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(role_id, permission_key)
);

-- Enable RLS
ALTER TABLE public.staff_role_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Authenticated users can read, only super admins can manage
CREATE POLICY "StaffRolePermissions: authenticated can read"
ON public.staff_role_permissions
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "StaffRolePermissions: super_admin can manage"
ON public.staff_role_permissions
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'Super Admin'))
WITH CHECK (has_role(auth.uid(), 'Super Admin'));

-- Trigger for updated_at
CREATE TRIGGER update_staff_role_permissions_updated_at
BEFORE UPDATE ON public.staff_role_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_staff_role_permissions_role_id ON public.staff_role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_staff_role_permissions_key ON public.staff_role_permissions(permission_key);

-- Seed permissions for SuperAdmin role (all permissions)
DO $$
DECLARE
  v_superadmin_role_id uuid;
  v_regulatory_manager_role_id uuid;
  v_support_role_id uuid;
  v_auditeur_role_id uuid;
BEGIN
  -- Get role IDs
  SELECT id INTO v_superadmin_role_id FROM public.staff_roles WHERE nom_role = 'SuperAdmin';
  SELECT id INTO v_regulatory_manager_role_id FROM public.staff_roles WHERE nom_role = 'RegulatoryManager';
  SELECT id INTO v_support_role_id FROM public.staff_roles WHERE nom_role = 'Support';
  SELECT id INTO v_auditeur_role_id FROM public.staff_roles WHERE nom_role = 'Auditeur';

  -- SuperAdmin: all permissions
  INSERT INTO public.staff_role_permissions (role_id, permission_key, autorise) VALUES
    (v_superadmin_role_id, 'manage_textes', true),
    (v_superadmin_role_id, 'manage_articles', true),
    (v_superadmin_role_id, 'manage_versions', true),
    (v_superadmin_role_id, 'manage_clients', true),
    (v_superadmin_role_id, 'manage_modules', true),
    (v_superadmin_role_id, 'manage_users', true),
    (v_superadmin_role_id, 'manage_sites', true),
    (v_superadmin_role_id, 'view_all_sites', true),
    (v_superadmin_role_id, 'edit_domains', true),
    (v_superadmin_role_id, 'manage_autorites', true),
    (v_superadmin_role_id, 'manage_codes', true),
    (v_superadmin_role_id, 'manage_tags', true),
    (v_superadmin_role_id, 'manage_staff', true)
  ON CONFLICT (role_id, permission_key) DO NOTHING;

  -- RegulatoryManager: regulatory content management
  INSERT INTO public.staff_role_permissions (role_id, permission_key, autorise) VALUES
    (v_regulatory_manager_role_id, 'manage_textes', true),
    (v_regulatory_manager_role_id, 'manage_articles', true),
    (v_regulatory_manager_role_id, 'manage_versions', true),
    (v_regulatory_manager_role_id, 'edit_domains', true),
    (v_regulatory_manager_role_id, 'manage_autorites', true),
    (v_regulatory_manager_role_id, 'manage_codes', true),
    (v_regulatory_manager_role_id, 'manage_tags', true),
    (v_regulatory_manager_role_id, 'view_all_sites', true)
  ON CONFLICT (role_id, permission_key) DO NOTHING;

  -- Support: read access and limited client management
  INSERT INTO public.staff_role_permissions (role_id, permission_key, autorise) VALUES
    (v_support_role_id, 'view_all_sites', true),
    (v_support_role_id, 'manage_users', true)
  ON CONFLICT (role_id, permission_key) DO NOTHING;

  -- Auditeur: read-only access
  INSERT INTO public.staff_role_permissions (role_id, permission_key, autorise) VALUES
    (v_auditeur_role_id, 'view_all_sites', true)
  ON CONFLICT (role_id, permission_key) DO NOTHING;
END $$;

-- Add comment
COMMENT ON TABLE public.staff_role_permissions IS 'Granular permissions for staff roles - defines what each staff role can do';