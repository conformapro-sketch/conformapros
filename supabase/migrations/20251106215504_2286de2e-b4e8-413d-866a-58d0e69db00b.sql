-- Phase 1: Dynamic Permissions System - Database Schema

-- =====================================================
-- 1.1 Create permission_actions Table (Static Reference)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.permission_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert standard actions
INSERT INTO public.permission_actions (code, label, display_order) VALUES
  ('view', 'Voir', 1),
  ('create', 'Créer', 2),
  ('edit', 'Modifier', 3),
  ('delete', 'Supprimer', 4),
  ('export', 'Exporter', 5),
  ('assign', 'Assigner', 6),
  ('bulk_edit', 'Modification en masse', 7),
  ('upload_proof', 'Télécharger preuve', 8),
  ('approve', 'Approuver', 9)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- 1.2 Create module_features Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.module_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.modules_systeme(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  actif BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(module_id, code)
);

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_module_features_module ON public.module_features(module_id);
CREATE INDEX IF NOT EXISTS idx_module_features_active ON public.module_features(actif);

-- Enable RLS
ALTER TABLE public.module_features ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "ModuleFeatures: authenticated can read active"
ON public.module_features FOR SELECT TO authenticated
USING (actif = true);

CREATE POLICY "ModuleFeatures: super_admin can manage"
ON public.module_features FOR ALL TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- =====================================================
-- 1.3 Add New FK Columns to Permission Tables
-- =====================================================
-- Add to role_permissions (keeping old TEXT columns temporarily)
ALTER TABLE public.role_permissions
  ADD COLUMN IF NOT EXISTS module_id UUID REFERENCES public.modules_systeme(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS feature_id UUID REFERENCES public.module_features(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS action_id UUID REFERENCES public.permission_actions(id) ON DELETE CASCADE;

-- Add to user_permissions (keeping old TEXT columns temporarily)
ALTER TABLE public.user_permissions
  ADD COLUMN IF NOT EXISTS module_id UUID REFERENCES public.modules_systeme(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS feature_id UUID REFERENCES public.module_features(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS action_id UUID REFERENCES public.permission_actions(id) ON DELETE CASCADE;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_role_permissions_module ON public.role_permissions(module_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_feature ON public.role_permissions(feature_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_action ON public.role_permissions(action_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_module ON public.user_permissions(module_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_feature ON public.user_permissions(feature_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_action ON public.user_permissions(action_id);

-- =====================================================
-- 1.4 Auto-Generation Function for New Modules
-- =====================================================
CREATE OR REPLACE FUNCTION public.auto_generate_permissions_for_module()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action RECORD;
  v_role RECORD;
  v_client_user RECORD;
BEGIN
  -- Only auto-generate if module is active
  IF NEW.actif = false THEN
    RETURN NEW;
  END IF;

  -- For each permission action
  FOR v_action IN SELECT id FROM public.permission_actions ORDER BY display_order LOOP
    
    -- Generate role_permissions for all staff roles
    FOR v_role IN SELECT id FROM public.roles WHERE type = 'team' AND archived_at IS NULL LOOP
      INSERT INTO public.role_permissions (
        role_id, module_id, action_id, decision, scope
      ) VALUES (
        v_role.id, NEW.id, v_action.id, 'inherit', 'tenant'
      ) ON CONFLICT DO NOTHING;
    END LOOP;

    -- Generate user_permissions for all active client users
    FOR v_client_user IN SELECT id, client_id FROM public.client_users WHERE actif = true LOOP
      INSERT INTO public.user_permissions (
        user_id, client_id, module_id, action_id, decision, scope
      ) VALUES (
        v_client_user.id, v_client_user.client_id, NEW.id, v_action.id, 'deny', 'site'
      ) ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Trigger for new modules
DROP TRIGGER IF EXISTS trigger_auto_generate_module_permissions ON public.modules_systeme;
CREATE TRIGGER trigger_auto_generate_module_permissions
AFTER INSERT ON public.modules_systeme
FOR EACH ROW
EXECUTE FUNCTION public.auto_generate_permissions_for_module();

-- =====================================================
-- 1.5 Auto-Generation Function for New Features
-- =====================================================
CREATE OR REPLACE FUNCTION public.auto_generate_permissions_for_feature()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action RECORD;
  v_role RECORD;
  v_client_user RECORD;
BEGIN
  -- Only auto-generate if feature is active
  IF NEW.actif = false THEN
    RETURN NEW;
  END IF;

  -- For each permission action
  FOR v_action IN SELECT id FROM public.permission_actions ORDER BY display_order LOOP
    
    -- Generate role_permissions for all staff roles
    FOR v_role IN SELECT id FROM public.roles WHERE type = 'team' AND archived_at IS NULL LOOP
      INSERT INTO public.role_permissions (
        role_id, module_id, feature_id, action_id, decision, scope
      ) VALUES (
        v_role.id, NEW.module_id, NEW.id, v_action.id, 'inherit', 'tenant'
      ) ON CONFLICT DO NOTHING;
    END LOOP;

    -- Generate user_permissions for all active client users
    FOR v_client_user IN SELECT id, client_id FROM public.client_users WHERE actif = true LOOP
      INSERT INTO public.user_permissions (
        user_id, client_id, module_id, feature_id, action_id, decision, scope
      ) VALUES (
        v_client_user.id, v_client_user.client_id, NEW.module_id, NEW.id, v_action.id, 'deny', 'site'
      ) ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Trigger for new features
DROP TRIGGER IF EXISTS trigger_auto_generate_feature_permissions ON public.module_features;
CREATE TRIGGER trigger_auto_generate_feature_permissions
AFTER INSERT ON public.module_features
FOR EACH ROW
EXECUTE FUNCTION public.auto_generate_permissions_for_feature();

-- =====================================================
-- 1.6 Backfill Existing Permissions with FK References
-- =====================================================

-- Map TEXT-based modules to module_id for role_permissions
UPDATE public.role_permissions rp
SET module_id = m.id
FROM public.modules_systeme m
WHERE LOWER(m.code) = LOWER(rp.module)
  AND rp.module_id IS NULL
  AND rp.module IS NOT NULL;

-- Map TEXT-based modules to module_id for user_permissions
UPDATE public.user_permissions up
SET module_id = m.id
FROM public.modules_systeme m
WHERE LOWER(m.code) = LOWER(up.module)
  AND up.module_id IS NULL
  AND up.module IS NOT NULL;

-- Map TEXT-based actions to action_id for role_permissions
UPDATE public.role_permissions rp
SET action_id = pa.id
FROM public.permission_actions pa
WHERE LOWER(pa.code) = LOWER(rp.action)
  AND rp.action_id IS NULL
  AND rp.action IS NOT NULL;

-- Map TEXT-based actions to action_id for user_permissions
UPDATE public.user_permissions up
SET action_id = pa.id
FROM public.permission_actions pa
WHERE LOWER(pa.code) = LOWER(up.action)
  AND up.action_id IS NULL
  AND up.action IS NOT NULL;

-- =====================================================
-- Update Triggers for module_features
-- =====================================================
CREATE TRIGGER update_module_features_updated_at
BEFORE UPDATE ON public.module_features
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- RLS Policy for permission_actions
-- =====================================================
ALTER TABLE public.permission_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "PermissionActions: authenticated can read"
ON public.permission_actions FOR SELECT TO authenticated
USING (true);

CREATE POLICY "PermissionActions: super_admin can manage"
ON public.permission_actions FOR ALL TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));