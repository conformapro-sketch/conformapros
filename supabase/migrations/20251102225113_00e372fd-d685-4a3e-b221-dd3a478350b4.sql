-- Ajouter la colonne tenant_id à site_article_status
ALTER TABLE public.site_article_status 
  ADD COLUMN tenant_id uuid;

-- Peupler la colonne tenant_id avec les valeurs des sites associés
UPDATE public.site_article_status 
SET tenant_id = (
  SELECT s.tenant_id 
  FROM public.sites s 
  WHERE s.id = site_article_status.site_id
);

-- Ajouter la contrainte NOT NULL après avoir peuplé
ALTER TABLE public.site_article_status 
  ALTER COLUMN tenant_id SET NOT NULL;

-- Créer un index pour améliorer les performances des requêtes par tenant
CREATE INDEX IF NOT EXISTS idx_site_article_status_tenant_id 
  ON public.site_article_status(tenant_id);