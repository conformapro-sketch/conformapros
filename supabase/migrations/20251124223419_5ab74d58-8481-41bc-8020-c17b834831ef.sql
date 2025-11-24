-- Create storage bucket for logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'logos', 
  'logos', 
  true,
  2097152, -- 2MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
);

-- Add RLS policy for authenticated uploads
CREATE POLICY "Authenticated users can upload logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'logos');

-- Add RLS policy for authenticated updates
CREATE POLICY "Authenticated users can update logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'logos')
WITH CHECK (bucket_id = 'logos');

-- Add RLS policy for authenticated deletes
CREATE POLICY "Authenticated users can delete logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'logos');

-- Add RLS policy for public read
CREATE POLICY "Public can read logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'logos');

-- Add logo_url column to sites table
ALTER TABLE sites ADD COLUMN IF NOT EXISTS logo_url TEXT;