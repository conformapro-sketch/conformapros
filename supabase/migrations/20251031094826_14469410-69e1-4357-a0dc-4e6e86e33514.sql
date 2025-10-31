-- Create storage bucket for conformite preuves if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'conformite-preuves'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('conformite-preuves', 'conformite-preuves', true);
  END IF;
END $$;

-- Drop existing policies if they exist and recreate
DO $$
BEGIN
  -- Upload policy
  DROP POLICY IF EXISTS "Authenticated users can upload conformite preuves" ON storage.objects;
  
  -- View policy  
  DROP POLICY IF EXISTS "Authenticated users can view conformite preuves" ON storage.objects;
  
  -- Update policy
  DROP POLICY IF EXISTS "Users can update their own conformite preuves" ON storage.objects;
  
  -- Delete policy
  DROP POLICY IF EXISTS "Users can delete their own conformite preuves" ON storage.objects;
END $$;

-- Create RLS policies for conformite-preuves bucket
CREATE POLICY "Authenticated users can upload conformite preuves"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'conformite-preuves');

CREATE POLICY "Authenticated users can view conformite preuves"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'conformite-preuves');

CREATE POLICY "Users can update their own conformite preuves"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'conformite-preuves');

CREATE POLICY "Users can delete their own conformite preuves"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'conformite-preuves');