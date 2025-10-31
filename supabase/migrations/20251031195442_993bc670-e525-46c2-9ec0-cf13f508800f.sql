-- Add storage bucket for incident photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('incident-photos', 'incident-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for incident photos
CREATE POLICY "Incident photos are viewable by authenticated users"
ON storage.objects FOR SELECT
USING (bucket_id = 'incident-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can upload incident photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'incident-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their incident photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'incident-photos' AND auth.role() = 'authenticated');

-- Add history tracking table for incidents
CREATE TABLE IF NOT EXISTS public.incident_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  modified_by UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  changes JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on incident_history
ALTER TABLE public.incident_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "IncidentHistory: read if site access"
ON public.incident_history FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.incidents i
    WHERE i.id = incident_history.incident_id
    AND has_site_access(auth.uid(), i.site_id)
  )
);

CREATE POLICY "IncidentHistory: manage if site access"
ON public.incident_history FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.incidents i
    WHERE i.id = incident_history.incident_id
    AND has_site_access(auth.uid(), i.site_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.incidents i
    WHERE i.id = incident_history.incident_id
    AND has_site_access(auth.uid(), i.site_id)
  )
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_incident_history_incident_id ON public.incident_history(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_history_created_at ON public.incident_history(created_at DESC);

-- Add trigger to log incident modifications
CREATE OR REPLACE FUNCTION public.log_incident_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.incident_history (incident_id, modified_by, action, changes)
    VALUES (
      NEW.id,
      auth.uid(),
      'update',
      jsonb_build_object(
        'old', to_jsonb(OLD),
        'new', to_jsonb(NEW)
      )
    );
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.incident_history (incident_id, modified_by, action, changes)
    VALUES (
      NEW.id,
      auth.uid(),
      'create',
      to_jsonb(NEW)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER incident_changes_trigger
AFTER INSERT OR UPDATE ON public.incidents
FOR EACH ROW
EXECUTE FUNCTION public.log_incident_changes();