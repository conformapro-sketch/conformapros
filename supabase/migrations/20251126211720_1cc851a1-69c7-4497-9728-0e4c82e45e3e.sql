-- Create client-logos storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-logos', 'client-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for client-logos bucket
DROP POLICY IF EXISTS "Client admins can upload their logo" ON storage.objects;
CREATE POLICY "Client admins can upload their logo"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'client-logos' AND 
  EXISTS (
    SELECT 1 FROM client_users 
    WHERE client_users.id = auth.uid() 
    AND client_users.is_client_admin = true
  )
);

DROP POLICY IF EXISTS "Client admins can update their logo" ON storage.objects;
CREATE POLICY "Client admins can update their logo"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'client-logos' AND 
  EXISTS (
    SELECT 1 FROM client_users 
    WHERE client_users.id = auth.uid() 
    AND client_users.is_client_admin = true
  )
);

DROP POLICY IF EXISTS "Client logos are publicly accessible" ON storage.objects;
CREATE POLICY "Client logos are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'client-logos');