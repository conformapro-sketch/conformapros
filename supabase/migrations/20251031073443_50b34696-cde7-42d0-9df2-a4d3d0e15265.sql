-- Create role type enum
CREATE TYPE public.role_type AS ENUM ('team', 'client');

-- Create decision type enum
CREATE TYPE public.permission_decision AS ENUM ('allow', 'deny', 'inherit');

-- Create scope type enum
CREATE TYPE public.permission_scope AS ENUM ('global', 'tenant', 'site');

-- Create roles table (replaces enum-based roles)
CREATE TABLE public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type role_type NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT false,
  tenant_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  archived_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(name, tenant_id, type)
);

-- Create permissions table
CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  decision permission_decision NOT NULL DEFAULT 'allow',
  scope permission_scope NOT NULL DEFAULT 'tenant',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(role_id, module, action)
);

-- Create audit logs table
CREATE TABLE public.role_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  changes JSONB,
  tenant_id UUID REFERENCES public.clients(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Update user_roles to reference new roles table and add site scoping
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS role_uuid UUID REFERENCES public.roles(id) ON DELETE CASCADE;
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS site_scope UUID[] DEFAULT NULL;

-- Enable RLS
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for roles
CREATE POLICY "Roles: super_admin can manage all"
  ON public.roles FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Roles: client admin can manage own tenant client roles"
  ON public.roles FOR ALL
  USING (
    type = 'client' AND 
    tenant_id IS NOT NULL AND 
    has_client_access(auth.uid(), tenant_id)
  )
  WITH CHECK (
    type = 'client' AND 
    tenant_id IS NOT NULL AND 
    has_client_access(auth.uid(), tenant_id)
  );

CREATE POLICY "Roles: users can view their assigned roles"
  ON public.roles FOR SELECT
  USING (
    id IN (
      SELECT role_uuid FROM public.user_roles WHERE user_id = auth.uid()
    )
  );

-- RLS policies for permissions
CREATE POLICY "Permissions: super_admin can manage all"
  ON public.role_permissions FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Permissions: client admin can manage own tenant roles"
  ON public.role_permissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.roles r
      WHERE r.id = role_permissions.role_id
        AND r.type = 'client'
        AND r.tenant_id IS NOT NULL
        AND has_client_access(auth.uid(), r.tenant_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.roles r
      WHERE r.id = role_permissions.role_id
        AND r.type = 'client'
        AND r.tenant_id IS NOT NULL
        AND has_client_access(auth.uid(), r.tenant_id)
    )
  );

CREATE POLICY "Permissions: users can view permissions for their roles"
  ON public.role_permissions FOR SELECT
  USING (
    role_id IN (
      SELECT role_uuid FROM public.user_roles WHERE user_id = auth.uid()
    )
  );

-- RLS policies for audit logs
CREATE POLICY "AuditLogs: super_admin can view all"
  ON public.role_audit_logs FOR SELECT
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "AuditLogs: client admin can view own tenant"
  ON public.role_audit_logs FOR SELECT
  USING (
    tenant_id IS NOT NULL AND 
    has_client_access(auth.uid(), tenant_id)
  );

CREATE POLICY "AuditLogs: authenticated can insert"
  ON public.role_audit_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON public.roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert system team roles
INSERT INTO public.roles (type, name, description, is_system) VALUES
  ('team', 'Super Admin', 'Full system access across all tenants', true),
  ('team', 'Admin Global', 'Administrative access to platform management', true),
  ('team', 'Manager HSE', 'HSE management and oversight', true),
  ('team', 'Analyst', 'Data analysis and reporting', true),
  ('team', 'Viewer', 'Read-only access to system data', true);

-- Insert system client role presets (these are templates, actual roles created per tenant)
INSERT INTO public.roles (type, name, description, is_system) VALUES
  ('client', 'Owner', 'Full access to tenant data and settings', true),
  ('client', 'Admin', 'Administrative access within tenant', true),
  ('client', 'Site Manager', 'Manage specific sites', true),
  ('client', 'Contributor', 'Create and edit content', true),
  ('client', 'Read-only', 'View-only access', true);

-- Seed permissions for Super Admin (all modules, all actions)
DO $$
DECLARE
  v_super_admin_role_id UUID;
  v_modules TEXT[] := ARRAY[
    'bibliotheque', 'veille', 'evaluation', 'matrice', 'plan_action', 
    'audits', 'incidents', 'equipements', 'formations', 'clients', 
    'sites', 'factures', 'abonnements', 'utilisateurs', 'roles', 'rapports'
  ];
  v_actions TEXT[] := ARRAY[
    'view', 'create', 'edit', 'delete', 'export', 'assign', 'bulk_edit', 'upload_proof'
  ];
  v_module TEXT;
  v_action TEXT;
BEGIN
  SELECT id INTO v_super_admin_role_id FROM public.roles WHERE name = 'Super Admin' AND type = 'team';
  
  FOREACH v_module IN ARRAY v_modules LOOP
    FOREACH v_action IN ARRAY v_actions LOOP
      INSERT INTO public.role_permissions (role_id, module, action, decision, scope)
      VALUES (v_super_admin_role_id, v_module, v_action, 'allow', 'global');
    END LOOP;
  END LOOP;
END $$;