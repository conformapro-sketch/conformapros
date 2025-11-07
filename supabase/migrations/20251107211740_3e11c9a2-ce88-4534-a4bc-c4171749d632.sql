-- Fix foreign key constraints for created_by and updated_by in user_permissions
-- These should reference profiles(id) not client_users(id) since Super Admins
-- (who are in profiles but not in client_users) also need to manage permissions

-- Drop the incorrect foreign keys
ALTER TABLE public.user_permissions 
  DROP CONSTRAINT IF EXISTS user_permissions_created_by_fkey;

ALTER TABLE public.user_permissions 
  DROP CONSTRAINT IF EXISTS user_permissions_updated_by_fkey;

-- Add correct foreign keys pointing to profiles table
ALTER TABLE public.user_permissions
  ADD CONSTRAINT user_permissions_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.user_permissions
  ADD CONSTRAINT user_permissions_updated_by_fkey 
  FOREIGN KEY (updated_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Add helpful comments
COMMENT ON COLUMN public.user_permissions.created_by IS 'User who created this permission (references profiles, can be staff or client admin)';
COMMENT ON COLUMN public.user_permissions.updated_by IS 'User who last updated this permission (references profiles, can be staff or client admin)';