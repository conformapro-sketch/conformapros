-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1) Enums
CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'gestionnaire', 'consultant', 'user');
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

-- 2) Tables - correct order
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  nom text,
  prenom text,
  telephone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  siret text,
  adresse text,
  ville text,
  code_postal text,
  pays text DEFAULT 'France',
  telephone text,
  email text,
  logo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role, client_id)
);

CREATE TABLE public.sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  nom text NOT NULL,
  adresse text NOT NULL,
  ville text NOT NULL,
  code_postal text NOT NULL,
  pays text DEFAULT 'France',
  telephone text,
  email text,
  surface numeric,
  nombre_employes integer,
  latitude numeric(10,8),
  longitude numeric(11,8),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.domaines_reglementaires (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  libelle text NOT NULL,
  description text,
  icone text,
  couleur text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.sous_domaines_application (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domaine_id uuid NOT NULL REFERENCES public.domaines_reglementaires(id) ON DELETE CASCADE,
  code text NOT NULL,
  libelle text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(domaine_id, code)
);

CREATE TABLE public.textes_reglementaires (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero text UNIQUE NOT NULL,
  titre text NOT NULL,
  type_texte text NOT NULL,
  date_publication date NOT NULL,
  date_entree_vigueur date,
  date_abrogation date,
  statut text NOT NULL DEFAULT 'en_vigueur',
  lien_officiel text,
  resume text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.textes_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  texte_id uuid NOT NULL REFERENCES public.textes_reglementaires(id) ON DELETE CASCADE,
  numero_article text NOT NULL,
  titre text,
  contenu text NOT NULL,
  ordre integer,
  parent_article_id uuid REFERENCES public.textes_articles(id) ON DELETE SET NULL,
  version_active uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(texte_id, numero_article)
);

CREATE TABLE public.articles_sous_domaines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES public.textes_articles(id) ON DELETE CASCADE,
  sous_domaine_id uuid NOT NULL REFERENCES public.sous_domaines_application(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(article_id, sous_domaine_id)
);

CREATE TABLE public.article_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES public.textes_articles(id) ON DELETE CASCADE,
  version_numero integer NOT NULL,
  contenu text NOT NULL,
  date_version date NOT NULL,
  raison_modification text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.site_article_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  article_id uuid NOT NULL REFERENCES public.textes_articles(id) ON DELETE CASCADE,
  etat_conformite public.etat_conformite NOT NULL DEFAULT 'en_attente',
  applicabilite public.applicabilite_reglementaire NOT NULL DEFAULT 'obligatoire',
  motif_non_applicable public.motif_non_applicable,
  commentaire_non_applicable text,
  date_derniere_evaluation date,
  commentaire text,
  evaluateur_id uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(site_id, article_id)
);

CREATE TABLE public.site_article_preuves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_article_status_id uuid NOT NULL REFERENCES public.site_article_status(id) ON DELETE CASCADE,
  titre text NOT NULL,
  description text,
  type_document text,
  url_document text NOT NULL,
  date_document date,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.plans_action (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  article_id uuid REFERENCES public.textes_articles(id) ON DELETE SET NULL,
  titre text NOT NULL,
  description text,
  priorite public.priorite NOT NULL DEFAULT 'moyenne',
  statut public.statut_action NOT NULL DEFAULT 'a_faire',
  date_echeance date,
  responsable_id uuid REFERENCES auth.users(id),
  cout_estime numeric(10,2),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.employes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  site_id uuid REFERENCES public.sites(id) ON DELETE SET NULL,
  nom text NOT NULL,
  prenom text NOT NULL,
  email text,
  telephone text,
  poste text,
  date_embauche date,
  numero_securite_sociale text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.visites_medicales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employe_id uuid NOT NULL REFERENCES public.employes(id) ON DELETE CASCADE,
  date_visite date NOT NULL,
  type_visite text NOT NULL,
  statut public.statut_visite NOT NULL DEFAULT 'programmee',
  medecin_travail text,
  resultat text,
  type_document public.type_document_medical,
  date_prochaine_visite date,
  commentaires text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL UNIQUE,
  description text,
  prix_mensuel numeric(10,2) NOT NULL,
  max_sites integer,
  max_utilisateurs integer,
  fonctionnalites jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.abonnements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.subscription_plans(id),
  mode_facturation public.billing_mode NOT NULL DEFAULT 'forfait_global',
  date_debut date NOT NULL,
  date_fin date,
  statut text NOT NULL DEFAULT 'actif',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.factures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  abonnement_id uuid NOT NULL REFERENCES public.abonnements(id) ON DELETE CASCADE,
  numero_facture text UNIQUE NOT NULL,
  date_emission date NOT NULL,
  date_echeance date NOT NULL,
  montant_ht numeric(10,2) NOT NULL,
  montant_tva numeric(10,2) NOT NULL,
  montant_ttc numeric(10,2) NOT NULL,
  statut text NOT NULL DEFAULT 'en_attente',
  date_paiement date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.changelog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL,
  date_publication date NOT NULL,
  titre text NOT NULL,
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3) Indexes
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_client_id ON public.user_roles(client_id);
CREATE INDEX idx_sites_client_id ON public.sites(client_id);
CREATE INDEX idx_textes_articles_texte_id ON public.textes_articles(texte_id);
CREATE INDEX idx_site_article_status_site_id ON public.site_article_status(site_id);
CREATE INDEX idx_site_article_status_article_id ON public.site_article_status(article_id);
CREATE INDEX idx_employes_client_id ON public.employes(client_id);
CREATE INDEX idx_employes_site_id ON public.employes(site_id);
CREATE INDEX idx_visites_medicales_employe_id ON public.visites_medicales(employe_id);
CREATE INDEX idx_abonnements_client_id ON public.abonnements(client_id);
CREATE INDEX idx_factures_abonnement_id ON public.factures(abonnement_id);

-- 4) Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
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