-- ConformaPro Complete Schema Setup
-- This migration sets up the complete database schema for the application

-- ========================================
-- 1. EXTENSIONS
-- ========================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- 2. ENUMS
-- ========================================
CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'gestionnaire', 'consultant', 'user');
CREATE TYPE public.role_type AS ENUM ('team', 'client');
CREATE TYPE public.permission_decision AS ENUM ('allow', 'deny', 'inherit');
CREATE TYPE public.permission_scope AS ENUM ('global', 'tenant', 'site');
CREATE TYPE public.billing_mode AS ENUM ('par_site', 'par_nombre_employes', 'forfait_global');
CREATE TYPE public.domaine_reglementaire AS ENUM (
  'incendie', 'electrique', 'machines', 'levage', 'aeraulique',
  'sanitaire', 'risques_chimiques', 'environnement', 'accessibilite',
  'securite_generale', 'autre'
);
CREATE TYPE public.statut_visite AS ENUM ('programmee', 'effectuee', 'annulee', 'reportee');
CREATE TYPE public.type_document_medical AS ENUM ('aptitude', 'inaptitude', 'restriction', 'autre');
CREATE TYPE public.priorite AS ENUM ('haute', 'moyenne', 'basse');
CREATE TYPE public.statut_action AS ENUM ('a_faire', 'en_cours', 'terminee', 'annulee');
CREATE TYPE public.etat_conformite AS ENUM ('conforme', 'non_conforme', 'en_attente', 'non_applicable');
CREATE TYPE public.applicabilite_reglementaire AS ENUM ('obligatoire', 'recommande', 'non_applicable');
CREATE TYPE public.motif_non_applicable AS ENUM (
  'effectif_insuffisant', 'activite_non_concernee', 'configuration_batiment',
  'dispense_reglementaire', 'autre'
);

-- ========================================
-- 3. CORE TABLES
-- ========================================

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nom TEXT,
  prenom TEXT,
  telephone TEXT,
  avatar_url TEXT,
  tenant_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Clients table
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  siret TEXT,
  adresse TEXT,
  ville TEXT,
  code_postal TEXT,
  pays TEXT DEFAULT 'France',
  telephone TEXT,
  email TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sites table
CREATE TABLE public.sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  adresse TEXT NOT NULL,
  ville TEXT NOT NULL,
  code_postal TEXT NOT NULL,
  pays TEXT DEFAULT 'France',
  telephone TEXT,
  email TEXT,
  surface NUMERIC,
  nombre_employes INTEGER,
  latitude NUMERIC(10,8),
  longitude NUMERIC(11,8),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========================================
-- 4. ROLES SYSTEM TABLES
-- ========================================

-- Roles table (new system)
CREATE TABLE public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type role_type NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT false,
  tenant_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ,
  UNIQUE(name, tenant_id, type)
);

-- Role permissions table
CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  decision permission_decision NOT NULL DEFAULT 'allow',
  scope permission_scope NOT NULL DEFAULT 'tenant',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(role_id, module, action)
);

-- Modules system table
CREATE TABLE public.modules_systeme (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  nom TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  ordre INTEGER,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Permission actions table
CREATE TABLE public.permission_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  nom TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles table (links users to roles)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role,
  role_uuid UUID REFERENCES public.roles(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  site_scope UUID[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role_uuid, client_id)
);

-- Client users table
CREATE TABLE public.client_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nom TEXT,
  prenom TEXT,
  telephone TEXT,
  avatar_url TEXT,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  is_client_admin BOOLEAN NOT NULL DEFAULT false,
  tenant_id UUID,
  actif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User permissions table (individual permissions for client users)
CREATE TABLE public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  decision permission_decision NOT NULL DEFAULT 'allow',
  scope permission_scope NOT NULL DEFAULT 'tenant',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, client_id, module, action)
);

-- Role audit logs table
CREATE TABLE public.role_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  changes JSONB,
  tenant_id UUID REFERENCES public.clients(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========================================
-- 5. REGULATORY CONTENT TABLES
-- ========================================

-- Domaines réglementaires
CREATE TABLE public.domaines_reglementaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  libelle TEXT NOT NULL,
  description TEXT,
  icone TEXT,
  couleur TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sous-domaines
CREATE TABLE public.sous_domaines_application (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domaine_id UUID NOT NULL REFERENCES public.domaines_reglementaires(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  libelle TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(domaine_id, code)
);

-- Textes réglementaires
CREATE TABLE public.textes_reglementaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT UNIQUE NOT NULL,
  titre TEXT NOT NULL,
  type_texte TEXT NOT NULL,
  date_publication DATE NOT NULL,
  date_entree_vigueur DATE,
  date_abrogation DATE,
  statut TEXT NOT NULL DEFAULT 'en_vigueur',
  lien_officiel TEXT,
  resume TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Articles des textes
CREATE TABLE public.textes_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  texte_id UUID NOT NULL REFERENCES public.textes_reglementaires(id) ON DELETE CASCADE,
  numero_article TEXT NOT NULL,
  titre TEXT,
  contenu TEXT NOT NULL,
  ordre INTEGER,
  parent_article_id UUID REFERENCES public.textes_articles(id) ON DELETE SET NULL,
  version_active UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(texte_id, numero_article)
);

-- Liaison articles - sous-domaines
CREATE TABLE public.articles_sous_domaines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.textes_articles(id) ON DELETE CASCADE,
  sous_domaine_id UUID NOT NULL REFERENCES public.sous_domaines_application(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(article_id, sous_domaine_id)
);

-- Versions des articles
CREATE TABLE public.article_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.textes_articles(id) ON DELETE CASCADE,
  version_numero INTEGER NOT NULL,
  contenu TEXT NOT NULL,
  date_version DATE NOT NULL,
  raison_modification TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========================================
-- 6. SITE-SPECIFIC TABLES
-- ========================================

-- Statut de conformité par site/article
CREATE TABLE public.site_article_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES public.textes_articles(id) ON DELETE CASCADE,
  etat_conformite public.etat_conformite NOT NULL DEFAULT 'en_attente',
  applicabilite public.applicabilite_reglementaire NOT NULL DEFAULT 'obligatoire',
  motif_non_applicable public.motif_non_applicable,
  commentaire_non_applicable TEXT,
  date_derniere_evaluation DATE,
  commentaire TEXT,
  evaluateur_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(site_id, article_id)
);

-- Preuves de conformité
CREATE TABLE public.site_article_preuves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_article_status_id UUID NOT NULL REFERENCES public.site_article_status(id) ON DELETE CASCADE,
  titre TEXT NOT NULL,
  description TEXT,
  type_document TEXT,
  url_document TEXT NOT NULL,
  date_document DATE,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Plans d'action
CREATE TABLE public.plans_action (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  article_id UUID REFERENCES public.textes_articles(id) ON DELETE SET NULL,
  titre TEXT NOT NULL,
  description TEXT,
  priorite public.priorite NOT NULL DEFAULT 'moyenne',
  statut public.statut_action NOT NULL DEFAULT 'a_faire',
  date_echeance DATE,
  responsable_id UUID REFERENCES auth.users(id),
  cout_estime NUMERIC(10,2),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========================================
-- 7. HR & MEDICAL TABLES
-- ========================================

-- Employés
CREATE TABLE public.employes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  site_id UUID REFERENCES public.sites(id) ON DELETE SET NULL,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  email TEXT,
  telephone TEXT,
  poste TEXT,
  date_embauche DATE,
  numero_securite_sociale TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Visites médicales
CREATE TABLE public.visites_medicales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employe_id UUID NOT NULL REFERENCES public.employes(id) ON DELETE CASCADE,
  date_visite DATE NOT NULL,
  type_visite TEXT NOT NULL,
  statut public.statut_visite NOT NULL DEFAULT 'programmee',
  medecin_travail TEXT,
  resultat TEXT,
  type_document public.type_document_medical,
  date_prochaine_visite DATE,
  commentaires TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========================================
-- 8. SUBSCRIPTION & BILLING TABLES
-- ========================================

-- Plans d'abonnement
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL UNIQUE,
  description TEXT,
  prix_mensuel NUMERIC(10,2) NOT NULL,
  max_sites INTEGER,
  max_utilisateurs INTEGER,
  fonctionnalites JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Abonnements
CREATE TABLE public.abonnements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  mode_facturation public.billing_mode NOT NULL DEFAULT 'forfait_global',
  date_debut DATE NOT NULL,
  date_fin DATE,
  statut TEXT NOT NULL DEFAULT 'actif',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Factures
CREATE TABLE public.factures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  abonnement_id UUID NOT NULL REFERENCES public.abonnements(id) ON DELETE CASCADE,
  numero_facture TEXT UNIQUE NOT NULL,
  date_emission DATE NOT NULL,
  date_echeance DATE NOT NULL,
  montant_ht NUMERIC(10,2) NOT NULL,
  montant_tva NUMERIC(10,2) NOT NULL,
  montant_ttc NUMERIC(10,2) NOT NULL,
  statut TEXT NOT NULL DEFAULT 'en_attente',
  date_paiement DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========================================
-- 9. MISC TABLES
-- ========================================

-- Changelog
CREATE TABLE public.changelog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL,
  date_publication DATE NOT NULL,
  titre TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========================================
-- 10. INDEXES
-- ========================================
CREATE INDEX idx_profiles_tenant_id ON public.profiles(tenant_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_client_id ON public.user_roles(client_id);
CREATE INDEX idx_user_roles_role_uuid ON public.user_roles(role_uuid);
CREATE INDEX idx_roles_type ON public.roles(type);
CREATE INDEX idx_roles_tenant_id ON public.roles(tenant_id);
CREATE INDEX idx_role_permissions_role_id ON public.role_permissions(role_id);
CREATE INDEX idx_client_users_client_id ON public.client_users(client_id);
CREATE INDEX idx_client_users_email ON public.client_users(email);
CREATE INDEX idx_user_permissions_user_id ON public.user_permissions(user_id);
CREATE INDEX idx_user_permissions_client_id ON public.user_permissions(client_id);
CREATE INDEX idx_sites_client_id ON public.sites(client_id);
CREATE INDEX idx_textes_articles_texte_id ON public.textes_articles(texte_id);
CREATE INDEX idx_site_article_status_site_id ON public.site_article_status(site_id);
CREATE INDEX idx_site_article_status_article_id ON public.site_article_status(article_id);
CREATE INDEX idx_employes_client_id ON public.employes(client_id);
CREATE INDEX idx_employes_site_id ON public.employes(site_id);
CREATE INDEX idx_visites_medicales_employe_id ON public.visites_medicales(employe_id);
CREATE INDEX idx_abonnements_client_id ON public.abonnements(client_id);
CREATE INDEX idx_factures_abonnement_id ON public.factures(abonnement_id);

-- ========================================
-- 11. HELPER FUNCTIONS
-- ========================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;$$;

-- Handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nom, prenom)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'nom', NEW.raw_user_meta_data->>'prenom')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;$$;

-- Check if user has role (supports both enum and UUID)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_uuid
    WHERE ur.user_id = _user_id
      AND (
        LOWER(REPLACE(r.name, ' ', '_')) = LOWER(_role)
        OR r.name = _role
        OR ur.role::TEXT = _role
      )
  );
$$;

-- Check if user has access to client
CREATE OR REPLACE FUNCTION public.has_client_access(_user_id UUID, _client_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (
    -- Team users with super admin or admin global roles have access to all clients
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_uuid
    WHERE ur.user_id = _user_id
      AND r.type = 'team'
      AND (r.name = 'Super Admin' OR r.name = 'Admin Global')
  ) OR EXISTS (
    -- Users assigned to specific client
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id AND ur.client_id = _client_id
  ) OR EXISTS (
    -- Client users
    SELECT 1 FROM public.client_users cu
    WHERE cu.id = _user_id AND cu.client_id = _client_id
  );
$$;

-- Check if user has access to site
CREATE OR REPLACE FUNCTION public.has_site_access(_user_id UUID, _site_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.sites s ON s.client_id = ur.client_id
    WHERE ur.user_id = _user_id AND s.id = _site_id
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_uuid
    WHERE ur.user_id = _user_id
      AND r.type = 'team'
      AND (r.name = 'Super Admin' OR r.name = 'Admin Global')
  ) OR EXISTS (
    SELECT 1 FROM public.client_users cu
    JOIN public.sites s ON s.client_id = cu.client_id
    WHERE cu.id = _user_id AND s.id = _site_id
  );
$$;

-- ========================================
-- 12. TRIGGERS
-- ========================================

-- Auth trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sites_updated_at BEFORE UPDATE ON public.sites FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_role_permissions_updated_at BEFORE UPDATE ON public.role_permissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_client_users_updated_at BEFORE UPDATE ON public.client_users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_permissions_updated_at BEFORE UPDATE ON public.user_permissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_textes_reglementaires_updated_at BEFORE UPDATE ON public.textes_reglementaires FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_textes_articles_updated_at BEFORE UPDATE ON public.textes_articles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_site_article_status_updated_at BEFORE UPDATE ON public.site_article_status FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_plans_action_updated_at BEFORE UPDATE ON public.plans_action FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_employes_updated_at BEFORE UPDATE ON public.employes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_visites_medicales_updated_at BEFORE UPDATE ON public.visites_medicales FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_abonnements_updated_at BEFORE UPDATE ON public.abonnements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========================================
-- 13. ROW LEVEL SECURITY
-- ========================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domaines_reglementaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sous_domaines_application ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.textes_reglementaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.textes_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles_sous_domaines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_article_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_article_preuves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans_action ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visites_medicales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abonnements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.factures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.changelog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules_systeme ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permission_actions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles: self or super_admin read" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Profiles: self or super_admin update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (id = auth.uid() OR public.has_role(auth.uid(), 'super_admin'));

-- User roles policies
CREATE POLICY "UserRoles: self or super_admin read" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "UserRoles: super_admin manage" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Roles policies
CREATE POLICY "Roles: super_admin can manage all" ON public.roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Roles: users can view their assigned roles" ON public.roles
  FOR SELECT TO authenticated
  USING (id IN (SELECT role_uuid FROM public.user_roles WHERE user_id = auth.uid()));

-- Role permissions policies
CREATE POLICY "Permissions: super_admin can manage all" ON public.role_permissions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Permissions: users can view permissions for their roles" ON public.role_permissions
  FOR SELECT TO authenticated
  USING (role_id IN (SELECT role_uuid FROM public.user_roles WHERE user_id = auth.uid()));

-- Client users policies
CREATE POLICY "ClientUsers: super_admin full access" ON public.client_users
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'Super Admin'))
  WITH CHECK (public.has_role(auth.uid(), 'Super Admin'));

CREATE POLICY "ClientUsers: admin_global full access" ON public.client_users
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'Admin Global'))
  WITH CHECK (public.has_role(auth.uid(), 'Admin Global'));

CREATE POLICY "ClientUsers: users can view own record" ON public.client_users
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "ClientUsers: users can update own record" ON public.client_users
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- User permissions policies
CREATE POLICY "UserPermissions: super_admin full access" ON public.user_permissions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'Super Admin'))
  WITH CHECK (public.has_role(auth.uid(), 'Super Admin'));

CREATE POLICY "UserPermissions: users can view own" ON public.user_permissions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Clients policies
CREATE POLICY "Clients: read if has access" ON public.clients
  FOR SELECT TO authenticated
  USING (public.has_client_access(auth.uid(), id) OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Clients: super_admin manage" ON public.clients
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Sites policies
CREATE POLICY "Sites: read if has access" ON public.sites
  FOR SELECT TO authenticated
  USING (public.has_site_access(auth.uid(), id));

CREATE POLICY "Sites: super_admin manage" ON public.sites
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Content catalog policies (readable by all authenticated users)
CREATE POLICY "Domaines: read" ON public.domaines_reglementaires
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "SousDomaines: read" ON public.sous_domaines_application
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "TextesReglementaires: read" ON public.textes_reglementaires
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "TextesArticles: read" ON public.textes_articles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "ArticlesSousDomaines: read" ON public.articles_sous_domaines
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "ArticleVersions: read" ON public.article_versions
  FOR SELECT TO authenticated USING (true);

-- Content management policies (super_admin only)
CREATE POLICY "Content: super_admin manage" ON public.domaines_reglementaires
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "SousDomaines: super_admin manage" ON public.sous_domaines_application
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "TextesReglementaires: super_admin manage" ON public.textes_reglementaires
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "TextesArticles: super_admin manage" ON public.textes_articles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "ArticlesSousDomaines: super_admin manage" ON public.articles_sous_domaines
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "ArticleVersions: super_admin manage" ON public.article_versions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Site-specific policies
CREATE POLICY "SiteArticleStatus: read if site access" ON public.site_article_status
  FOR SELECT TO authenticated
  USING (public.has_site_access(auth.uid(), site_id));

CREATE POLICY "SiteArticleStatus: manage if site access" ON public.site_article_status
  FOR ALL TO authenticated
  USING (public.has_site_access(auth.uid(), site_id))
  WITH CHECK (public.has_site_access(auth.uid(), site_id));

CREATE POLICY "SiteArticlePreuves: read if site access" ON public.site_article_preuves
  FOR SELECT TO authenticated
  USING (public.has_site_access(auth.uid(), (SELECT s.site_id FROM public.site_article_status s WHERE s.id = site_article_status_id)));

CREATE POLICY "SiteArticlePreuves: manage if site access" ON public.site_article_preuves
  FOR ALL TO authenticated
  USING (public.has_site_access(auth.uid(), (SELECT s.site_id FROM public.site_article_status s WHERE s.id = site_article_status_id)))
  WITH CHECK (public.has_site_access(auth.uid(), (SELECT s.site_id FROM public.site_article_status s WHERE s.id = site_article_status_id)));

CREATE POLICY "PlansAction: read if site access" ON public.plans_action
  FOR SELECT TO authenticated
  USING (public.has_site_access(auth.uid(), site_id));

CREATE POLICY "PlansAction: manage if site access" ON public.plans_action
  FOR ALL TO authenticated
  USING (public.has_site_access(auth.uid(), site_id))
  WITH CHECK (public.has_site_access(auth.uid(), site_id));

-- Employee & medical policies
CREATE POLICY "Employes: read if client access" ON public.employes
  FOR SELECT TO authenticated
  USING (public.has_client_access(auth.uid(), client_id));

CREATE POLICY "Employes: manage if client access" ON public.employes
  FOR ALL TO authenticated
  USING (public.has_client_access(auth.uid(), client_id))
  WITH CHECK (public.has_client_access(auth.uid(), client_id));

CREATE POLICY "Visites: read if client access" ON public.visites_medicales
  FOR SELECT TO authenticated
  USING (public.has_client_access(auth.uid(), (SELECT e.client_id FROM public.employes e WHERE e.id = employe_id)));

CREATE POLICY "Visites: manage if client access" ON public.visites_medicales
  FOR ALL TO authenticated
  USING (public.has_client_access(auth.uid(), (SELECT e.client_id FROM public.employes e WHERE e.id = employe_id)))
  WITH CHECK (public.has_client_access(auth.uid(), (SELECT e.client_id FROM public.employes e WHERE e.id = employe_id)));

-- Subscription & billing policies
CREATE POLICY "SubscriptionPlans: read" ON public.subscription_plans
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "SubscriptionPlans: super_admin manage" ON public.subscription_plans
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Abonnements: read if client access" ON public.abonnements
  FOR SELECT TO authenticated
  USING (public.has_client_access(auth.uid(), client_id));

CREATE POLICY "Abonnements: super_admin manage" ON public.abonnements
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Factures: read if client access" ON public.factures
  FOR SELECT TO authenticated
  USING (public.has_client_access(auth.uid(), (SELECT a.client_id FROM public.abonnements a WHERE a.id = abonnement_id)));

CREATE POLICY "Factures: super_admin manage" ON public.factures
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Changelog & system tables policies
CREATE POLICY "Changelog: read" ON public.changelog
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Changelog: super_admin manage" ON public.changelog
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Modules: read" ON public.modules_systeme
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Modules: super_admin manage" ON public.modules_systeme
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "PermissionActions: read" ON public.permission_actions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "PermissionActions: super_admin manage" ON public.permission_actions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "AuditLogs: super_admin view all" ON public.role_audit_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "AuditLogs: authenticated can insert" ON public.role_audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ========================================
-- 14. SEED DATA
-- ========================================

-- Insert system roles
INSERT INTO public.roles (type, name, description, is_system) VALUES
  ('team', 'Super Admin', 'Full system access across all tenants', true),
  ('team', 'Admin Global', 'Administrative access to platform management', true),
  ('team', 'Manager HSE', 'HSE management and oversight', true),
  ('team', 'Analyst', 'Data analysis and reporting', true),
  ('team', 'Viewer', 'Read-only access to system data', true),
  ('client', 'Owner', 'Full access to tenant data and settings', true),
  ('client', 'Admin', 'Administrative access within tenant', true),
  ('client', 'Site Manager', 'Manage specific sites', true),
  ('client', 'Contributor', 'Create and edit content', true),
  ('client', 'Read-only', 'View-only access', true)
ON CONFLICT (name, tenant_id, type) DO NOTHING;

-- Insert modules
INSERT INTO public.modules_systeme (code, nom, description, icon, ordre, actif) VALUES
  ('bibliotheque', 'Bibliothèque', 'Bibliothèque réglementaire', 'book-open', 1, true),
  ('veille', 'Veille', 'Veille réglementaire', 'bell', 2, true),
  ('evaluation', 'Évaluation', 'Évaluation de conformité', 'clipboard-check', 3, true),
  ('plan_action', 'Plan d''action', 'Gestion des plans d''action', 'list-checks', 4, true),
  ('incidents', 'Incidents', 'Gestion des incidents', 'alert-triangle', 5, true),
  ('equipements', 'Équipements', 'Gestion des équipements', 'package', 6, true),
  ('formations', 'Formations', 'Gestion des formations', 'graduation-cap', 7, true),
  ('clients', 'Clients', 'Gestion des clients', 'building', 8, true),
  ('sites', 'Sites', 'Gestion des sites', 'map-pin', 9, true),
  ('utilisateurs', 'Utilisateurs', 'Gestion des utilisateurs', 'users', 10, true),
  ('roles', 'Rôles', 'Gestion des rôles', 'shield', 11, true)
ON CONFLICT (code) DO NOTHING;

-- Insert permission actions
INSERT INTO public.permission_actions (code, nom, description) VALUES
  ('view', 'Voir', 'Consulter les données'),
  ('create', 'Créer', 'Créer de nouvelles entrées'),
  ('edit', 'Modifier', 'Modifier les données existantes'),
  ('delete', 'Supprimer', 'Supprimer des données'),
  ('export', 'Exporter', 'Exporter des données'),
  ('assign', 'Assigner', 'Assigner des utilisateurs ou des ressources'),
  ('bulk_edit', 'Modification en masse', 'Modifier plusieurs entrées à la fois'),
  ('upload_proof', 'Télécharger preuve', 'Télécharger des preuves de conformité')
ON CONFLICT (code) DO NOTHING;

-- Seed Super Admin permissions
DO $$
DECLARE
  v_super_admin_role_id UUID;
  v_modules TEXT[] := ARRAY[
    'bibliotheque', 'veille', 'evaluation', 'plan_action', 
    'incidents', 'equipements', 'formations', 'clients', 
    'sites', 'utilisateurs', 'roles'
  ];
  v_actions TEXT[] := ARRAY[
    'view', 'create', 'edit', 'delete', 'export', 'assign', 'bulk_edit', 'upload_proof'
  ];
  v_module TEXT;
  v_action TEXT;
BEGIN
  SELECT id INTO v_super_admin_role_id FROM public.roles WHERE name = 'Super Admin' AND type = 'team';
  
  IF v_super_admin_role_id IS NOT NULL THEN
    FOREACH v_module IN ARRAY v_modules LOOP
      FOREACH v_action IN ARRAY v_actions LOOP
        INSERT INTO public.role_permissions (role_id, module, action, decision, scope)
        VALUES (v_super_admin_role_id, v_module, v_action, 'allow', 'global')
        ON CONFLICT (role_id, module, action) DO NOTHING;
      END LOOP;
    END LOOP;
  END IF;
END $$;

-- Insert domaines réglementaires
INSERT INTO public.domaines_reglementaires (code, libelle, description, icone, couleur) VALUES
  ('incendie', 'Incendie', 'Sécurité incendie et prévention des risques d''incendie', 'flame', '#E25822'),
  ('electrique', 'Électrique', 'Sécurité électrique et installations', 'zap', '#1E90FF'),
  ('machines', 'Machines', 'Sécurité des machines et équipements de travail', 'settings', '#FF8C00'),
  ('levage', 'Levage', 'Appareils et accessoires de levage', 'crane', '#9C27B0'),
  ('aeraulique', 'Aéraulique', 'Ventilation et qualité de l''air', 'wind', '#00BCD4'),
  ('sanitaire', 'Sanitaire', 'Installations sanitaires et hygiène', 'droplet', '#4CAF50'),
  ('risques_chimiques', 'Risques Chimiques', 'Produits chimiques et substances dangereuses', 'flask', '#F44336'),
  ('environnement', 'Environnement', 'Protection de l''environnement et gestion des déchets', 'leaf', '#8BC34A'),
  ('accessibilite', 'Accessibilité', 'Accessibilité des locaux et ERP', 'accessibility', '#607D8B'),
  ('securite_generale', 'Sécurité Générale', 'Sécurité générale des locaux de travail', 'shield', '#3F51B5'),
  ('autre', 'Autre', 'Autres domaines réglementaires', 'more-horizontal', '#9E9E9E')
ON CONFLICT (code) DO NOTHING;

-- Insert subscription plans
INSERT INTO public.subscription_plans (nom, description, prix_mensuel, max_sites, max_utilisateurs, fonctionnalites) VALUES
  ('Starter', 'Forfait de démarrage pour petites entreprises', 49.00, 1, 3, '{"veille_reglementaire": true, "evaluations_conformite": true, "gestion_documents": false, "support_prioritaire": false}'::jsonb),
  ('Professional', 'Solution professionnelle pour entreprises moyennes', 149.00, 5, 10, '{"veille_reglementaire": true, "evaluations_conformite": true, "gestion_documents": true, "support_prioritaire": true, "api_access": false}'::jsonb),
  ('Enterprise', 'Solution entreprise avec fonctionnalités avancées', 299.00, NULL, NULL, '{"veille_reglementaire": true, "evaluations_conformite": true, "gestion_documents": true, "support_prioritaire": true, "api_access": true, "custom_integrations": true}'::jsonb)
ON CONFLICT (nom) DO NOTHING;

-- Insert changelog
INSERT INTO public.changelog (version, date_publication, titre, description) VALUES
  ('1.0.0', '2025-01-01', 'Lancement initial', 'Première version de ConformaPro avec gestion de la bibliothèque réglementaire et évaluations de conformité.')
ON CONFLICT DO NOTHING;