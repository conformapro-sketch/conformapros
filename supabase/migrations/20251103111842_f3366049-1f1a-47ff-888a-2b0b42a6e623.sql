-- Phase 1: Enrichir article_versions avec métadonnées contextuelles

-- Ajouter colonnes pour enrichir le contexte des versions
ALTER TABLE public.article_versions
ADD COLUMN IF NOT EXISTS raison_modification text,
ADD COLUMN IF NOT EXISTS impact_estime text CHECK (impact_estime IN ('low', 'medium', 'high')),
ADD COLUMN IF NOT EXISTS valide_par uuid REFERENCES public.client_users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS valide_le timestamp with time zone,
ADD COLUMN IF NOT EXISTS commentaires_validation text,
ADD COLUMN IF NOT EXISTS tags text[];

-- Index pour optimiser les requêtes sur les tags
CREATE INDEX IF NOT EXISTS idx_article_versions_tags ON public.article_versions USING GIN(tags);

-- Index pour les versions validées
CREATE INDEX IF NOT EXISTS idx_article_versions_valide_par ON public.article_versions(valide_par) WHERE valide_par IS NOT NULL;

-- Mettre à jour la fonction apply_effet_juridique pour remplir automatiquement les nouvelles colonnes
CREATE OR REPLACE FUNCTION public.apply_effet_juridique()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_texte_source_id uuid;
  v_next_version_num integer;
  v_article_cible_contenu text;
  v_article_source_contenu text;
  v_texte_source_ref text;
  v_article_source_numero text;
  v_final_contenu text;
  v_raison text;
  v_tags text[];
BEGIN
  -- Récupérer les informations de l'article source
  SELECT 
    ta.texte_id,
    ta.contenu,
    ta.numero_article,
    tr.reference_officielle
  INTO 
    v_texte_source_id,
    v_article_source_contenu,
    v_article_source_numero,
    v_texte_source_ref
  FROM textes_articles ta
  JOIN actes_reglementaires tr ON tr.id = ta.texte_id
  WHERE ta.id = NEW.article_source_id;

  -- Construire raison et tags automatiques selon le type d'effet
  CASE NEW.type_effet
    WHEN 'MODIFIE' THEN
      v_raison := 'Modification via ' || v_texte_source_ref || ', Article ' || v_article_source_numero;
      v_tags := ARRAY['modification', 'mise_a_jour'];
    WHEN 'ABROGE' THEN
      v_raison := 'Abrogation par ' || v_texte_source_ref || ', Article ' || v_article_source_numero;
      v_tags := ARRAY['abrogation', 'suppression'];
    WHEN 'REMPLACE' THEN
      v_raison := 'Remplacement par ' || v_texte_source_ref || ', Article ' || v_article_source_numero;
      v_tags := ARRAY['remplacement', 'refonte'];
    WHEN 'RENUMEROTE' THEN
      v_raison := 'Renumérotation suite à ' || v_texte_source_ref;
      v_tags := ARRAY['renumerotation', 'reorganisation'];
    WHEN 'COMPLETE' THEN
      v_raison := 'Complément apporté par ' || v_texte_source_ref;
      v_tags := ARRAY['complement', 'precision'];
    WHEN 'AJOUTE' THEN
      v_raison := 'Ajout via ' || v_texte_source_ref;
      v_tags := ARRAY['ajout', 'nouveau'];
  END CASE;

  -- Enrichir avec les notes utilisateur si présentes
  IF NEW.notes IS NOT NULL AND NEW.notes != '' THEN
    v_raison := v_raison || ' - ' || NEW.notes;
  END IF;

  -- Traitement selon le type d'effet
  CASE NEW.type_effet
    
    WHEN 'AJOUTE' THEN
      RAISE NOTICE 'Effet AJOUTE: article % ajouté au texte %', NEW.article_source_id, NEW.texte_cible_id;
    
    WHEN 'RENUMEROTE' THEN
      IF NEW.article_cible_id IS NOT NULL AND NEW.nouvelle_numerotation IS NOT NULL THEN
        UPDATE textes_articles
        SET 
          numero_article = NEW.nouvelle_numerotation,
          updated_at = now()
        WHERE id = NEW.article_cible_id;
        
        SELECT COALESCE(MAX(version_numero), 0) + 1
        INTO v_next_version_num
        FROM article_versions
        WHERE article_id = NEW.article_cible_id;
        
        SELECT contenu INTO v_article_cible_contenu
        FROM textes_articles
        WHERE id = NEW.article_cible_id;
        
        INSERT INTO article_versions (
          article_id,
          version_numero,
          version_label,
          date_version,
          contenu,
          modification_type,
          source_text_id,
          source_article_reference,
          effective_from,
          effective_to,
          is_active,
          date_effet,
          raison_modification,
          tags,
          impact_estime
        ) VALUES (
          NEW.article_cible_id,
          v_next_version_num,
          'Version ' || v_next_version_num || ' (Rénuméroté)',
          NEW.date_effet,
          v_article_cible_contenu,
          'renumerote',
          COALESCE(NEW.texte_source_id, v_texte_source_id),
          COALESCE(NEW.reference_citation, 'Article ' || v_article_source_numero),
          NEW.date_effet,
          NEW.date_fin_effet,
          true,
          NEW.date_effet,
          v_raison,
          v_tags,
          'low'
        );
      END IF;
    
    WHEN 'ABROGE' THEN
      IF NEW.article_cible_id IS NOT NULL THEN
        SELECT COALESCE(MAX(version_numero), 0) + 1
        INTO v_next_version_num
        FROM article_versions
        WHERE article_id = NEW.article_cible_id;
        
        v_final_contenu := '<p><em>Article abrogé par ' || 
          COALESCE(NEW.reference_citation, v_texte_source_ref || ', Article ' || v_article_source_numero) || 
          '</em></p>';
        
        INSERT INTO article_versions (
          article_id,
          version_numero,
          version_label,
          date_version,
          contenu,
          modification_type,
          source_text_id,
          source_article_reference,
          effective_from,
          effective_to,
          is_active,
          date_effet,
          raison_modification,
          tags,
          impact_estime
        ) VALUES (
          NEW.article_cible_id,
          v_next_version_num,
          'Version ' || v_next_version_num || ' (Abrogé)',
          NEW.date_effet,
          v_final_contenu,
          'abroge',
          COALESCE(NEW.texte_source_id, v_texte_source_id),
          COALESCE(NEW.reference_citation, 'Article ' || v_article_source_numero),
          NEW.date_effet,
          NEW.date_fin_effet,
          true,
          NEW.date_effet,
          v_raison,
          v_tags,
          'high'
        );
        
        UPDATE article_versions
        SET 
          is_active = false,
          effective_to = NEW.date_effet
        WHERE article_id = NEW.article_cible_id
          AND version_numero < v_next_version_num
          AND is_active = true;
      END IF;
    
    WHEN 'MODIFIE', 'REMPLACE' THEN
      IF NEW.article_cible_id IS NOT NULL THEN
        SELECT COALESCE(MAX(version_numero), 0) + 1
        INTO v_next_version_num
        FROM article_versions
        WHERE article_id = NEW.article_cible_id;
        
        v_final_contenu := COALESCE(NEW.nouveau_contenu, v_article_source_contenu);
        
        INSERT INTO article_versions (
          article_id,
          version_numero,
          version_label,
          date_version,
          contenu,
          modification_type,
          source_text_id,
          source_article_reference,
          effective_from,
          effective_to,
          is_active,
          date_effet,
          raison_modification,
          tags,
          impact_estime
        ) VALUES (
          NEW.article_cible_id,
          v_next_version_num,
          'Version ' || v_next_version_num || ' (' || INITCAP(NEW.type_effet) || ')',
          NEW.date_effet,
          v_final_contenu,
          LOWER(NEW.type_effet),
          COALESCE(NEW.texte_source_id, v_texte_source_id),
          COALESCE(NEW.reference_citation, 'Article ' || v_article_source_numero),
          NEW.date_effet,
          NEW.date_fin_effet,
          true,
          NEW.date_effet,
          v_raison,
          v_tags,
          CASE WHEN NEW.type_effet = 'REMPLACE' THEN 'high' ELSE 'medium' END
        );
        
        UPDATE article_versions
        SET 
          is_active = false,
          effective_to = NEW.date_effet
        WHERE article_id = NEW.article_cible_id
          AND version_numero < v_next_version_num
          AND is_active = true;
      END IF;
  END CASE;

  RETURN NEW;
END;
$function$;