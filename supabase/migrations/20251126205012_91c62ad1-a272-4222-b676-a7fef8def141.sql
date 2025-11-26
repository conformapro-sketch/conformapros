-- Create staff_roles table for internal ConformaPro staff roles
CREATE TABLE IF NOT EXISTS public.staff_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom_role text NOT NULL UNIQUE,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.staff_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only authenticated users can read, only super admins can manage
CREATE POLICY "StaffRoles: authenticated can read"
ON public.staff_roles
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "StaffRoles: super_admin can manage"
ON public.staff_roles
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'Super Admin'))
WITH CHECK (has_role(auth.uid(), 'Super Admin'));

-- Trigger for updated_at
CREATE TRIGGER update_staff_roles_updated_at
BEFORE UPDATE ON public.staff_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial staff roles
INSERT INTO public.staff_roles (nom_role, description) VALUES
  ('SuperAdmin', 'Administrateur système avec tous les privilèges'),
  ('RegulatoryManager', 'Gestionnaire du contenu réglementaire (textes, articles, versions)'),
  ('Support', 'Support technique et assistance client'),
  ('Auditeur', 'Auditeur interne avec accès en lecture seule')
ON CONFLICT (nom_role) DO NOTHING;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_staff_roles_nom_role ON public.staff_roles(nom_role);