-- Create RPC function to get active articles for a site with all related data
CREATE OR REPLACE FUNCTION get_active_articles_for_site(site_uuid uuid)
RETURNS TABLE (
  -- Version info
  version_id uuid,
  version_contenu text,
  version_date_effet date,
  version_numero integer,
  version_notes text,
  version_source_texte_id uuid,
  
  -- Article info
  article_id uuid,
  article_numero text,
  article_titre text,
  article_resume text,
  article_est_introductif boolean,
  article_porte_exigence boolean,
  
  -- Texte info
  texte_id uuid,
  texte_type text,
  texte_reference text,
  texte_titre text,
  texte_date_publication date,
  texte_autorite_id uuid,
  
  -- Aggregated related data
  domaines jsonb,
  sous_domaines jsonb,
  tags jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    av.id as version_id,
    av.contenu as version_contenu,
    av.date_effet as version_date_effet,
    av.numero_version as version_numero,
    av.notes_modifications as version_notes,
    av.source_texte_id as version_source_texte_id,
    
    a.id as article_id,
    a.numero as article_numero,
    a.titre as article_titre,
    a.resume as article_resume,
    a.est_introductif as article_est_introductif,
    a.porte_exigence as article_porte_exigence,
    
    tr.id as texte_id,
    tr.type as texte_type,
    tr.reference as texte_reference,
    tr.titre as texte_titre,
    tr.date_publication as texte_date_publication,
    tr.autorite_id as texte_autorite_id,
    
    -- Aggregate domains
    (
      SELECT jsonb_agg(jsonb_build_object(
        'id', d.id,
        'code', d.code,
        'libelle', d.libelle,
        'couleur', d.couleur
      ))
      FROM textes_domaines td
      JOIN domaines_reglementaires d ON d.id = td.domaine_id
      WHERE td.texte_id = tr.id
    ) as domaines,
    
    -- Aggregate sub-domains
    (
      SELECT jsonb_agg(jsonb_build_object(
        'id', sd.id,
        'code', sd.code,
        'libelle', sd.libelle,
        'domaine_id', sd.domaine_id
      ))
      FROM articles_sous_domaines asd
      JOIN sous_domaines_application sd ON sd.id = asd.sous_domaine_id
      WHERE asd.article_id = a.id
    ) as sous_domaines,
    
    -- Aggregate tags
    (
      SELECT jsonb_agg(jsonb_build_object(
        'id', t.id,
        'label', t.label,
        'couleur', t.couleur
      ))
      FROM article_tags at
      JOIN reglementaire_tags t ON t.id = at.tag_id
      WHERE at.article_id = a.id
    ) as tags
    
  FROM article_versions av
  JOIN articles a ON a.id = av.article_id
  JOIN textes_reglementaires tr ON tr.id = a.texte_id
  
  -- Filter by active versions only
  WHERE av.statut = 'en_vigueur'
  
  -- Filter by authorized domains for the site
  AND EXISTS (
    SELECT 1
    FROM textes_domaines td
    JOIN site_domaines_autorises sda ON sda.domaine_id = td.domaine_id
    WHERE td.texte_id = tr.id
    AND sda.site_id = site_uuid
  )
  
  ORDER BY tr.date_publication DESC, a.numero;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_active_articles_for_site(uuid) TO authenticated;