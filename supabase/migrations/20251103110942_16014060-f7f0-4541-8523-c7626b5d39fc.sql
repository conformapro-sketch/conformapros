-- Phase 1: Extend article_versions table with missing columns
ALTER TABLE public.article_versions
ADD COLUMN IF NOT EXISTS version_label text,
ADD COLUMN IF NOT EXISTS date_effet date,
ADD COLUMN IF NOT EXISTS effective_from date,
ADD COLUMN IF NOT EXISTS effective_to date,
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS modification_type text,
ADD COLUMN IF NOT EXISTS source_text_id uuid,
ADD COLUMN IF NOT EXISTS source_article_reference text,
ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
ADD COLUMN IF NOT EXISTS replaced_version_id uuid;

-- Add CHECK constraint for modification_type
ALTER TABLE public.article_versions
DROP CONSTRAINT IF EXISTS article_versions_modification_type_check;

ALTER TABLE public.article_versions
ADD CONSTRAINT article_versions_modification_type_check 
CHECK (modification_type IN ('modifie','abroge','remplace','renumerote','complete','ajoute') OR modification_type IS NULL);

-- Add foreign keys
ALTER TABLE public.article_versions
DROP CONSTRAINT IF EXISTS fk_source_text,
DROP CONSTRAINT IF EXISTS fk_replaced_version;

ALTER TABLE public.article_versions
ADD CONSTRAINT fk_source_text FOREIGN KEY (source_text_id) REFERENCES public.actes_reglementaires(id) ON DELETE SET NULL,
ADD CONSTRAINT fk_replaced_version FOREIGN KEY (replaced_version_id) REFERENCES public.article_versions(id) ON DELETE SET NULL;

-- Backfill existing data
UPDATE public.article_versions
SET 
  version_label = COALESCE(version_label, 'Version ' || version_numero),
  date_effet = COALESCE(date_effet, date_version),
  effective_from = COALESCE(effective_from, date_version),
  is_active = COALESCE(is_active, true)
WHERE version_label IS NULL OR date_effet IS NULL OR effective_from IS NULL OR is_active IS NULL;

-- Add unique constraint and index
CREATE UNIQUE INDEX IF NOT EXISTS idx_article_version_unique ON public.article_versions(article_id, version_numero);
CREATE INDEX IF NOT EXISTS idx_article_version_effective ON public.article_versions(article_id, effective_from DESC);

-- Phase 2: Extend articles_effets_juridiques to support quick edit content
ALTER TABLE public.articles_effets_juridiques
ADD COLUMN IF NOT EXISTS nouveau_contenu text;

-- Phase 3: Recreate the apply_effet_juridique function with proper column usage
DROP FUNCTION IF EXISTS public.apply_effet_juridique() CASCADE;

CREATE OR REPLACE FUNCTION public.apply_effet_juridique()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_texte_source_id uuid;
  v_next_version_num integer;
  v_article_cible_contenu text;
  v_article_source_contenu text;
  v_texte_source_ref text;
  v_article_source_numero text;
  v_final_contenu text;
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

  -- Traitement selon le type d'effet
  CASE NEW.type_effet
    
    -- AJOUTE : l'article source est le nouvel article, pas besoin de créer de version
    WHEN 'AJOUTE' THEN
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
          date_version,
          contenu,
          modification_type,
          source_text_id,
          source_article_reference,
          effective_from,
          effective_to,
          is_active,
          date_effet,
          raison_modification
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
          raison_modification
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
    
    -- MODIFIE ou REMPLACE : créer une nouvelle version avec le contenu saisi ou celui de l'article source
    WHEN 'MODIFIE', 'REMPLACE' THEN
      IF NEW.article_cible_id IS NOT NULL THEN
        SELECT COALESCE(MAX(version_numero), 0) + 1
        INTO v_next_version_num
        FROM article_versions
        WHERE article_id = NEW.article_cible_id;
        
        -- Utiliser le contenu saisi dans l'UI en priorité, sinon celui de l'article source
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
          raison_modification
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

-- Recreate the trigger
DROP TRIGGER IF EXISTS trg_apply_effet_juridique ON public.articles_effets_juridiques;

CREATE TRIGGER trg_apply_effet_juridique
AFTER INSERT ON public.articles_effets_juridiques
FOR EACH ROW
EXECUTE FUNCTION public.apply_effet_juridique();