-- Créer l'index manquant sur textes_domaines.domaine_id
CREATE INDEX IF NOT EXISTS idx_textes_domaines_domaine_id 
ON public.textes_domaines (domaine_id);

COMMENT ON INDEX idx_textes_domaines_domaine_id IS 
'Améliore les performances de filtrage des textes par domaine réglementaire';