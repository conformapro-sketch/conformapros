-- Rendre les champs d'adresse optionnels pour les sites
-- Les champs gouvernorat, delegation, localite, code_postal et adresse doivent être optionnels

ALTER TABLE public.sites ALTER COLUMN code_postal DROP NOT NULL;
ALTER TABLE public.sites ALTER COLUMN adresse DROP NOT NULL;
ALTER TABLE public.sites ALTER COLUMN gouvernorat DROP NOT NULL;
ALTER TABLE public.sites ALTER COLUMN delegation DROP NOT NULL;
ALTER TABLE public.sites ALTER COLUMN localite DROP NOT NULL;