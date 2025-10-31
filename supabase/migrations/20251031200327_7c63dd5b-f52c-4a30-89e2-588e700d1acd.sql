-- Nouvelles tables pour le module Incidents HSE amélioré

-- Table des commentaires sur incidents
CREATE TABLE IF NOT EXISTS public.incident_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Table des templates de questions pour l'analyse
CREATE TABLE IF NOT EXISTS public.incident_question_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_incident TEXT NOT NULL,
  questions_json JSONB NOT NULL,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Table de configuration par client
CREATE TABLE IF NOT EXISTS public.incident_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  settings_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(client_id)
);

-- Table des groupes d'incidents récurrents
CREATE TABLE IF NOT EXISTS public.incident_recurrent_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE,
  type_incident TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  created_by UUID REFERENCES auth.users(id)
);

-- Table de liaison incidents-groupes récurrents
CREATE TABLE IF NOT EXISTS public.incident_recurrent_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.incident_recurrent_groups(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(incident_id, group_id)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_incident_comments_incident ON public.incident_comments(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_comments_created ON public.incident_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incident_templates_type ON public.incident_question_templates(type_incident);
CREATE INDEX IF NOT EXISTS idx_recurrent_mapping_incident ON public.incident_recurrent_mapping(incident_id);
CREATE INDEX IF NOT EXISTS idx_recurrent_mapping_group ON public.incident_recurrent_mapping(group_id);
CREATE INDEX IF NOT EXISTS idx_recurrent_groups_site ON public.incident_recurrent_groups(site_id);

-- RLS Policies pour incident_comments
ALTER TABLE public.incident_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "IncidentComments: read if site access"
  ON public.incident_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.incidents i
      WHERE i.id = incident_comments.incident_id
        AND has_site_access(auth.uid(), i.site_id)
    )
  );

CREATE POLICY "IncidentComments: insert if site access"
  ON public.incident_comments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.incidents i
      WHERE i.id = incident_comments.incident_id
        AND has_site_access(auth.uid(), i.site_id)
    )
  );

CREATE POLICY "IncidentComments: delete own"
  ON public.incident_comments FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policies pour incident_question_templates
ALTER TABLE public.incident_question_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Templates: read all"
  ON public.incident_question_templates FOR SELECT
  USING (actif = true);

CREATE POLICY "Templates: super_admin manage"
  ON public.incident_question_templates FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies pour incident_config
ALTER TABLE public.incident_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Config: read if client access"
  ON public.incident_config FOR SELECT
  USING (has_client_access(auth.uid(), client_id));

CREATE POLICY "Config: super_admin manage"
  ON public.incident_config FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies pour incident_recurrent_groups
ALTER TABLE public.incident_recurrent_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "RecurrentGroups: read if site access"
  ON public.incident_recurrent_groups FOR SELECT
  USING (has_site_access(auth.uid(), site_id));

CREATE POLICY "RecurrentGroups: manage if site access"
  ON public.incident_recurrent_groups FOR ALL
  USING (has_site_access(auth.uid(), site_id))
  WITH CHECK (has_site_access(auth.uid(), site_id));

-- RLS Policies pour incident_recurrent_mapping
ALTER TABLE public.incident_recurrent_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "RecurrentMapping: read if can access incident"
  ON public.incident_recurrent_mapping FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.incidents i
      WHERE i.id = incident_recurrent_mapping.incident_id
        AND has_site_access(auth.uid(), i.site_id)
    )
  );

CREATE POLICY "RecurrentMapping: manage if can access incident"
  ON public.incident_recurrent_mapping FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.incidents i
      WHERE i.id = incident_recurrent_mapping.incident_id
        AND has_site_access(auth.uid(), i.site_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.incidents i
      WHERE i.id = incident_recurrent_mapping.incident_id
        AND has_site_access(auth.uid(), i.site_id)
    )
  );

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_incident_config_updated_at
  BEFORE UPDATE ON public.incident_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_incident_question_templates_updated_at
  BEFORE UPDATE ON public.incident_question_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();