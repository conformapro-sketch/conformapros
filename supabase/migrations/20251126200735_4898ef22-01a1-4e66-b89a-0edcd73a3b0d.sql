-- Créer une fonction RPC pour récupérer l'impact potentiel d'une modification de version d'article
CREATE OR REPLACE FUNCTION get_article_version_impact(p_article_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_result jsonb;
  v_sites_count int;
  v_evaluations_count int;
  v_actions_count int;
  v_sites_details jsonb;
BEGIN
  -- Compter les sites avec applicabilité définie (via conformite_evaluations comme proxy)
  SELECT COUNT(DISTINCT site_id), jsonb_agg(DISTINCT jsonb_build_object(
    'site_id', s.id,
    'site_nom', s.nom,
    'client_nom', c.nom,
    'status', ce.status
  ))
  INTO v_sites_count, v_sites_details
  FROM conformite_evaluations ce
  JOIN sites s ON s.id = ce.site_id
  JOIN clients c ON c.id = s.client_id
  WHERE ce.article_id = p_article_id;

  -- Compter les évaluations de conformité
  SELECT COUNT(*)
  INTO v_evaluations_count
  FROM conformite_evaluations
  WHERE article_id = p_article_id;

  -- Compter les actions correctives liées
  SELECT COUNT(*)
  INTO v_actions_count
  FROM actions_correctives ac
  JOIN conformite_evaluations ce ON ce.id = ac.conformite_id
  WHERE ce.article_id = p_article_id;

  -- Construire le résultat
  v_result := jsonb_build_object(
    'sites_count', COALESCE(v_sites_count, 0),
    'evaluations_count', COALESCE(v_evaluations_count, 0),
    'actions_count', COALESCE(v_actions_count, 0),
    'sites_details', COALESCE(v_sites_details, '[]'::jsonb)
  );

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION get_article_version_impact(uuid) IS 'Récupère l''impact potentiel d''une modification de version d''article sur les sites clients';
