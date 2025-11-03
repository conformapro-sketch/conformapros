-- Phase 2 & 3: Add "COMPLETE" effect type and scope fields

-- 1. Add "COMPLETE" to the TypeEffet enum (modify CHECK constraint)
ALTER TABLE articles_effets_juridiques 
DROP CONSTRAINT IF EXISTS articles_effets_juridiques_type_effet_check;

ALTER TABLE articles_effets_juridiques
ADD CONSTRAINT articles_effets_juridiques_type_effet_check 
CHECK (type_effet IN ('AJOUTE', 'MODIFIE', 'ABROGE', 'REMPLACE', 'RENUMEROTE', 'COMPLETE'));

-- 2. Add scope fields (portee and portee_detail)
ALTER TABLE articles_effets_juridiques
ADD COLUMN IF NOT EXISTS portee TEXT CHECK (portee IN ('article', 'alinea', 'point')),
ADD COLUMN IF NOT EXISTS portee_detail TEXT;

-- 3. Add comments for clarity
COMMENT ON COLUMN articles_effets_juridiques.portee IS 'Portée de l''effet: article entier, alinéa spécifique, ou point précis';
COMMENT ON COLUMN articles_effets_juridiques.portee_detail IS 'Détail de la portée (ex: "alinéa 2", "point b)")';

-- 4. Create index for better performance on effect type queries
CREATE INDEX IF NOT EXISTS idx_articles_effets_juridiques_type_effet 
ON articles_effets_juridiques(type_effet);

CREATE INDEX IF NOT EXISTS idx_articles_effets_juridiques_dates 
ON articles_effets_juridiques(date_effet, date_fin_effet);

-- 5. Create a function to check legal hierarchy
CREATE OR REPLACE FUNCTION check_legal_hierarchy(
  p_source_type TEXT,
  p_target_type TEXT,
  p_effect_type TEXT
) RETURNS JSONB AS $$
DECLARE
  v_hierarchy JSONB;
BEGIN
  -- Define legal hierarchy (higher number = more powerful)
  v_hierarchy := '{
    "loi": 4,
    "decret-loi": 3,
    "decret": 2,
    "arrete": 1,
    "circulaire": 0
  }'::JSONB;
  
  -- Get hierarchy levels
  DECLARE
    v_source_level INT := (v_hierarchy ->> p_source_type)::INT;
    v_target_level INT := (v_hierarchy ->> p_target_type)::INT;
  BEGIN
    -- Rules for each effect type
    CASE p_effect_type
      WHEN 'ABROGE', 'MODIFIE', 'REMPLACE' THEN
        -- Can only abrogate/modify/replace texts of equal or lower hierarchy
        IF v_source_level < v_target_level THEN
          RETURN jsonb_build_object(
            'valid', false,
            'severity', 'error',
            'message', format('Un %s ne peut pas %s une %s (hiérarchie des normes)', 
              p_source_type, 
              LOWER(p_effect_type),
              p_target_type
            )
          );
        END IF;
        
      WHEN 'COMPLETE' THEN
        -- Circulaire can only "complete" (interpret) but not modify
        IF p_source_type = 'circulaire' AND v_source_level < v_target_level THEN
          RETURN jsonb_build_object(
            'valid', true,
            'severity', 'info',
            'message', 'Une circulaire peut compléter/interpréter des textes de niveau supérieur'
          );
        END IF;
        
      WHEN 'AJOUTE' THEN
        -- Adding articles to another text should follow hierarchy
        IF v_source_level < v_target_level THEN
          RETURN jsonb_build_object(
            'valid', false,
            'severity', 'warning',
            'message', format('Attention: Un %s ajoute un article à une %s (inhabituel)', 
              p_source_type,
              p_target_type
            )
          );
        END IF;
    END CASE;
    
    -- Default: valid
    RETURN jsonb_build_object(
      'valid', true,
      'severity', 'success',
      'message', 'Effet juridique conforme à la hiérarchie des normes'
    );
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;