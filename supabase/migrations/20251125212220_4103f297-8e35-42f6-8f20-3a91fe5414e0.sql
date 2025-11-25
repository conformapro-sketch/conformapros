-- Réinitialisation complète des domaines réglementaires et sous-domaines

-- 1. Supprimer d'abord toutes les relations dans les tables de jonction
DELETE FROM articles_sous_domaines;
DELETE FROM user_domain_scopes;
DELETE FROM site_veille_domaines;
DELETE FROM codes_domaines;

-- 2. Supprimer tous les sous-domaines existants
DELETE FROM sous_domaines_application;

-- 3. Supprimer tous les domaines existants
DELETE FROM domaines_reglementaires;

-- 4. Insérer les nouveaux domaines réglementaires
INSERT INTO domaines_reglementaires (id, code, libelle, description, actif, couleur, icone) VALUES
  ('d1000000-0000-0000-0000-000000000001', 'SST', 'Santé & Sécurité au Travail', 'Domaine de la santé et sécurité au travail', true, 'hsl(0, 70%, 50%)', 'shield'),
  ('d1000000-0000-0000-0000-000000000002', 'SOCIAL', 'Social', 'Domaine social et droit du travail', true, 'hsl(200, 70%, 50%)', 'users'),
  ('d1000000-0000-0000-0000-000000000003', 'ENV', 'Environnement', 'Domaine environnemental', true, 'hsl(120, 70%, 40%)', 'leaf'),
  ('d1000000-0000-0000-0000-000000000004', 'QUALITE', 'Qualité', 'Domaine qualité', true, 'hsl(280, 70%, 50%)', 'check-circle'),
  ('d1000000-0000-0000-0000-000000000005', 'ENERGIE', 'Énergie', 'Domaine énergétique', true, 'hsl(45, 90%, 50%)', 'zap'),
  ('d1000000-0000-0000-0000-000000000006', 'ALIM', 'Sécurité des denrées alimentaires', 'Domaine alimentaire et HACCP', true, 'hsl(30, 80%, 50%)', 'utensils'),
  ('d1000000-0000-0000-0000-000000000007', 'SURETE', 'Sûreté', 'Domaine sûreté et sécurité physique', true, 'hsl(220, 60%, 50%)', 'lock'),
  ('d1000000-0000-0000-0000-000000000008', 'CYBER', 'Sécurité informatique & Données personnelles', 'Domaine cybersécurité et RGPD', true, 'hsl(260, 70%, 50%)', 'shield-check');

-- 5. Insérer les sous-domaines par domaine

-- Domaine 1: Santé & Sécurité au Travail (SST)
INSERT INTO sous_domaines_application (domaine_id, code, libelle, description) VALUES
  ('d1000000-0000-0000-0000-000000000001', 'SST_EPI', 'Équipements de Protection Individuelle (EPI)', NULL),
  ('d1000000-0000-0000-0000-000000000001', 'SST_HAUTEUR', 'Travail en hauteur', NULL),
  ('d1000000-0000-0000-0000-000000000001', 'SST_CONFINE', 'Espaces confinés', NULL),
  ('d1000000-0000-0000-0000-000000000001', 'SST_CHIMIQUE', 'Risque chimique', NULL),
  ('d1000000-0000-0000-0000-000000000001', 'SST_INCENDIE', 'Risque incendie', NULL),
  ('d1000000-0000-0000-0000-000000000001', 'SST_ELECTRIQUE', 'Risque électrique', NULL),
  ('d1000000-0000-0000-0000-000000000001', 'SST_ERGO', 'Ergonomie & postes de travail', NULL),
  ('d1000000-0000-0000-0000-000000000001', 'SST_MACHINES', 'Machines & équipements de travail', NULL),
  ('d1000000-0000-0000-0000-000000000001', 'SST_CIRCULATION', 'Circulation interne / trafic industriel', NULL),
  ('d1000000-0000-0000-0000-000000000001', 'SST_ATEX', 'Atmosphères explosives (ATEX)', NULL),
  ('d1000000-0000-0000-0000-000000000001', 'SST_SECOURS', 'Premiers secours', NULL),
  ('d1000000-0000-0000-0000-000000000001', 'SST_PERMIS', 'Permis de travail', NULL),
  ('d1000000-0000-0000-0000-000000000001', 'SST_BRUIT', 'Bruit & vibrations', NULL),
  ('d1000000-0000-0000-0000-000000000001', 'SST_MANUTENTION', 'Manutention manuelle', NULL),
  ('d1000000-0000-0000-0000-000000000001', 'SST_LOCAUX', 'Aménagement des locaux de travail', NULL);

-- Domaine 2: Social
INSERT INTO sous_domaines_application (domaine_id, code, libelle, description) VALUES
  ('d1000000-0000-0000-0000-000000000002', 'SOC_DROIT', 'Droit du travail', NULL),
  ('d1000000-0000-0000-0000-000000000002', 'SOC_TEMPS', 'Temps de travail & repos', NULL),
  ('d1000000-0000-0000-0000-000000000002', 'SOC_REPRES', 'Représentation du personnel', NULL),
  ('d1000000-0000-0000-0000-000000000002', 'SOC_HARCEL', 'Harcèlement & discriminations', NULL),
  ('d1000000-0000-0000-0000-000000000002', 'SOC_DISCIPL', 'Discipline & procédures internes', NULL),
  ('d1000000-0000-0000-0000-000000000002', 'SOC_CONTRATS', 'Contrats & dossiers du personnel', NULL),
  ('d1000000-0000-0000-0000-000000000002', 'SOC_FORMATION', 'Formation & compétences', NULL),
  ('d1000000-0000-0000-0000-000000000002', 'SOC_PAIE', 'Paie & déclarations sociales', NULL),
  ('d1000000-0000-0000-0000-000000000002', 'SOC_MEDECINE', 'Médecine du travail & visites médicales', NULL);

-- Domaine 3: Environnement
INSERT INTO sous_domaines_application (domaine_id, code, libelle, description) VALUES
  ('d1000000-0000-0000-0000-000000000003', 'ENV_DECHETS', 'Gestion des déchets', NULL),
  ('d1000000-0000-0000-0000-000000000003', 'ENV_EAU', 'Eau & effluents', NULL),
  ('d1000000-0000-0000-0000-000000000003', 'ENV_AIR', 'Émissions atmosphériques', NULL),
  ('d1000000-0000-0000-0000-000000000003', 'ENV_SOLS', 'Sols & sous-sols', NULL),
  ('d1000000-0000-0000-0000-000000000003', 'ENV_BRUIT', 'Nuisances sonores', NULL),
  ('d1000000-0000-0000-0000-000000000003', 'ENV_ICPE', 'ICPE / installations classées', NULL),
  ('d1000000-0000-0000-0000-000000000003', 'ENV_RISQUES', 'Risques environnementaux', NULL),
  ('d1000000-0000-0000-0000-000000000003', 'ENV_PRODUITS', 'Produits dangereux & stockage', NULL),
  ('d1000000-0000-0000-0000-000000000003', 'ENV_POLLUTION', 'Pollution accidentelle', NULL),
  ('d1000000-0000-0000-0000-000000000003', 'ENV_BIO', 'Biodiversité', NULL),
  ('d1000000-0000-0000-0000-000000000003', 'ENV_TMD', 'Transport de matières dangereuses (ENV)', NULL);

-- Domaine 4: Qualité
INSERT INTO sous_domaines_application (domaine_id, code, libelle, description) VALUES
  ('d1000000-0000-0000-0000-000000000004', 'QUAL_DOC', 'Documentation & gestion documentaire', NULL),
  ('d1000000-0000-0000-0000-000000000004', 'QUAL_NC', 'Non-conformités & actions', NULL),
  ('d1000000-0000-0000-0000-000000000004', 'QUAL_AUDIT', 'Audits internes', NULL),
  ('d1000000-0000-0000-0000-000000000004', 'QUAL_CLIENT', 'Satisfaction client', NULL),
  ('d1000000-0000-0000-0000-000000000004', 'QUAL_PROC', 'Processus & procédures', NULL),
  ('d1000000-0000-0000-0000-000000000004', 'QUAL_FOURN', 'Gestion des fournisseurs', NULL),
  ('d1000000-0000-0000-0000-000000000004', 'QUAL_AMELIO', 'Amélioration continue (PDCA)', NULL),
  ('d1000000-0000-0000-0000-000000000004', 'QUAL_MAITRISE', 'Maîtrise opérationnelle', NULL);

-- Domaine 5: Énergie
INSERT INTO sous_domaines_application (domaine_id, code, libelle, description) VALUES
  ('d1000000-0000-0000-0000-000000000005', 'ENERG_PERF', 'Performance énergétique', NULL),
  ('d1000000-0000-0000-0000-000000000005', 'ENERG_SUIVI', 'Suivi des consommations', NULL),
  ('d1000000-0000-0000-0000-000000000005', 'ENERG_MESURE', 'Mesure & comptage énergétique', NULL),
  ('d1000000-0000-0000-0000-000000000005', 'ENERG_MAINT', 'Maintenance énergétique', NULL),
  ('d1000000-0000-0000-0000-000000000005', 'ENERG_OPTIM', 'Optimisation des équipements', NULL),
  ('d1000000-0000-0000-0000-000000000005', 'ENERG_RENOUV', 'Énergies renouvelables', NULL),
  ('d1000000-0000-0000-0000-000000000005', 'ENERG_BILAN', 'Bilan énergétique', NULL),
  ('d1000000-0000-0000-0000-000000000005', 'ENERG_CERTIF', 'Certification énergétique', NULL);

-- Domaine 6: Sécurité des denrées alimentaires
INSERT INTO sous_domaines_application (domaine_id, code, libelle, description) VALUES
  ('d1000000-0000-0000-0000-000000000006', 'ALIM_HYGIENE', 'Hygiène & bonnes pratiques', NULL),
  ('d1000000-0000-0000-0000-000000000006', 'ALIM_HACCP', 'Programme HACCP', NULL),
  ('d1000000-0000-0000-0000-000000000006', 'ALIM_CONTAM', 'Contamination & allergènes', NULL),
  ('d1000000-0000-0000-0000-000000000006', 'ALIM_FROID', 'Chaîne du froid', NULL),
  ('d1000000-0000-0000-0000-000000000006', 'ALIM_TRAC', 'Traçabilité', NULL),
  ('d1000000-0000-0000-0000-000000000006', 'ALIM_NETTOY', 'Nettoyage & désinfection', NULL),
  ('d1000000-0000-0000-0000-000000000006', 'ALIM_QUALITE', 'Contrôle qualité produit', NULL),
  ('d1000000-0000-0000-0000-000000000006', 'ALIM_NUISIBLES', 'Gestion des nuisibles', NULL),
  ('d1000000-0000-0000-0000-000000000006', 'ALIM_EMBALLA', 'Sécurité des emballages', NULL),
  ('d1000000-0000-0000-0000-000000000006', 'ALIM_EAU', 'Eau potable & vapeur alimentaire', NULL);

-- Domaine 7: Sûreté
INSERT INTO sous_domaines_application (domaine_id, code, libelle, description) VALUES
  ('d1000000-0000-0000-0000-000000000007', 'SURETE_VIDEO', 'Vidéosurveillance (CCTV)', NULL),
  ('d1000000-0000-0000-0000-000000000007', 'SURETE_ACCES', 'Contrôle d''accès', NULL),
  ('d1000000-0000-0000-0000-000000000007', 'SURETE_INTRUSION', 'Détection intrusion', NULL),
  ('d1000000-0000-0000-0000-000000000007', 'SURETE_SURVEIL', 'Surveillance humaine', NULL),
  ('d1000000-0000-0000-0000-000000000007', 'SURETE_RONDES', 'Rondes & main courante', NULL),
  ('d1000000-0000-0000-0000-000000000007', 'SURETE_VISIT', 'Gestion des visiteurs', NULL),
  ('d1000000-0000-0000-0000-000000000007', 'SURETE_MAL', 'Malveillance / vols', NULL),
  ('d1000000-0000-0000-0000-000000000007', 'SURETE_ALARME', 'Systèmes d''alarme & télésurveillance', NULL),
  ('d1000000-0000-0000-0000-000000000007', 'SURETE_CLES', 'Gestion des clés', NULL);

-- Domaine 8: Sécurité informatique & Données personnelles
INSERT INTO sous_domaines_application (domaine_id, code, libelle, description) VALUES
  ('d1000000-0000-0000-0000-000000000008', 'CYBER_RESEAU', 'Sécurité réseau', NULL),
  ('d1000000-0000-0000-0000-000000000008', 'CYBER_ACCES', 'Contrôle des accès & habilitations', NULL),
  ('d1000000-0000-0000-0000-000000000008', 'CYBER_BACKUP', 'Sauvegardes & continuité (PRA / PCA)', NULL),
  ('d1000000-0000-0000-0000-000000000008', 'CYBER_RGPD', 'Protection des données personnelles', NULL),
  ('d1000000-0000-0000-0000-000000000008', 'CYBER_SERVEURS', 'Sécurité des serveurs & postes', NULL),
  ('d1000000-0000-0000-0000-000000000008', 'CYBER_LOG', 'Journalisation & traçabilité', NULL),
  ('d1000000-0000-0000-0000-000000000008', 'CYBER_INCIDENT', 'Gestion des incidents cyber', NULL),
  ('d1000000-0000-0000-0000-000000000008', 'CYBER_PASS', 'Politique de mots de passe', NULL),
  ('d1000000-0000-0000-0000-000000000008', 'CYBER_SENSIB', 'Sensibilisation cybersécurité', NULL);