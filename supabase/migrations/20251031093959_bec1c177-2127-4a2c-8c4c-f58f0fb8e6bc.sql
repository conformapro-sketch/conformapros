-- Update the user's role_uuid to point to Super Admin role
UPDATE public.user_roles
SET role_uuid = '4960596d-98b0-4abe-ae16-d7b0851e3b15'
WHERE user_id = 'a6503d44-dd93-4abb-8a31-4d6f9eb29ead'
  AND role_uuid IS NULL;

-- Verify the old 'role' column was dropped (if not, drop it)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'user_roles' 
      AND column_name = 'role'
  ) THEN
    ALTER TABLE public.user_roles DROP COLUMN role CASCADE;
  END IF;
END $$;