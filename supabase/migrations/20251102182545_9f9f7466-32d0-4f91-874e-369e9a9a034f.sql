-- Add pdf_url column to actes_reglementaires table
ALTER TABLE actes_reglementaires 
ADD COLUMN IF NOT EXISTS pdf_url TEXT;

-- Create storage bucket for textes reglementaires PDFs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'textes_reglementaires_pdf',
  'textes_reglementaires_pdf',
  true,
  10485760, -- 10MB limit
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for the textes_reglementaires_pdf bucket
CREATE POLICY "Textes PDF: public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'textes_reglementaires_pdf');

CREATE POLICY "Textes PDF: authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'textes_reglementaires_pdf'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Textes PDF: super_admin can delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'textes_reglementaires_pdf'
  AND has_role(auth.uid(), 'super_admin'::app_role)
);