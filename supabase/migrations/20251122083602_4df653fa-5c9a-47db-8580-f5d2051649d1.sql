-- Phase 1: Ajouter la catégorisation des modules
-- Ajouter la colonne type pour distinguer les modules métier des modules système
ALTER TABLE modules_systeme 
ADD COLUMN IF NOT EXISTS type text DEFAULT 'metier' CHECK (type IN ('metier', 'systeme'));

-- Marquer les modules système (administration globale)
UPDATE modules_systeme 
SET type = 'systeme' 
WHERE code IN ('CLIENTS', 'SITES', 'UTILISATEURS', 'ROLES', 'DASHBOARD', 'PRESTATAIRES');

-- Tous les autres modules restent 'metier' par défaut
-- Ces modules sont assignables aux sites clients

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_modules_systeme_type ON modules_systeme(type) WHERE actif = true;

COMMENT ON COLUMN modules_systeme.type IS 'Type de module: metier (assignable aux sites) ou systeme (administration globale)';