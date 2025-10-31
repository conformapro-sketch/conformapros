-- Allow the handle_new_user trigger (SECURITY DEFINER) to insert profiles
-- This policy allows authenticated users to insert their own profile (id = auth.uid())
CREATE POLICY "Profiles: allow insert on signup"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());