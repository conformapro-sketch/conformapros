-- Add autorite_emettrice column to textes_reglementaires
ALTER TABLE textes_reglementaires 
ADD COLUMN autorite_emettrice text;