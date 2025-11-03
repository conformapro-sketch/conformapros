-- Table pour gérer les effets juridiques entre articles
CREATE TABLE IF NOT EXISTS public.articles_effets_juridiques (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_source_id uuid NOT NULL REFERENCES public.textes_articles(id) ON DELETE CASCADE,
  type_effet text NOT NULL CHECK (type_effet IN ('AJOUTE', 'MODIFIE', 'ABROGE', 'REMPLACE', 'RENUMEROTE')),
  texte_cible_id uuid REFERENCES public.textes_reglementaires(id) ON DELETE CASCADE,
  article_cible_id uuid REFERENCES public.textes_articles(id) ON DELETE CASCADE,
  nouvelle_numerotation text,
  date_effet date NOT NULL,
  date_fin_effet date,
  reference_citation text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_effets_article_source ON public.articles_effets_juridiques(article_source_id);
CREATE INDEX IF NOT EXISTS idx_effets_texte_cible ON public.articles_effets_juridiques(texte_cible_id);
CREATE INDEX IF NOT EXISTS idx_effets_article_cible ON public.articles_effets_juridiques(article_cible_id);
CREATE INDEX IF NOT EXISTS idx_effets_dates ON public.articles_effets_juridiques(date_effet, date_fin_effet);
CREATE INDEX IF NOT EXISTS idx_effets_type ON public.articles_effets_juridiques(type_effet);

-- RLS policies
ALTER TABLE public.articles_effets_juridiques ENABLE ROW LEVEL SECURITY;

CREATE POLICY "EffetsJuridiques: read" 
  ON public.articles_effets_juridiques 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "EffetsJuridiques: super_admin manage" 
  ON public.articles_effets_juridiques 
  FOR ALL 
  TO authenticated 
  USING (public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

-- Trigger pour appliquer automatiquement les effets juridiques
CREATE OR REPLACE FUNCTION public.apply_effet_juridique()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_texte_source_id uuid;
  v_next_version_num integer;
  v_article_cible_contenu text;
  v_article_source_contenu text;
  v_texte_source_ref text;
  v_article_source_numero text;
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
  JOIN textes_reglementaires tr ON tr.id = ta.texte_id
  WHERE ta.id = NEW.article_source_id;

  -- Traitement selon le type d'effet
  CASE NEW.type_effet
    
    -- AJOUTE : l'article source est le nouvel article, pas besoin de créer de version
    WHEN 'AJOUTE' THEN
      -- On ne fait rien, l'article a déjà été créé
      RAISE NOTICE 'Effet AJOUTE: article % ajouté au texte %', NEW.article_source_id, NEW.texte_cible_id;
    
    -- RENUMEROTE : mise à jour de la numérotation
    WHEN 'RENUMEROTE' THEN
      IF NEW.article_cible_id IS NOT NULL AND NEW.nouvelle_numerotation IS NOT NULL THEN
        UPDATE textes_articles
        SET 
          numero_article = NEW.nouvelle_numerotation,
          updated_at = now()
        WHERE id = NEW.article_cible_id;
        
        -- Créer une version pour tracer la rénumérotation
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
          contenu,
          modification_type,
          source_text_id,
          source_article_reference,
          effective_from,
          effective_to,
          is_active,
          notes_modification
        ) VALUES (
          NEW.article_cible_id,
          v_next_version_num,
          'Version ' || v_next_version_num || ' (Rénuméroté)',
          v_article_cible_contenu,
          'renumerote',
          v_texte_source_id,
          COALESCE(NEW.reference_citation, 'Article ' || v_article_source_numero),
          NEW.date_effet,
          NEW.date_fin_effet,
          true,
          'Rénuméroté en ' || NEW.nouvelle_numerotation || COALESCE(' - ' || NEW.notes, '')
        );
      END IF;
    
    -- ABROGE : créer une version vide avec mention "abrogé"
    WHEN 'ABROGE' THEN
      IF NEW.article_cible_id IS NOT NULL THEN
        SELECT COALESCE(MAX(version_numero), 0) + 1
        INTO v_next_version_num
        FROM article_versions
        WHERE article_id = NEW.article_cible_id;
        
        v_article_cible_contenu := '<p><em>Article abrogé par ' || 
          COALESCE(NEW.reference_citation, v_texte_source_ref || ', Article ' || v_article_source_numero) || 
          '</em></p>';
        
        INSERT INTO article_versions (
          article_id,
          version_numero,
          version_label,
          contenu,
          modification_type,
          source_text_id,
          source_article_reference,
          effective_from,
          effective_to,
          is_active,
          notes_modification
        ) VALUES (
          NEW.article_cible_id,
          v_next_version_num,
          'Version ' || v_next_version_num || ' (Abrogé)',
          v_article_cible_contenu,
          'abroge',
          v_texte_source_id,
          COALESCE(NEW.reference_citation, 'Article ' || v_article_source_numero),
          NEW.date_effet,
          NEW.date_fin_effet,
          true,
          NEW.notes
        );
        
        -- Désactiver les versions précédentes
        UPDATE article_versions
        SET 
          is_active = false,
          effective_to = NEW.date_effet
        WHERE article_id = NEW.article_cible_id
          AND version_numero < v_next_version_num
          AND is_active = true;
      END IF;
    
    -- MODIFIE ou REMPLACE : créer une nouvelle version avec le contenu de l'article source
    WHEN 'MODIFIE', 'REMPLACE' THEN
      IF NEW.article_cible_id IS NOT NULL THEN
        SELECT COALESCE(MAX(version_numero), 0) + 1
        INTO v_next_version_num
        FROM article_versions
        WHERE article_id = NEW.article_cible_id;
        
        INSERT INTO article_versions (
          article_id,
          version_numero,
          version_label,
          contenu,
          modification_type,
          source_text_id,
          source_article_reference,
          effective_from,
          effective_to,
          is_active,
          notes_modification
        ) VALUES (
          NEW.article_cible_id,
          v_next_version_num,
          'Version ' || v_next_version_num || ' (' || INITCAP(NEW.type_effet) || ')',
          v_article_source_contenu,
          LOWER(NEW.type_effet),
          v_texte_source_id,
          COALESCE(NEW.reference_citation, 'Article ' || v_article_source_numero),
          NEW.date_effet,
          NEW.date_fin_effet,
          true,
          NEW.notes
        );
        
        -- Désactiver les versions précédentes
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
$$;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_apply_effet_juridique ON public.articles_effets_juridiques;
CREATE TRIGGER trigger_apply_effet_juridique
  AFTER INSERT ON public.articles_effets_juridiques
  FOR EACH ROW
  EXECUTE FUNCTION public.apply_effet_juridique();

-- Trigger pour updated_at
CREATE TRIGGER update_articles_effets_juridiques_updated_at
  BEFORE UPDATE ON public.articles_effets_juridiques
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();