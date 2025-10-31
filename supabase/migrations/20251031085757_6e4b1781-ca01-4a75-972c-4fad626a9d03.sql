-- Create storage bucket for client logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-logos', 'client-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for client logos
CREATE POLICY "Client logos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'client-logos');

CREATE POLICY "Authenticated users can upload client logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'client-logos' AND
  (STORAGE.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their uploaded logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'client-logos' AND
  (STORAGE.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their uploaded logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'client-logos' AND
  (STORAGE.foldername(name))[1] = auth.uid()::text
);