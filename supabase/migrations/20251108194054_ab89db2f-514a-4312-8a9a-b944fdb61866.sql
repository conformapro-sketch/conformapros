-- Fix module codes to match navigation config (uppercase)
-- and add missing modules

-- Update existing modules to uppercase codes
UPDATE modules_systeme SET code = UPPER(code) WHERE code != UPPER(code);

-- Insert missing modules if they don't exist (checking by uppercase code)
INSERT INTO modules_systeme (code, nom, libelle, description, actif, ordre, couleur, icon)
VALUES 
  ('DASHBOARD', 'Tableau de bord', 'Tableau de bord', 'Vue d''ensemble de l''application', true, 0, '#6366f1', 'layout-dashboard'),
  ('DOSSIER', 'Dossier', 'Dossier Réglementaire', 'Dossier réglementaire complet', true, 3, '#06b6d4', 'book-open'),
  ('CONTROLES', 'Contrôles', 'Contrôles Techniques', 'Gestion des contrôles techniques', true, 4, '#14b8a6', 'clipboard-check'),
  ('AUDITS', 'Audits', 'Audits', 'Gestion des audits', true, 9, '#a855f7', 'search'),
  ('VISITES_MED', 'Visites médicales', 'Visites Médicales', 'Suivi des visites médicales', true, 10, '#f43f5e', 'stethoscope'),
  ('PERMIS', 'Permis', 'Permis de Travail', 'Gestion des permis de travail', true, 11, '#fb923c', 'file-check'),
  ('PRESTATAIRES', 'Prestataires', 'Prestataires', 'Gestion des prestataires', true, 13, '#84cc16', 'users')
ON CONFLICT (code) DO NOTHING;

-- Ensure SITES and UTILISATEURS modules exist
INSERT INTO modules_systeme (code, nom, libelle, description, actif, ordre, couleur, icon)
VALUES 
  ('SITES', 'Sites', 'Sites', 'Gestion des sites', true, 9, '#0ea5e9', 'building'),
  ('UTILISATEURS', 'Utilisateurs', 'Utilisateurs', 'Gestion des utilisateurs', true, 10, '#8b5cf6', 'users')
ON CONFLICT (code) DO NOTHING;

-- Update display order for consistency
UPDATE modules_systeme SET ordre = 0 WHERE code = 'DASHBOARD';
UPDATE modules_systeme SET ordre = 1 WHERE code = 'BIBLIOTHEQUE';
UPDATE modules_systeme SET ordre = 2 WHERE code = 'VEILLE';
UPDATE modules_systeme SET ordre = 3 WHERE code = 'DOSSIER';
UPDATE modules_systeme SET ordre = 4 WHERE code = 'CONTROLES';
UPDATE modules_systeme SET ordre = 5 WHERE code = 'INCIDENTS';
UPDATE modules_systeme SET ordre = 6 WHERE code = 'EQUIPEMENTS';
UPDATE modules_systeme SET ordre = 7 WHERE code = 'EPI';
UPDATE modules_systeme SET ordre = 8 WHERE code = 'AUDITS';
UPDATE modules_systeme SET ordre = 9 WHERE code = 'FORMATIONS';
UPDATE modules_systeme SET ordre = 10 WHERE code = 'VISITES_MED';
UPDATE modules_systeme SET ordre = 11 WHERE code = 'PERMIS';
UPDATE modules_systeme SET ordre = 12 WHERE code = 'PRESTATAIRES';
UPDATE modules_systeme SET ordre = 13 WHERE code = 'ENVIRONNEMENT';
UPDATE modules_systeme SET ordre = 14 WHERE code = 'CLIENTS';
UPDATE modules_systeme SET ordre = 15 WHERE code = 'SITES';
UPDATE modules_systeme SET ordre = 16 WHERE code = 'UTILISATEURS';

-- Update permissions for new modules (Super Admin role)
DO $$
DECLARE
  super_admin_role_id uuid;
  module_rec RECORD;
  action_rec RECORD;
BEGIN
  -- Get Super Admin role ID
  SELECT id INTO super_admin_role_id FROM roles WHERE name = 'Super Admin' AND type = 'team' LIMIT 1;
  
  IF super_admin_role_id IS NOT NULL THEN
    -- For each new module
    FOR module_rec IN 
      SELECT id, code FROM modules_systeme 
      WHERE code IN ('DASHBOARD', 'DOSSIER', 'CONTROLES', 'AUDITS', 'VISITES_MED', 'PERMIS', 'PRESTATAIRES', 'SITES', 'UTILISATEURS')
    LOOP
      -- For each permission action
      FOR action_rec IN SELECT code FROM permission_actions LOOP
        -- Insert permission if not exists
        INSERT INTO role_permissions (role_id, module, action, decision, scope)
        VALUES (super_admin_role_id, module_rec.code, action_rec.code, 'allow', 'global')
        ON CONFLICT (role_id, module, action) DO NOTHING;
      END LOOP;
    END LOOP;
  END IF;
END $$;