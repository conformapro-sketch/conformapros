-- Phase 1: Add actif column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS actif boolean DEFAULT true NOT NULL;

-- Update existing users to active
UPDATE public.profiles 
SET actif = true 
WHERE actif IS NULL;

-- Phase 2: Add RLS policy for user_roles INSERT
CREATE POLICY "UserRoles: allow super admin and system inserts"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR user_id = auth.uid()
);

-- Phase 3: Fix orphaned users - assign default Viewer role
-- First, ensure a Viewer role exists for team type
INSERT INTO public.roles (name, description, type, is_system)
SELECT 'Viewer', 'Read-only access to the system', 'team'::role_type, false
WHERE NOT EXISTS (
  SELECT 1 FROM public.roles WHERE name = 'Viewer' AND type = 'team'::role_type
);

-- Now assign Viewer role to users without role assignments
INSERT INTO public.user_roles (user_id, role_uuid)
SELECT DISTINCT
  p.id as user_id,
  r.id as role_uuid
FROM profiles p
CROSS JOIN roles r
WHERE r.name = 'Viewer'
  AND r.type = 'team'::role_type
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur WHERE ur.user_id = p.id
  );