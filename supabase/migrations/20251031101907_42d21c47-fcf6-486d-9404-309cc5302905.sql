-- Fix broken role helper functions for new roles schema and set secure search_path

-- 1) handle_new_user (search_path hardening)
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO public, pg_temp
AS $function$
BEGIN
  insert into public.profiles (id, email, nom, prenom)
  values (NEW.id, NEW.email, NEW.raw_user_meta_data->>'nom', NEW.raw_user_meta_data->>'prenom')
  on conflict (id) do nothing;
  RETURN NEW;
END;$function$;

-- 2) has_role: now joins roles table; keeps app_role param for backward-compatible RLS policies
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO public, pg_temp
AS $function$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_uuid
    where ur.user_id = _user_id
      and r.name = (_role::text)
  );
$function$;

-- 3) has_client_access: join roles; allow super_admin by role name
CREATE OR REPLACE FUNCTION public.has_client_access(_user_id uuid, _client_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO public, pg_temp
AS $function$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = _user_id and ur.client_id = _client_id
  ) OR exists (
    select 1 from public.user_roles ur
    join public.roles r on r.id = ur.role_uuid
    where ur.user_id = _user_id and r.name = 'super_admin'
  );
$function$;

-- 4) has_site_access: join roles and sites; allow super_admin by role name
CREATE OR REPLACE FUNCTION public.has_site_access(_user_id uuid, _site_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO public, pg_temp
AS $function$
  select exists (
    select 1
    from public.user_roles ur
    join public.sites s on s.client_id = ur.client_id
    where ur.user_id = _user_id and s.id = _site_id
  ) OR exists (
    select 1 from public.user_roles ur
    join public.roles r on r.id = ur.role_uuid
    where ur.user_id = _user_id and r.name = 'super_admin'
  );
$function$;

-- 5) update_updated_at_column (search_path hardening)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO public, pg_temp
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;$function$;

-- 6) search_actes_reglementaires (search_path hardening)
CREATE OR REPLACE FUNCTION public.search_actes_reglementaires(search_term text, result_limit integer DEFAULT 50)
 RETURNS TABLE(id uuid, reference_officielle text, intitule text, type_acte text, date_publication date, statut_vigueur text, resume text, rank real)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO public, pg_temp
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    ar.id,
    ar.reference_officielle,
    ar.intitule,
    ar.type_acte,
    ar.date_publication,
    ar.statut_vigueur,
    ar.resume,
    ts_rank(
      to_tsvector('french', coalesce(ar.intitule, '') || ' ' || coalesce(ar.reference_officielle, '') || ' ' || coalesce(ar.resume, '')),
      plainto_tsquery('french', search_term)
    ) as rank
  FROM public.actes_reglementaires ar
  WHERE 
    to_tsvector('french', coalesce(ar.intitule, '') || ' ' || coalesce(ar.reference_officielle, '') || ' ' || coalesce(ar.resume, ''))
    @@ plainto_tsquery('french', search_term)
  ORDER BY rank DESC
  LIMIT result_limit;
END;
$function$;

-- 7) get_applicable_actes_for_site (search_path hardening)
CREATE OR REPLACE FUNCTION public.get_applicable_actes_for_site(p_site_id uuid)
 RETURNS TABLE(acte_id uuid, reference_officielle text, intitule text, type_acte text, date_publication date, sous_domaine_id uuid, match_score integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO public, pg_temp
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    ar.id as acte_id,
    ar.reference_officielle,
    ar.intitule,
    ar.type_acte,
    ar.date_publication,
    aam.sous_domaine_id,
    aam.match_score
  FROM public.actes_reglementaires ar
  INNER JOIN public.actes_applicabilite_mapping aam ON ar.id = aam.acte_id
  WHERE ar.statut_vigueur = 'en_vigueur'
  ORDER BY aam.match_score DESC, ar.date_publication DESC;
END;
$function$;

-- 8) get_user_tenant_id (search_path hardening)
CREATE OR REPLACE FUNCTION public.get_user_tenant_id(_user_id uuid)
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO public, pg_temp
AS $function$
  SELECT tenant_id FROM public.profiles WHERE id = _user_id;
$function$;
