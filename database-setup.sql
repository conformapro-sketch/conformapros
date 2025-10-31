-- ====================================
-- ConformaPro Database Setup Script
-- Run this in your Supabase SQL Editor
-- ====================================

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- ====================================
-- 1. CREATE ENUMS
-- ====================================

create type public.app_role as enum ('super_admin', 'admin_client', 'chef_site', 'lecteur', 'med_practitioner', 'med_admin');
create type public.billing_mode as enum ('client', 'site', 'hybrid');
create type public.domaine_reglementaire as enum ('SST', 'ENVIRONNEMENT', 'QUALITE', 'RH', 'JURIDIQUE', 'AUTRE');
create type public.statut_visite as enum ('PLANIFIEE', 'REALISEE', 'REPORTEE', 'ANNULEE', 'NO_SHOW');
create type public.type_document_medical as enum ('CONVOCATION', 'AVIS_APTITUDE', 'FICHE_INFIRMERIE', 'CERTIFICAT_MEDICAL', 'AUTRE');
create type public.priorite as enum ('basse', 'moyenne', 'haute', 'critique');
create type public.statut_action as enum ('en_attente', 'en_cours', 'terminee', 'annulee');
create type public.etat_conformite as enum ('CONFORME', 'NON_CONFORME', 'EN_COURS', 'NON_EVALUE');
create type public.applicabilite_reglementaire as enum ('APPLICABLE', 'NON_APPLICABLE', 'A_DETERMINER');
create type public.motif_non_applicable as enum ('SECTEUR', 'EFFECTIF', 'ACTIVITE', 'LOCALISATION', 'AUTRE');

-- ====================================
-- 2. CREATE TABLES
-- ====================================

-- Profiles table
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  nom text,
  prenom text,
  telephone text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- User roles table
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  role app_role not null,
  client_id uuid,
  site_id uuid,
  created_at timestamptz default now(),
  unique (user_id, role, client_id, site_id)
);

alter table public.user_roles enable row level security;

-- Clients table
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  matricule_fiscale text,
  rne_rc text,
  adresse text,
  telephone text,
  email text,
  contact_principal text,
  statut text default 'active' check (statut in ('active', 'inactive')),
  billing_mode billing_mode default 'client',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.clients enable row level security;

-- Sites table
create table public.sites (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade not null,
  nom_site text not null,
  code_site text,
  adresse text,
  ville text,
  code_postal text,
  pays text default 'Tunisie',
  latitude numeric,
  longitude numeric,
  nombre_employes integer,
  secteur_activite text,
  contact_nom text,
  contact_email text,
  contact_telephone text,
  statut text default 'actif' check (statut in ('actif', 'inactif', 'suspendu')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.sites enable row level security;

-- Add foreign keys to user_roles
alter table public.user_roles add constraint user_roles_client_id_fkey 
  foreign key (client_id) references public.clients(id) on delete cascade;
alter table public.user_roles add constraint user_roles_site_id_fkey 
  foreign key (site_id) references public.sites(id) on delete cascade;

-- Domaines réglementaires
create table public.domaines_reglementaires (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  libelle text not null,
  description text,
  icone text,
  couleur text,
  ordre integer,
  actif boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.domaines_reglementaires enable row level security;

-- Sous-domaines d'application
create table public.sous_domaines_application (
  id uuid primary key default gen_random_uuid(),
  domaine_id uuid references public.domaines_reglementaires(id) on delete cascade not null,
  code text not null,
  libelle text not null,
  description text,
  ordre integer,
  actif boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (domaine_id, code)
);

alter table public.sous_domaines_application enable row level security;

-- Textes réglementaires
create table public.textes_reglementaires (
  id uuid primary key default gen_random_uuid(),
  reference_officielle text not null unique,
  titre text not null,
  description text,
  type_texte text not null check (type_texte in ('loi', 'decret', 'arrete', 'circulaire', 'norme', 'autre')),
  date_promulgation date,
  date_publication date,
  date_entree_vigueur date,
  date_abrogation date,
  statut text default 'en_vigueur' check (statut in ('en_vigueur', 'abroge', 'modifie', 'suspendu')),
  source_officielle text,
  url_source text,
  fichier_pdf text,
  domaine_principal uuid references public.domaines_reglementaires(id),
  tags text[],
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id)
);

alter table public.textes_reglementaires enable row level security;

-- Articles des textes
create table public.textes_articles (
  id uuid primary key default gen_random_uuid(),
  texte_id uuid references public.textes_reglementaires(id) on delete cascade not null,
  numero text not null,
  titre text,
  contenu text not null,
  contenu_html text,
  chapitre text,
  section text,
  ordre integer,
  parent_article_id uuid references public.textes_articles(id),
  est_abroge boolean default false,
  date_abrogation date,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.textes_articles enable row level security;

-- Liaison articles - sous-domaines
create table public.articles_sous_domaines (
  id uuid primary key default gen_random_uuid(),
  article_id uuid references public.textes_articles(id) on delete cascade not null,
  sous_domaine_id uuid references public.sous_domaines_application(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique (article_id, sous_domaine_id)
);

alter table public.articles_sous_domaines enable row level security;

-- Versions des articles
create table public.article_versions (
  id uuid primary key default gen_random_uuid(),
  article_id uuid references public.textes_articles(id) on delete cascade not null,
  version_number integer not null,
  contenu text not null,
  contenu_html text,
  motif_modification text,
  date_modification date not null,
  modified_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  unique (article_id, version_number)
);

alter table public.article_versions enable row level security;

-- Statuts des articles par site
create table public.site_article_status (
  id uuid primary key default gen_random_uuid(),
  site_id uuid references public.sites(id) on delete cascade not null,
  article_id uuid references public.textes_articles(id) on delete cascade not null,
  applicabilite applicabilite_reglementaire default 'A_DETERMINER',
  motif_non_applicable motif_non_applicable,
  motif_commentaire text,
  etat_conformite etat_conformite default 'NON_EVALUE',
  commentaire text,
  derniere_evaluation_date date,
  prochaine_evaluation_date date,
  evaluateur_id uuid references public.profiles(id),
  suggestion_payload jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (site_id, article_id)
);

alter table public.site_article_status enable row level security;

-- Preuves de conformité
create table public.site_article_preuves (
  id uuid primary key default gen_random_uuid(),
  status_id uuid references public.site_article_status(id) on delete cascade not null,
  file_name text,
  file_url text,
  file_size integer,
  external_url text,
  commentaire text,
  uploaded_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

alter table public.site_article_preuves enable row level security;

-- Plans d'action
create table public.plans_action (
  id uuid primary key default gen_random_uuid(),
  site_id uuid references public.sites(id) on delete cascade not null,
  status_id uuid references public.site_article_status(id) on delete set null,
  titre text not null,
  description text,
  priorite priorite default 'moyenne',
  statut statut_action default 'en_attente',
  responsable_id uuid references public.profiles(id),
  responsable_nom text,
  date_creation date default current_date,
  date_echeance date,
  date_cloture date,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.plans_action enable row level security;

-- Employés
create table public.employes (
  id uuid primary key default gen_random_uuid(),
  site_id uuid references public.sites(id) on delete cascade not null,
  matricule text not null,
  nom text not null,
  prenom text not null,
  date_naissance date,
  sexe text check (sexe in ('M', 'F', 'Autre')),
  fonction text,
  departement text,
  date_embauche date,
  email text,
  telephone text,
  statut text default 'actif' check (statut in ('actif', 'inactif', 'conge', 'suspendu')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (site_id, matricule)
);

alter table public.employes enable row level security;

-- Visites médicales
create table public.visites_medicales (
  id uuid primary key default gen_random_uuid(),
  site_id uuid references public.sites(id) on delete cascade not null,
  employe_id uuid references public.employes(id) on delete cascade not null,
  type_visite text not null check (type_visite in ('EMBAUCHE', 'PERIODIQUE', 'REPRISE', 'A_LA_DEMANDE')),
  date_prevue date not null,
  heure_prevue time,
  medecin_id uuid references public.profiles(id),
  medecin_nom text,
  statut statut_visite default 'PLANIFIEE',
  date_realisee date,
  avis_aptitude text check (avis_aptitude in ('APTE', 'APTE_RESTRICTIONS', 'INAPTE_TEMPORAIRE', 'INAPTE_DEFINITIF')),
  restrictions text,
  observations text,
  prochaine_visite_date date,
  documents jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.visites_medicales enable row level security;

-- Plans d'abonnement
create table public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  nom text not null unique,
  description text,
  prix_mensuel numeric(10, 2) not null,
  devise text default 'TND',
  max_sites integer,
  max_utilisateurs integer,
  fonctionnalites jsonb,
  actif boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.subscription_plans enable row level security;

-- Abonnements
create table public.abonnements (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade,
  site_id uuid references public.sites(id) on delete cascade,
  plan_id uuid references public.subscription_plans(id) on delete set null,
  date_debut date not null,
  date_fin date,
  statut text default 'active' check (statut in ('active', 'paused', 'canceled', 'expired')),
  montant_mensuel numeric(10, 2),
  devise text default 'TND',
  auto_renouvellement boolean default true,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  check ((client_id is not null and site_id is null) or (client_id is null and site_id is not null))
);

alter table public.abonnements enable row level security;

-- Factures
create table public.factures (
  id uuid primary key default gen_random_uuid(),
  numero_facture text not null unique,
  client_id uuid references public.clients(id) on delete cascade,
  site_id uuid references public.sites(id) on delete cascade,
  abonnement_id uuid references public.abonnements(id) on delete set null,
  date_emission date not null default current_date,
  date_echeance date not null,
  montant_ht numeric(10, 2) not null,
  tva numeric(10, 2),
  montant_ttc numeric(10, 2) not null,
  devise text default 'TND',
  statut text default 'en_attente' check (statut in ('en_attente', 'payee', 'en_retard', 'annulee')),
  date_paiement date,
  mode_paiement text,
  reference_paiement text,
  notes text,
  fichier_pdf text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  check ((client_id is not null and site_id is null) or (client_id is null and site_id is not null))
);

alter table public.factures enable row level security;

-- Changelog
create table public.changelog (
  id uuid primary key default gen_random_uuid(),
  version text not null,
  titre text not null,
  description text,
  type_changement text check (type_changement in ('feature', 'fix', 'improvement', 'breaking')),
  date_publication date not null default current_date,
  important boolean default false,
  created_at timestamptz default now()
);

alter table public.changelog enable row level security;

-- ====================================
-- 3. CREATE INDEXES
-- ====================================

create index idx_user_roles_user_id on public.user_roles(user_id);
create index idx_user_roles_client_id on public.user_roles(client_id);
create index idx_user_roles_site_id on public.user_roles(site_id);
create index idx_sites_client_id on public.sites(client_id);
create index idx_textes_articles_texte_id on public.textes_articles(texte_id);
create index idx_site_article_status_site_id on public.site_article_status(site_id);
create index idx_site_article_status_article_id on public.site_article_status(article_id);
create index idx_employes_site_id on public.employes(site_id);
create index idx_visites_medicales_site_id on public.visites_medicales(site_id);
create index idx_visites_medicales_employe_id on public.visites_medicales(employe_id);
create index idx_abonnements_client_id on public.abonnements(client_id);
create index idx_abonnements_site_id on public.abonnements(site_id);
create index idx_factures_client_id on public.factures(client_id);
create index idx_factures_site_id on public.factures(site_id);

-- ====================================
-- 4. CREATE SECURITY FUNCTIONS
-- ====================================

-- Function to check user roles
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- Function to check client access
create or replace function public.has_client_access(_user_id uuid, _client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = _user_id
      and (ur.client_id = _client_id or ur.role = 'super_admin')
  )
$$;

-- Function to check site access
create or replace function public.has_site_access(_user_id uuid, _site_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    left join public.sites s on ur.client_id = s.client_id
    where ur.user_id = _user_id
      and (ur.site_id = _site_id or s.id = _site_id or ur.role = 'super_admin')
  )
$$;

-- Function to update timestamps
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, nom, prenom)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'nom',
    new.raw_user_meta_data->>'prenom'
  );
  return new;
end;
$$;

-- ====================================
-- 5. CREATE TRIGGERS
-- ====================================

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create trigger update_profiles_updated_at before update on public.profiles
  for each row execute procedure public.update_updated_at_column();

create trigger update_clients_updated_at before update on public.clients
  for each row execute procedure public.update_updated_at_column();

create trigger update_sites_updated_at before update on public.sites
  for each row execute procedure public.update_updated_at_column();

create trigger update_textes_reglementaires_updated_at before update on public.textes_reglementaires
  for each row execute procedure public.update_updated_at_column();

create trigger update_textes_articles_updated_at before update on public.textes_articles
  for each row execute procedure public.update_updated_at_column();

create trigger update_site_article_status_updated_at before update on public.site_article_status
  for each row execute procedure public.update_updated_at_column();

create trigger update_plans_action_updated_at before update on public.plans_action
  for each row execute procedure public.update_updated_at_column();

create trigger update_employes_updated_at before update on public.employes
  for each row execute procedure public.update_updated_at_column();

create trigger update_visites_medicales_updated_at before update on public.visites_medicales
  for each row execute procedure public.update_updated_at_column();

create trigger update_abonnements_updated_at before update on public.abonnements
  for each row execute procedure public.update_updated_at_column();

create trigger update_factures_updated_at before update on public.factures
  for each row execute procedure public.update_updated_at_column();

-- ====================================
-- 6. ROW LEVEL SECURITY POLICIES
-- ====================================

-- Profiles
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- User roles
create policy "Super admins can view all roles" on public.user_roles for select using (public.has_role(auth.uid(), 'super_admin'));
create policy "Admins can view roles in their client" on public.user_roles for select using (public.has_role(auth.uid(), 'admin_client') and public.has_client_access(auth.uid(), client_id));
create policy "Users can view own roles" on public.user_roles for select using (auth.uid() = user_id);
create policy "Super admins can manage all roles" on public.user_roles for all using (public.has_role(auth.uid(), 'super_admin'));

-- Clients
create policy "Users can view their clients" on public.clients for select using (public.has_role(auth.uid(), 'super_admin') or public.has_client_access(auth.uid(), id));
create policy "Super admins can insert clients" on public.clients for insert with check (public.has_role(auth.uid(), 'super_admin'));
create policy "Super admins and client admins can update their clients" on public.clients for update using (public.has_role(auth.uid(), 'super_admin') or (public.has_role(auth.uid(), 'admin_client') and public.has_client_access(auth.uid(), id)));
create policy "Super admins can delete clients" on public.clients for delete using (public.has_role(auth.uid(), 'super_admin'));

-- Sites
create policy "Users can view their sites" on public.sites for select using (public.has_role(auth.uid(), 'super_admin') or public.has_site_access(auth.uid(), id));
create policy "Admins can insert sites" on public.sites for insert with check (public.has_role(auth.uid(), 'super_admin') or (public.has_role(auth.uid(), 'admin_client') and public.has_client_access(auth.uid(), client_id)));
create policy "Admins can update their sites" on public.sites for update using (public.has_role(auth.uid(), 'super_admin') or public.has_site_access(auth.uid(), id));
create policy "Super admins can delete sites" on public.sites for delete using (public.has_role(auth.uid(), 'super_admin'));

-- Regulatory domains (public read)
create policy "Everyone can view domains" on public.domaines_reglementaires for select to authenticated using (true);
create policy "Super admins can manage domains" on public.domaines_reglementaires for all using (public.has_role(auth.uid(), 'super_admin'));

-- Sub-domains (public read)
create policy "Everyone can view sub-domains" on public.sous_domaines_application for select to authenticated using (true);
create policy "Super admins can manage sub-domains" on public.sous_domaines_application for all using (public.has_role(auth.uid(), 'super_admin'));

-- Regulatory texts (public read)
create policy "Everyone can view regulatory texts" on public.textes_reglementaires for select to authenticated using (true);
create policy "Super admins can manage texts" on public.textes_reglementaires for all using (public.has_role(auth.uid(), 'super_admin'));

-- Articles (public read)
create policy "Everyone can view articles" on public.textes_articles for select to authenticated using (true);
create policy "Super admins can manage articles" on public.textes_articles for all using (public.has_role(auth.uid(), 'super_admin'));

-- Article-subdomain links
create policy "Everyone can view article-subdomain links" on public.articles_sous_domaines for select to authenticated using (true);
create policy "Super admins can manage article-subdomain links" on public.articles_sous_domaines for all using (public.has_role(auth.uid(), 'super_admin'));

-- Article versions
create policy "Everyone can view article versions" on public.article_versions for select to authenticated using (true);
create policy "Super admins can manage article versions" on public.article_versions for all using (public.has_role(auth.uid(), 'super_admin'));

-- Site article status
create policy "Users can view status for their sites" on public.site_article_status for select using (public.has_site_access(auth.uid(), site_id));
create policy "Users can insert status for their sites" on public.site_article_status for insert with check (public.has_site_access(auth.uid(), site_id));
create policy "Users can update status for their sites" on public.site_article_status for update using (public.has_site_access(auth.uid(), site_id));
create policy "Admins can delete status" on public.site_article_status for delete using (public.has_role(auth.uid(), 'super_admin') or public.has_site_access(auth.uid(), site_id));

-- Proofs
create policy "Users can view proofs for their sites" on public.site_article_preuves for select using (exists (select 1 from public.site_article_status sas where sas.id = status_id and public.has_site_access(auth.uid(), sas.site_id)));
create policy "Users can insert proofs for their sites" on public.site_article_preuves for insert with check (exists (select 1 from public.site_article_status sas where sas.id = status_id and public.has_site_access(auth.uid(), sas.site_id)));
create policy "Users can delete their own proofs" on public.site_article_preuves for delete using (uploaded_by = auth.uid() or public.has_role(auth.uid(), 'super_admin'));

-- Action plans
create policy "Users can view actions for their sites" on public.plans_action for select using (public.has_site_access(auth.uid(), site_id));
create policy "Users can insert actions for their sites" on public.plans_action for insert with check (public.has_site_access(auth.uid(), site_id));
create policy "Users can update actions for their sites" on public.plans_action for update using (public.has_site_access(auth.uid(), site_id));
create policy "Admins can delete actions" on public.plans_action for delete using (public.has_role(auth.uid(), 'super_admin') or public.has_site_access(auth.uid(), site_id));

-- Employees
create policy "Users can view employees for their sites" on public.employes for select using (public.has_site_access(auth.uid(), site_id));
create policy "Admins can manage employees for their sites" on public.employes for all using (public.has_site_access(auth.uid(), site_id));

-- Medical visits
create policy "Users can view medical visits for their sites" on public.visites_medicales for select using (public.has_site_access(auth.uid(), site_id));
create policy "Medical staff and admins can manage visits" on public.visites_medicales for all using (public.has_role(auth.uid(), 'super_admin') or public.has_role(auth.uid(), 'med_admin') or public.has_role(auth.uid(), 'med_practitioner') or public.has_site_access(auth.uid(), site_id));

-- Subscriptions
create policy "Users can view subscriptions for their clients/sites" on public.abonnements for select using (public.has_role(auth.uid(), 'super_admin') or (client_id is not null and public.has_client_access(auth.uid(), client_id)) or (site_id is not null and public.has_site_access(auth.uid(), site_id)));
create policy "Super admins can manage subscriptions" on public.abonnements for all using (public.has_role(auth.uid(), 'super_admin'));

-- Subscription plans
create policy "Everyone can view subscription plans" on public.subscription_plans for select to authenticated using (true);
create policy "Super admins can manage plans" on public.subscription_plans for all using (public.has_role(auth.uid(), 'super_admin'));

-- Invoices
create policy "Users can view invoices for their clients/sites" on public.factures for select using (public.has_role(auth.uid(), 'super_admin') or (client_id is not null and public.has_client_access(auth.uid(), client_id)) or (site_id is not null and public.has_site_access(auth.uid(), site_id)));
create policy "Super admins can manage invoices" on public.factures for all using (public.has_role(auth.uid(), 'super_admin'));

-- Changelog
create policy "Everyone can view changelog" on public.changelog for select to authenticated using (true);
create policy "Super admins can manage changelog" on public.changelog for all using (public.has_role(auth.uid(), 'super_admin'));

-- ====================================
-- 7. INSERT INITIAL DATA
-- ====================================

-- Regulatory domains
insert into public.domaines_reglementaires (code, libelle, description, icone, couleur, ordre) values
  ('SST', 'Santé et Sécurité au Travail', 'Réglementation relative à la santé et sécurité des travailleurs', 'shield', '#ef4444', 1),
  ('ENV', 'Environnement', 'Réglementation environnementale et développement durable', 'leaf', '#10b981', 2),
  ('RH', 'Ressources Humaines', 'Code du travail et réglementation sociale', 'users', '#3b82f6', 3),
  ('QUA', 'Qualité', 'Normes et standards de qualité', 'award', '#8b5cf6', 4),
  ('JUR', 'Juridique', 'Réglementation juridique et conformité légale', 'scale', '#f59e0b', 5);

-- Sub-domains for SST
insert into public.sous_domaines_application (domaine_id, code, libelle, ordre)
select id, 'PREV', 'Prévention des risques professionnels', 1 from public.domaines_reglementaires where code = 'SST'
union all
select id, 'MED', 'Médecine du travail', 2 from public.domaines_reglementaires where code = 'SST'
union all
select id, 'EPI', 'Équipements de protection individuelle', 3 from public.domaines_reglementaires where code = 'SST'
union all
select id, 'INC', 'Incendie et évacuation', 4 from public.domaines_reglementaires where code = 'SST'
union all
select id, 'CHSCT', 'Comité d''hygiène et sécurité', 5 from public.domaines_reglementaires where code = 'SST';

-- Sub-domains for Environment
insert into public.sous_domaines_application (domaine_id, code, libelle, ordre)
select id, 'DECH', 'Gestion des déchets', 1 from public.domaines_reglementaires where code = 'ENV'
union all
select id, 'EAU', 'Gestion de l''eau', 2 from public.domaines_reglementaires where code = 'ENV'
union all
select id, 'AIR', 'Qualité de l''air', 3 from public.domaines_reglementaires where code = 'ENV'
union all
select id, 'BRUIT', 'Nuisances sonores', 4 from public.domaines_reglementaires where code = 'ENV';

-- Subscription plans
insert into public.subscription_plans (nom, description, prix_mensuel, max_sites, max_utilisateurs, fonctionnalites) values
  ('Starter', 'Pour les petites entreprises', 99.00, 1, 5, '{"veille_reglementaire": true, "evaluation_conformite": true, "gestion_documents": false, "support": "email"}'::jsonb),
  ('Professional', 'Pour les entreprises en croissance', 299.00, 5, 20, '{"veille_reglementaire": true, "evaluation_conformite": true, "gestion_documents": true, "support": "prioritaire", "api_access": true}'::jsonb),
  ('Enterprise', 'Pour les grandes organisations', 999.00, null, null, '{"veille_reglementaire": true, "evaluation_conformite": true, "gestion_documents": true, "support": "dedie", "api_access": true, "custom_integrations": true}'::jsonb);

-- Sample regulatory texts
insert into public.textes_reglementaires (reference_officielle, titre, description, type_texte, date_promulgation, statut, domaine_principal)
values
  ('Loi n° 66-27', 'Code du Travail', 'Code du travail tunisien - Loi fondamentale régissant les relations de travail', 'loi', '1966-04-30', 'en_vigueur', (select id from public.domaines_reglementaires where code = 'RH' limit 1)),
  ('Loi n° 94-28', 'Loi relative au régime de la réparation des préjudices résultant des accidents du travail et des maladies professionnelles', 'Réglementation des accidents du travail et maladies professionnelles', 'loi', '1994-02-21', 'en_vigueur', (select id from public.domaines_reglementaires where code = 'SST' limit 1)),
  ('Loi n° 96-41', 'Loi relative aux déchets et au contrôle de leur gestion et de leur élimination', 'Cadre juridique de la gestion des déchets', 'loi', '1996-06-10', 'en_vigueur', (select id from public.domaines_reglementaires where code = 'ENV' limit 1));

-- Changelog entries
insert into public.changelog (version, titre, description, type_changement, important) values
  ('1.0.0', 'Lancement de ConformaPro', 'Version initiale de la plateforme de gestion de la conformité réglementaire', 'feature', true),
  ('1.1.0', 'Amélioration de la bibliothèque réglementaire', 'Ajout de filtres avancés et recherche intelligente', 'improvement', false),
  ('1.2.0', 'Module de gestion des visites médicales', 'Nouveau module complet pour la médecine du travail', 'feature', true);
