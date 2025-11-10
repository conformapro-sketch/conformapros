-- Suppression de la colonne ville des tables
-- Conformité avec la structure administrative tunisienne (Gouvernorat > Délégation > Localité)

-- Supprimer ville de la table sites
ALTER TABLE public.sites DROP COLUMN IF EXISTS ville;

-- Supprimer ville de la table clients
ALTER TABLE public.clients DROP COLUMN IF EXISTS ville;

-- Supprimer ville de la table prestataires
ALTER TABLE public.prestataires DROP COLUMN IF EXISTS ville;