-- Phase 1: Update permission_actions with French labels and add "Full"

-- 1. Update existing actions to match French labels exactly
UPDATE permission_actions SET label = 'Afficher', display_order = 2 WHERE code = 'view';
UPDATE permission_actions SET label = 'Créer', display_order = 3 WHERE code = 'create';
UPDATE permission_actions SET label = 'Modifier', display_order = 4 WHERE code = 'edit';
UPDATE permission_actions SET label = 'Supprimer', display_order = 5 WHERE code = 'delete';
UPDATE permission_actions SET label = 'Approuver', display_order = 6 WHERE code = 'approve';

-- 2. Add "Full" action (special: represents all permissions)
INSERT INTO permission_actions (code, label, description, display_order)
VALUES ('full', 'Full', 'Accès complet (toutes les actions)', 1)
ON CONFLICT (code) DO UPDATE SET 
  label = 'Full',
  description = 'Accès complet (toutes les actions)',
  display_order = 1;

-- 3. Remove unused actions not in spec
DELETE FROM permission_actions WHERE code IN ('export', 'assign', 'bulk_edit', 'upload_proof');

-- Phase 4: Update module display_order to match exact requirements
UPDATE modules_systeme SET display_order = 10 WHERE code = 'BIBLIOTHEQUE';
UPDATE modules_systeme SET display_order = 20 WHERE code = 'VEILLE';
UPDATE modules_systeme SET display_order = 30 WHERE code = 'DOSSIER';
UPDATE modules_systeme SET display_order = 40 WHERE code = 'CONTROLES';
UPDATE modules_systeme SET display_order = 50 WHERE code = 'INCIDENTS';
UPDATE modules_systeme SET display_order = 60 WHERE code = 'EPI';
UPDATE modules_systeme SET display_order = 70 WHERE code = 'AUDITS';
UPDATE modules_systeme SET display_order = 80 WHERE code = 'FORMATIONS';
UPDATE modules_systeme SET display_order = 90 WHERE code = 'VISITES_MED';
UPDATE modules_systeme SET display_order = 100 WHERE code = 'PERMIS';
UPDATE modules_systeme SET display_order = 110 WHERE code = 'PRESTATAIRES';
UPDATE modules_systeme SET display_order = 120 WHERE code = 'ENVIRONNEMENT';