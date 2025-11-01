-- Fix security issues: Add search_path to functions missing it

-- Fix get_applicable_actes_for_site function
CREATE OR REPLACE FUNCTION public.get_applicable_actes_for_site(p_site_id uuid)
 RETURNS TABLE(acte_id uuid, reference_officielle text, intitule text, type_acte text, date_publication date, sous_domaine_id uuid, match_score integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
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

-- Fix search_actes_reglementaires function
CREATE OR REPLACE FUNCTION public.search_actes_reglementaires(search_term text, result_limit integer DEFAULT 50)
 RETURNS TABLE(id uuid, reference_officielle text, intitule text, type_acte text, date_publication date, statut_vigueur text, resume text, rank real)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
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

-- Fix get_user_sites_with_permissions function
CREATE OR REPLACE FUNCTION public.get_user_sites_with_permissions(p_user_id uuid)
 RETURNS TABLE(site_id uuid, site_name text, site_active boolean, permission_count bigint)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as site_id,
    s.nom_site as site_name,
    s.actif as site_active,
    COUNT(DISTINCT up.id) as permission_count
  FROM sites s
  INNER JOIN access_scopes acs ON acs.site_id = s.id
  LEFT JOIN user_permissions up ON up.site_id = s.id AND up.user_id = p_user_id
  WHERE acs.user_id = p_user_id
  GROUP BY s.id, s.nom_site, s.actif
  ORDER BY s.nom_site;
END;
$function$;