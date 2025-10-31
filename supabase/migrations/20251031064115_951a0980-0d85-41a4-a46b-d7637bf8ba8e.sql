-- 5) Security definer helper functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.has_client_access(_user_id uuid, _client_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = _user_id and (ur.client_id = _client_id or ur.role = 'super_admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.has_site_access(_user_id uuid, _site_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  select exists (
    select 1 from public.user_roles ur
    join public.sites s on s.client_id = ur.client_id
    where ur.user_id = _user_id and s.id = _site_id
  ) or exists (
    select 1 from public.user_roles where user_id = _user_id and role = 'super_admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  insert into public.profiles (id, email, nom, prenom)
  values (NEW.id, NEW.email, NEW.raw_user_meta_data->>'nom', NEW.raw_user_meta_data->>'prenom')
  on conflict (id) do nothing;
  RETURN NEW;
END;$$;

-- 6) Triggers
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sites_updated_at BEFORE UPDATE ON public.sites FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_textes_reglementaires_updated_at BEFORE UPDATE ON public.textes_reglementaires FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_textes_articles_updated_at BEFORE UPDATE ON public.textes_articles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_site_article_status_updated_at BEFORE UPDATE ON public.site_article_status FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_plans_action_updated_at BEFORE UPDATE ON public.plans_action FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_employes_updated_at BEFORE UPDATE ON public.employes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_visites_medicales_updated_at BEFORE UPDATE ON public.visites_medicales FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_abonnements_updated_at BEFORE UPDATE ON public.abonnements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7) RLS Policies
-- profiles
CREATE POLICY "Profiles: self or super_admin read" ON public.profiles
FOR SELECT TO authenticated
USING (id = auth.uid() OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Profiles: self or super_admin update" ON public.profiles
FOR UPDATE TO authenticated
USING (id = auth.uid() OR public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (id = auth.uid() OR public.has_role(auth.uid(), 'super_admin'));

-- user_roles
CREATE POLICY "UserRoles: self or super_admin read" ON public.user_roles
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "UserRoles: super_admin manage" ON public.user_roles
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- clients
CREATE POLICY "Clients: read if has access or super_admin" ON public.clients
FOR SELECT TO authenticated
USING (public.has_client_access(auth.uid(), id) OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Clients: super_admin manage" ON public.clients
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- sites
CREATE POLICY "Sites: read if has access" ON public.sites
FOR SELECT TO authenticated
USING (public.has_site_access(auth.uid(), id));

CREATE POLICY "Sites: super_admin manage" ON public.sites
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Content catalog (readable by all authenticated users)
CREATE POLICY "Domaines: read" ON public.domaines_reglementaires FOR SELECT TO authenticated USING (true);
CREATE POLICY "SousDomaines: read" ON public.sous_domaines_application FOR SELECT TO authenticated USING (true);
CREATE POLICY "TextesReglementaires: read" ON public.textes_reglementaires FOR SELECT TO authenticated USING (true);
CREATE POLICY "TextesArticles: read" ON public.textes_articles FOR SELECT TO authenticated USING (true);
CREATE POLICY "ArticlesSousDomaines: read" ON public.articles_sous_domaines FOR SELECT TO authenticated USING (true);
CREATE POLICY "ArticleVersions: read" ON public.article_versions FOR SELECT TO authenticated USING (true);

-- Manage content: super_admin only
CREATE POLICY "Content: super_admin manage" ON public.domaines_reglementaires FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "SousDomaines: super_admin manage" ON public.sous_domaines_application FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "TextesReglementaires: super_admin manage" ON public.textes_reglementaires FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "TextesArticles: super_admin manage" ON public.textes_articles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "ArticlesSousDomaines: super_admin manage" ON public.articles_sous_domaines FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "ArticleVersions: super_admin manage" ON public.article_versions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- site_article_status and preuves
CREATE POLICY "SiteArticleStatus: read if site access" ON public.site_article_status FOR SELECT TO authenticated USING (public.has_site_access(auth.uid(), site_id));
CREATE POLICY "SiteArticleStatus: write if site access" ON public.site_article_status FOR INSERT TO authenticated WITH CHECK (public.has_site_access(auth.uid(), site_id));
CREATE POLICY "SiteArticleStatus: update if site access" ON public.site_article_status FOR UPDATE TO authenticated USING (public.has_site_access(auth.uid(), site_id)) WITH CHECK (public.has_site_access(auth.uid(), site_id));

CREATE POLICY "SiteArticlePreuves: read if site access" ON public.site_article_preuves FOR SELECT TO authenticated USING (
  public.has_site_access(auth.uid(), (select s.site_id from public.site_article_status s where s.id = site_article_status_id))
);
CREATE POLICY "SiteArticlePreuves: manage if site access" ON public.site_article_preuves FOR ALL TO authenticated USING (
  public.has_site_access(auth.uid(), (select s.site_id from public.site_article_status s where s.id = site_article_status_id))
) WITH CHECK (
  public.has_site_access(auth.uid(), (select s.site_id from public.site_article_status s where s.id = site_article_status_id))
);

-- plans_action
CREATE POLICY "PlansAction: read if site access" ON public.plans_action FOR SELECT TO authenticated USING (public.has_site_access(auth.uid(), site_id));
CREATE POLICY "PlansAction: manage if site access" ON public.plans_action FOR ALL TO authenticated USING (public.has_site_access(auth.uid(), site_id)) WITH CHECK (public.has_site_access(auth.uid(), site_id));

-- employes & visites
CREATE POLICY "Employes: read if client access" ON public.employes FOR SELECT TO authenticated USING (public.has_client_access(auth.uid(), client_id));
CREATE POLICY "Employes: manage if client access" ON public.employes FOR ALL TO authenticated USING (public.has_client_access(auth.uid(), client_id)) WITH CHECK (public.has_client_access(auth.uid(), client_id));

CREATE POLICY "Visites: read if client access" ON public.visites_medicales FOR SELECT TO authenticated USING (
  public.has_client_access(auth.uid(), (select e.client_id from public.employes e where e.id = employe_id))
);
CREATE POLICY "Visites: manage if client access" ON public.visites_medicales FOR ALL TO authenticated USING (
  public.has_client_access(auth.uid(), (select e.client_id from public.employes e where e.id = employe_id))
) WITH CHECK (
  public.has_client_access(auth.uid(), (select e.client_id from public.employes e where e.id = employe_id))
);

-- subscriptions & invoices
CREATE POLICY "SubscriptionPlans: read" ON public.subscription_plans FOR SELECT TO authenticated USING (true);
CREATE POLICY "SubscriptionPlans: super_admin manage" ON public.subscription_plans FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Abonnements: read if client access" ON public.abonnements FOR SELECT TO authenticated USING (public.has_client_access(auth.uid(), client_id));
CREATE POLICY "Abonnements: super_admin manage" ON public.abonnements FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Factures: read if client access" ON public.factures FOR SELECT TO authenticated USING (
  public.has_client_access(auth.uid(), (select a.client_id from public.abonnements a where a.id = abonnement_id))
);
CREATE POLICY "Factures: super_admin manage" ON public.factures FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- changelog readable by all authenticated users, manage by super_admin
CREATE POLICY "Changelog: read" ON public.changelog FOR SELECT TO authenticated USING (true);
CREATE POLICY "Changelog: super_admin manage" ON public.changelog FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- 8) Seed initial data
INSERT INTO public.domaines_reglementaires (code, libelle, description, icone, couleur)
VALUES
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

INSERT INTO public.subscription_plans (nom, description, prix_mensuel, max_sites, max_utilisateurs, fonctionnalites)
VALUES
  ('Starter', 'Forfait de démarrage pour petites entreprises', 49.00, 1, 3, '{"veille_reglementaire": true, "evaluations_conformite": true, "gestion_documents": false, "support_prioritaire": false}'::jsonb),
  ('Professional', 'Solution professionnelle pour entreprises moyennes', 149.00, 5, 10, '{"veille_reglementaire": true, "evaluations_conformite": true, "gestion_documents": true, "support_prioritaire": true, "api_access": false}'::jsonb),
  ('Enterprise', 'Solution entreprise avec fonctionnalités avancées', 299.00, NULL, NULL, '{"veille_reglementaire": true, "evaluations_conformite": true, "gestion_documents": true, "support_prioritaire": true, "api_access": true, "custom_integrations": true}'::jsonb)
ON CONFLICT (nom) DO NOTHING;

INSERT INTO public.changelog (version, date_publication, titre, description)
VALUES
  ('1.0.0', '2025-01-01', 'Lancement initial', 'Première version de ConformaPro avec gestion de la bibliothèque réglementaire et évaluations de conformité.')
ON CONFLICT DO NOTHING;