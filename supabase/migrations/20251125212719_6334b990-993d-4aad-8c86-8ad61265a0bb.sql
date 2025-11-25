-- Ajout du statut actif sur les sous-domaines pour supporter le toggle dans l'UI
ALTER TABLE sous_domaines_application
  ADD COLUMN IF NOT EXISTS actif boolean NOT NULL DEFAULT true;

-- S'assurer que tous les sous-domaines actuels sont actifs par défaut
UPDATE sous_domaines_application
SET actif = true
WHERE actif IS NULL;