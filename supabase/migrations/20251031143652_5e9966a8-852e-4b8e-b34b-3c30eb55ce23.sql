-- Update CHECK constraint on user_permissions to include all modules
ALTER TABLE user_permissions 
DROP CONSTRAINT IF EXISTS user_permissions_module_check;

ALTER TABLE user_permissions 
ADD CONSTRAINT user_permissions_module_check 
CHECK (module IN (
  'bibliotheque', 'veille', 'evaluation', 'matrice', 'plan_action',
  'dossier', 'controles', 'audits', 'incidents', 'equipements', 
  'formations', 'visites_medicales', 'epi', 'prestataires', 'permis',
  'clients', 'sites', 'factures', 'abonnements', 'utilisateurs', 
  'roles', 'rapports'
));