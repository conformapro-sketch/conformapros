-- Phase 2 & 3: Remove "Évaluation de conformité" and fix display orders

-- Disable CONFORMITE module (not in required list)
UPDATE modules_systeme 
SET actif = false
WHERE code = 'CONFORMITE';

-- Disable from all sites
UPDATE site_modules 
SET enabled = false 
WHERE module_id = (SELECT id FROM modules_systeme WHERE code = 'CONFORMITE');

-- Fix display orders to match exact specification (unique, sequential)
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