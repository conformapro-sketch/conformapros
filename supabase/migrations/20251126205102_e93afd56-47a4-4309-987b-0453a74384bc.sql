-- Create staff_users table for ConformaPro internal staff
CREATE TABLE IF NOT EXISTS public.staff_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nom text NOT NULL,
  prenom text NOT NULL,
  email text NOT NULL UNIQUE,
  role_id uuid NOT NULL REFERENCES public.staff_roles(id) ON DELETE RESTRICT,
  actif boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.staff_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Staff users can read their own data and SuperAdmin can manage all
CREATE POLICY "StaffUsers: users can read own data"
ON public.staff_users
FOR SELECT
TO authenticated
USING (id = auth.uid() OR has_role(auth.uid(), 'Super Admin'));

CREATE POLICY "StaffUsers: super_admin can manage"
ON public.staff_users
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'Super Admin'))
WITH CHECK (has_role(auth.uid(), 'Super Admin'));

-- Trigger for updated_at
CREATE TRIGGER update_staff_users_updated_at
BEFORE UPDATE ON public.staff_users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_staff_users_email ON public.staff_users(email);
CREATE INDEX IF NOT EXISTS idx_staff_users_role_id ON public.staff_users(role_id);
CREATE INDEX IF NOT EXISTS idx_staff_users_actif ON public.staff_users(actif);

-- Add comment to clarify table purpose
COMMENT ON TABLE public.staff_users IS 'ConformaPro internal staff users - completely separate from client_users table';