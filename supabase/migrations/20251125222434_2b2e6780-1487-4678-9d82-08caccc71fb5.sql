-- Make date_publication nullable in textes_reglementaires
ALTER TABLE textes_reglementaires 
ALTER COLUMN date_publication DROP NOT NULL;

-- Create storage bucket for regulatory text PDFs if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('textes-reglementaires-pdf', 'textes-reglementaires-pdf', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for textes-reglementaires-pdf bucket
CREATE POLICY "Public can view regulatory text PDFs"
ON storage.objects FOR SELECT
USING (bucket_id = 'textes-reglementaires-pdf');

CREATE POLICY "Staff can upload regulatory text PDFs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'textes-reglementaires-pdf' 
  AND (has_role(auth.uid(), 'Super Admin') OR has_role(auth.uid(), 'Admin Global'))
);

CREATE POLICY "Staff can update regulatory text PDFs"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'textes-reglementaires-pdf' 
  AND (has_role(auth.uid(), 'Super Admin') OR has_role(auth.uid(), 'Admin Global'))
);

CREATE POLICY "Staff can delete regulatory text PDFs"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'textes-reglementaires-pdf' 
  AND (has_role(auth.uid(), 'Super Admin') OR has_role(auth.uid(), 'Admin Global'))
);