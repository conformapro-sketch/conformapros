-- Étape 1 : Corriger les foreign keys de user_permissions pour pointer vers client_users
ALTER TABLE user_permissions 
  DROP CONSTRAINT IF EXISTS user_permissions_user_id_fkey;

ALTER TABLE user_permissions 
  DROP CONSTRAINT IF EXISTS user_permissions_created_by_fkey;

ALTER TABLE user_permissions 
  DROP CONSTRAINT IF EXISTS user_permissions_updated_by_fkey;

-- Ajouter les nouvelles contraintes pointant vers client_users
ALTER TABLE user_permissions
  ADD CONSTRAINT user_permissions_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES client_users(id) ON DELETE CASCADE;

ALTER TABLE user_permissions
  ADD CONSTRAINT user_permissions_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES client_users(id);

ALTER TABLE user_permissions
  ADD CONSTRAINT user_permissions_updated_by_fkey 
  FOREIGN KEY (updated_by) REFERENCES client_users(id);

-- Étape 2 : Ajouter la hiérarchie et l'ordre aux modules
ALTER TABLE modules_systeme 
  ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS parent_module_id UUID REFERENCES modules_systeme(id) ON DELETE SET NULL;

-- Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_modules_display_order ON modules_systeme(display_order);
CREATE INDEX IF NOT EXISTS idx_modules_parent ON modules_systeme(parent_module_id);

-- Définir l'ordre d'affichage des modules existants
UPDATE modules_systeme SET display_order = 10 WHERE code = 'BIBLIOTHEQUE';
UPDATE modules_systeme SET display_order = 20 WHERE code = 'VEILLE';
UPDATE modules_systeme SET display_order = 30 WHERE code = 'CONFORMITE';
UPDATE modules_systeme SET display_order = 40 WHERE code = 'DOSSIER';
UPDATE modules_systeme SET display_order = 50 WHERE code = 'CONTROLES';
UPDATE modules_systeme SET display_order = 60 WHERE code = 'AUDITS';
UPDATE modules_systeme SET display_order = 70 WHERE code = 'INCIDENTS';
UPDATE modules_systeme SET display_order = 80 WHERE code = 'FORMATIONS';
UPDATE modules_systeme SET display_order = 90 WHERE code = 'VISITES_MED';
UPDATE modules_systeme SET display_order = 100 WHERE code = 'EPI';
UPDATE modules_systeme SET display_order = 110 WHERE code = 'PRESTATAIRES';
UPDATE modules_systeme SET display_order = 120 WHERE code = 'PERMIS';
UPDATE modules_systeme SET display_order = 130 WHERE code = 'ENVIRONNEMENT';

-- Définir la dépendance : Veille → Bibliothèque
UPDATE modules_systeme 
SET parent_module_id = (SELECT id FROM modules_systeme WHERE code = 'BIBLIOTHEQUE')
WHERE code = 'VEILLE';