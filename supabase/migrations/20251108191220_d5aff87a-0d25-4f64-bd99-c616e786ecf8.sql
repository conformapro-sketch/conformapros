-- =============================================
-- PHASE 1: Fix modules_systeme table
-- =============================================
ALTER TABLE modules_systeme 
  ADD COLUMN IF NOT EXISTS libelle text,
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now(),
  ADD COLUMN IF NOT EXISTS couleur text;

-- Copy nom to libelle if libelle is null
UPDATE modules_systeme SET libelle = nom WHERE libelle IS NULL;

-- Make libelle NOT NULL after copying data
ALTER TABLE modules_systeme ALTER COLUMN libelle SET NOT NULL;

-- =============================================
-- PHASE 2: Create Module Features & Actions
-- =============================================
CREATE TABLE IF NOT EXISTS module_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid REFERENCES modules_systeme(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(module_id, code)
);

ALTER TABLE module_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ModuleFeatures: read" ON module_features FOR SELECT USING (true);
CREATE POLICY "ModuleFeatures: super_admin manage" ON module_features FOR ALL 
  USING (has_role(auth.uid(), 'super_admin')) 
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- Update role_permissions to use FKs
ALTER TABLE role_permissions 
  ADD COLUMN IF NOT EXISTS module_id uuid REFERENCES modules_systeme(id),
  ADD COLUMN IF NOT EXISTS feature_id uuid REFERENCES module_features(id),
  ADD COLUMN IF NOT EXISTS action_id uuid REFERENCES permission_actions(id);

-- =============================================
-- PHASE 3: Create EPI Module Tables
-- =============================================
CREATE TABLE IF NOT EXISTS epi_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  description text,
  duree_vie_mois integer,
  norme text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS epi_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  site_id uuid REFERENCES sites(id) ON DELETE CASCADE,
  epi_type_id uuid REFERENCES epi_types(id),
  reference text NOT NULL,
  taille text,
  statut text DEFAULT 'disponible',
  date_achat date,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS epi_dotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employe_id uuid REFERENCES employes(id) ON DELETE CASCADE NOT NULL,
  epi_article_id uuid REFERENCES epi_articles(id) ON DELETE CASCADE NOT NULL,
  date_attribution date NOT NULL,
  date_retour date,
  statut text DEFAULT 'actif',
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS epi_demandes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employe_id uuid REFERENCES employes(id) ON DELETE CASCADE NOT NULL,
  epi_type_id uuid REFERENCES epi_types(id) NOT NULL,
  quantite integer DEFAULT 1,
  statut text DEFAULT 'en_attente',
  date_demande date DEFAULT CURRENT_DATE,
  date_traitement date,
  created_at timestamp with time zone DEFAULT now()
);

-- EPI RLS Policies
ALTER TABLE epi_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE epi_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE epi_dotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE epi_demandes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "EPITypes: read" ON epi_types FOR SELECT USING (true);
CREATE POLICY "EPITypes: super_admin manage" ON epi_types FOR ALL 
  USING (has_role(auth.uid(), 'super_admin')) 
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "EPIArticles: read if client access" ON epi_articles FOR SELECT 
  USING (has_client_access(auth.uid(), client_id));
CREATE POLICY "EPIArticles: manage if client access" ON epi_articles FOR ALL 
  USING (has_client_access(auth.uid(), client_id)) 
  WITH CHECK (has_client_access(auth.uid(), client_id));

CREATE POLICY "EPIDotations: read if client access" ON epi_dotations FOR SELECT 
  USING (has_client_access(auth.uid(), (SELECT e.client_id FROM employes e WHERE e.id = epi_dotations.employe_id)));
CREATE POLICY "EPIDotations: manage if client access" ON epi_dotations FOR ALL 
  USING (has_client_access(auth.uid(), (SELECT e.client_id FROM employes e WHERE e.id = epi_dotations.employe_id))) 
  WITH CHECK (has_client_access(auth.uid(), (SELECT e.client_id FROM employes e WHERE e.id = epi_dotations.employe_id)));

CREATE POLICY "EPIDemandes: read if client access" ON epi_demandes FOR SELECT 
  USING (has_client_access(auth.uid(), (SELECT e.client_id FROM employes e WHERE e.id = epi_demandes.employe_id)));
CREATE POLICY "EPIDemandes: manage if client access" ON epi_demandes FOR ALL 
  USING (has_client_access(auth.uid(), (SELECT e.client_id FROM employes e WHERE e.id = epi_demandes.employe_id))) 
  WITH CHECK (has_client_access(auth.uid(), (SELECT e.client_id FROM employes e WHERE e.id = epi_demandes.employe_id)));

-- =============================================
-- PHASE 4: Create Equipment Tables
-- =============================================
CREATE TABLE IF NOT EXISTS equipements_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  description text,
  periodicite_controle_mois integer,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS equipements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  site_id uuid REFERENCES sites(id) ON DELETE CASCADE,
  equipement_type_id uuid REFERENCES equipements_types(id),
  nom text NOT NULL,
  numero_serie text,
  date_mise_service date,
  statut text DEFAULT 'en_service',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS equipements_controles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipement_id uuid REFERENCES equipements(id) ON DELETE CASCADE NOT NULL,
  date_controle date NOT NULL,
  type_controle text NOT NULL,
  resultat text,
  organisme_controle text,
  date_prochain_controle date,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS equipements_maintenance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipement_id uuid REFERENCES equipements(id) ON DELETE CASCADE NOT NULL,
  date_maintenance date NOT NULL,
  type_maintenance text NOT NULL,
  description text,
  cout numeric,
  created_at timestamp with time zone DEFAULT now()
);

-- Equipment RLS Policies
ALTER TABLE equipements_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipements ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipements_controles ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipements_maintenance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "EquipementsTypes: read" ON equipements_types FOR SELECT USING (true);
CREATE POLICY "EquipementsTypes: super_admin manage" ON equipements_types FOR ALL 
  USING (has_role(auth.uid(), 'super_admin')) 
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Equipements: read if client access" ON equipements FOR SELECT 
  USING (has_client_access(auth.uid(), client_id));
CREATE POLICY "Equipements: manage if client access" ON equipements FOR ALL 
  USING (has_client_access(auth.uid(), client_id)) 
  WITH CHECK (has_client_access(auth.uid(), client_id));

CREATE POLICY "EquipementsControles: read if client access" ON equipements_controles FOR SELECT 
  USING (has_client_access(auth.uid(), (SELECT e.client_id FROM equipements e WHERE e.id = equipements_controles.equipement_id)));
CREATE POLICY "EquipementsControles: manage if client access" ON equipements_controles FOR ALL 
  USING (has_client_access(auth.uid(), (SELECT e.client_id FROM equipements e WHERE e.id = equipements_controles.equipement_id))) 
  WITH CHECK (has_client_access(auth.uid(), (SELECT e.client_id FROM equipements e WHERE e.id = equipements_controles.equipement_id)));

CREATE POLICY "EquipementsMaintenance: read if client access" ON equipements_maintenance FOR SELECT 
  USING (has_client_access(auth.uid(), (SELECT e.client_id FROM equipements e WHERE e.id = equipements_maintenance.equipement_id)));
CREATE POLICY "EquipementsMaintenance: manage if client access" ON equipements_maintenance FOR ALL 
  USING (has_client_access(auth.uid(), (SELECT e.client_id FROM equipements e WHERE e.id = equipements_maintenance.equipement_id))) 
  WITH CHECK (has_client_access(auth.uid(), (SELECT e.client_id FROM equipements e WHERE e.id = equipements_maintenance.equipement_id)));

-- =============================================
-- PHASE 5: Create Formation Tables
-- =============================================
CREATE TABLE IF NOT EXISTS formations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  titre text NOT NULL,
  description text,
  duree_heures numeric,
  validite_mois integer,
  organisme text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS formations_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  formation_id uuid REFERENCES formations(id) ON DELETE CASCADE NOT NULL,
  site_id uuid REFERENCES sites(id),
  date_debut date NOT NULL,
  date_fin date NOT NULL,
  lieu text,
  formateur text,
  statut text DEFAULT 'programmee',
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS formations_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES formations_sessions(id) ON DELETE CASCADE NOT NULL,
  employe_id uuid REFERENCES employes(id) ON DELETE CASCADE NOT NULL,
  presence boolean DEFAULT false,
  resultat text,
  date_certificat date,
  created_at timestamp with time zone DEFAULT now()
);

-- Formation RLS Policies
ALTER TABLE formations ENABLE ROW LEVEL SECURITY;
ALTER TABLE formations_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE formations_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Formations: read if client access" ON formations FOR SELECT 
  USING (has_client_access(auth.uid(), client_id));
CREATE POLICY "Formations: manage if client access" ON formations FOR ALL 
  USING (has_client_access(auth.uid(), client_id)) 
  WITH CHECK (has_client_access(auth.uid(), client_id));

CREATE POLICY "FormationsSessions: read if client access" ON formations_sessions FOR SELECT 
  USING (has_client_access(auth.uid(), (SELECT f.client_id FROM formations f WHERE f.id = formations_sessions.formation_id)));
CREATE POLICY "FormationsSessions: manage if client access" ON formations_sessions FOR ALL 
  USING (has_client_access(auth.uid(), (SELECT f.client_id FROM formations f WHERE f.id = formations_sessions.formation_id))) 
  WITH CHECK (has_client_access(auth.uid(), (SELECT f.client_id FROM formations f WHERE f.id = formations_sessions.formation_id)));

CREATE POLICY "FormationsParticipants: read if client access" ON formations_participants FOR SELECT 
  USING (has_client_access(auth.uid(), (SELECT e.client_id FROM employes e WHERE e.id = formations_participants.employe_id)));
CREATE POLICY "FormationsParticipants: manage if client access" ON formations_participants FOR ALL 
  USING (has_client_access(auth.uid(), (SELECT e.client_id FROM employes e WHERE e.id = formations_participants.employe_id))) 
  WITH CHECK (has_client_access(auth.uid(), (SELECT e.client_id FROM employes e WHERE e.id = formations_participants.employe_id)));

-- =============================================
-- PHASE 6: Create Incident Tables
-- =============================================
CREATE TABLE IF NOT EXISTS incidents_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  description text,
  couleur text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  site_id uuid REFERENCES sites(id) ON DELETE CASCADE,
  incident_type_id uuid REFERENCES incidents_types(id),
  titre text NOT NULL,
  description text,
  date_incident timestamp with time zone NOT NULL,
  gravite text DEFAULT 'moyenne',
  statut text DEFAULT 'ouvert',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS incidents_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid REFERENCES incidents(id) ON DELETE CASCADE NOT NULL,
  causes text,
  actions_correctives text,
  actions_preventives text,
  date_analyse date,
  created_at timestamp with time zone DEFAULT now()
);

-- Incident RLS Policies
ALTER TABLE incidents_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "IncidentsTypes: read" ON incidents_types FOR SELECT USING (true);
CREATE POLICY "IncidentsTypes: super_admin manage" ON incidents_types FOR ALL 
  USING (has_role(auth.uid(), 'super_admin')) 
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Incidents: read if client access" ON incidents FOR SELECT 
  USING (has_client_access(auth.uid(), client_id));
CREATE POLICY "Incidents: manage if client access" ON incidents FOR ALL 
  USING (has_client_access(auth.uid(), client_id)) 
  WITH CHECK (has_client_access(auth.uid(), client_id));

CREATE POLICY "IncidentsAnalyses: read if client access" ON incidents_analyses FOR SELECT 
  USING (has_client_access(auth.uid(), (SELECT i.client_id FROM incidents i WHERE i.id = incidents_analyses.incident_id)));
CREATE POLICY "IncidentsAnalyses: manage if client access" ON incidents_analyses FOR ALL 
  USING (has_client_access(auth.uid(), (SELECT i.client_id FROM incidents i WHERE i.id = incidents_analyses.incident_id))) 
  WITH CHECK (has_client_access(auth.uid(), (SELECT i.client_id FROM incidents i WHERE i.id = incidents_analyses.incident_id)));

-- =============================================
-- PHASE 7: Create Environment Tables
-- =============================================
CREATE TABLE IF NOT EXISTS dechets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  site_id uuid REFERENCES sites(id) ON DELETE CASCADE,
  type_dechet text NOT NULL,
  quantite numeric,
  unite text,
  date_collecte date,
  prestataire text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS points_surveillance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  site_id uuid REFERENCES sites(id) ON DELETE CASCADE,
  nom text NOT NULL,
  type_surveillance text NOT NULL,
  frequence text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mesures_environnementales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  point_id uuid REFERENCES points_surveillance(id) ON DELETE CASCADE NOT NULL,
  date_mesure date NOT NULL,
  valeur numeric,
  unite text,
  conforme boolean,
  commentaire text,
  created_at timestamp with time zone DEFAULT now()
);

-- Environment RLS Policies
ALTER TABLE dechets ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_surveillance ENABLE ROW LEVEL SECURITY;
ALTER TABLE mesures_environnementales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dechets: read if client access" ON dechets FOR SELECT 
  USING (has_client_access(auth.uid(), client_id));
CREATE POLICY "Dechets: manage if client access" ON dechets FOR ALL 
  USING (has_client_access(auth.uid(), client_id)) 
  WITH CHECK (has_client_access(auth.uid(), client_id));

CREATE POLICY "PointsSurveillance: read if client access" ON points_surveillance FOR SELECT 
  USING (has_client_access(auth.uid(), client_id));
CREATE POLICY "PointsSurveillance: manage if client access" ON points_surveillance FOR ALL 
  USING (has_client_access(auth.uid(), client_id)) 
  WITH CHECK (has_client_access(auth.uid(), client_id));

CREATE POLICY "MesuresEnvironnementales: read if client access" ON mesures_environnementales FOR SELECT 
  USING (has_client_access(auth.uid(), (SELECT ps.client_id FROM points_surveillance ps WHERE ps.id = mesures_environnementales.point_id)));
CREATE POLICY "MesuresEnvironnementales: manage if client access" ON mesures_environnementales FOR ALL 
  USING (has_client_access(auth.uid(), (SELECT ps.client_id FROM points_surveillance ps WHERE ps.id = mesures_environnementales.point_id))) 
  WITH CHECK (has_client_access(auth.uid(), (SELECT ps.client_id FROM points_surveillance ps WHERE ps.id = mesures_environnementales.point_id)));

-- =============================================
-- PHASE 8: Create Site Modules & Codes
-- =============================================
CREATE TABLE IF NOT EXISTS site_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid REFERENCES sites(id) ON DELETE CASCADE NOT NULL,
  module_id uuid REFERENCES modules_systeme(id) ON DELETE CASCADE NOT NULL,
  actif boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(site_id, module_id)
);

CREATE TABLE IF NOT EXISTS codes_juridiques (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  titre text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now()
);

-- Site Modules & Codes RLS Policies
ALTER TABLE site_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE codes_juridiques ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SiteModules: read if site access" ON site_modules FOR SELECT 
  USING (has_site_access(auth.uid(), site_id));
CREATE POLICY "SiteModules: manage if site access" ON site_modules FOR ALL 
  USING (has_site_access(auth.uid(), site_id)) 
  WITH CHECK (has_site_access(auth.uid(), site_id));

CREATE POLICY "CodesJuridiques: read" ON codes_juridiques FOR SELECT USING (true);
CREATE POLICY "CodesJuridiques: super_admin manage" ON codes_juridiques FOR ALL 
  USING (has_role(auth.uid(), 'super_admin')) 
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- =============================================
-- PHASE 9: Seed Essential Data
-- =============================================

-- Update modules_systeme with proper data
UPDATE modules_systeme SET 
  libelle = 'Bibliothèque Réglementaire',
  couleur = '#3b82f6'
WHERE code = 'bibliotheque';

UPDATE modules_systeme SET 
  libelle = 'Veille Réglementaire',
  couleur = '#10b981'
WHERE code = 'veille';

-- Insert missing modules if they don't exist
INSERT INTO modules_systeme (code, nom, libelle, description, couleur, actif, ordre) VALUES
  ('epi', 'EPI', 'EPI & Équipements', 'Gestion des équipements de protection individuelle', '#f59e0b', true, 8),
  ('equipements', 'Équipements', 'Équipements', 'Gestion des équipements et contrôles', '#8b5cf6', true, 9),
  ('formations', 'Formations', 'Formations', 'Gestion des formations du personnel', '#ec4899', true, 10),
  ('incidents', 'Incidents', 'Incidents HSE', 'Gestion des incidents et accidents', '#ef4444', true, 11),
  ('environnement', 'Environnement', 'Environnement', 'Gestion environnementale', '#22c55e', true, 12)
ON CONFLICT (code) DO UPDATE SET
  libelle = EXCLUDED.libelle,
  couleur = EXCLUDED.couleur;

-- Seed permission actions
INSERT INTO permission_actions (code, nom, description) VALUES
  ('view', 'Voir', 'Consulter les données'),
  ('create', 'Créer', 'Créer de nouveaux éléments'),
  ('edit', 'Modifier', 'Modifier les éléments existants'),
  ('delete', 'Supprimer', 'Supprimer des éléments'),
  ('export', 'Exporter', 'Exporter les données'),
  ('assign', 'Assigner', 'Assigner des responsabilités'),
  ('bulk_edit', 'Modification en masse', 'Modifier plusieurs éléments à la fois'),
  ('upload_proof', 'Télécharger preuve', 'Télécharger des preuves de conformité')
ON CONFLICT (code) DO NOTHING;

-- Seed EPI types
INSERT INTO epi_types (nom, description, duree_vie_mois, norme) VALUES
  ('Casque de sécurité', 'Protection de la tête', 36, 'EN 397'),
  ('Chaussures de sécurité', 'Protection des pieds', 12, 'EN ISO 20345'),
  ('Gants de protection', 'Protection des mains', 6, 'EN 388'),
  ('Lunettes de sécurité', 'Protection des yeux', 24, 'EN 166'),
  ('Gilet haute visibilité', 'Visibilité', 24, 'EN ISO 20471')
ON CONFLICT DO NOTHING;

-- Seed equipment types
INSERT INTO equipements_types (nom, description, periodicite_controle_mois) VALUES
  ('Échafaudage', 'Échafaudage fixe ou mobile', 12),
  ('Appareil de levage', 'Ponts roulants, grues', 12),
  ('Extincteur', 'Extincteur portable', 12),
  ('Éclairage de sécurité', 'Blocs de secours', 12)
ON CONFLICT DO NOTHING;

-- Seed incident types
INSERT INTO incidents_types (nom, description, couleur) VALUES
  ('Accident du travail', 'Accident survenu au travail', '#ef4444'),
  ('Presque accident', 'Situation dangereuse sans conséquence', '#f59e0b'),
  ('Incident environnemental', 'Pollution ou dégradation environnementale', '#22c55e')
ON CONFLICT DO NOTHING;