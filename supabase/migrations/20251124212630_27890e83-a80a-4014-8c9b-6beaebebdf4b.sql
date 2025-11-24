-- RPC: Get site with modules summary for quick status checking
CREATE OR REPLACE FUNCTION public.get_site_modules_summary(p_site_id UUID)
RETURNS TABLE(
  site_id UUID,
  site_name TEXT,
  enabled_modules_count INT,
  total_modules_count INT,
  module_codes TEXT[],
  has_veille BOOLEAN,
  has_bibliotheque BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id AS site_id,
    s.nom AS site_name,
    COUNT(DISTINCT CASE WHEN sm.actif = true THEN sm.module_id END)::INT AS enabled_modules_count,
    COUNT(DISTINCT ms.id)::INT AS total_modules_count,
    ARRAY_AGG(DISTINCT ms.code) FILTER (WHERE sm.actif = true) AS module_codes,
    BOOL_OR(ms.code = 'VEILLE' AND sm.actif = true) AS has_veille,
    BOOL_OR(ms.code = 'BIBLIOTHEQUE' AND sm.actif = true) AS has_bibliotheque
  FROM sites s
  LEFT JOIN site_modules sm ON sm.site_id = s.id
  LEFT JOIN modules_systeme ms ON ms.id = sm.module_id AND ms.type = 'metier'
  WHERE s.id = p_site_id
  GROUP BY s.id, s.nom;
END;
$$;

-- RPC: Quick enable site modules (batch operation)
CREATE OR REPLACE FUNCTION public.quick_enable_site_modules(
  p_site_id UUID,
  p_module_codes TEXT[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_module_id UUID;
  v_code TEXT;
  v_enabled_count INT := 0;
  v_result JSONB;
BEGIN
  -- Check authorization
  IF NOT (has_role(auth.uid(), 'Super Admin') OR has_role(auth.uid(), 'Admin Global')) THEN
    IF NOT EXISTS (
      SELECT 1 FROM client_users cu
      JOIN sites s ON s.client_id = cu.client_id
      WHERE cu.id = auth.uid() 
        AND cu.is_client_admin = true 
        AND s.id = p_site_id
    ) THEN
      RAISE EXCEPTION 'Access denied: insufficient permissions';
    END IF;
  END IF;

  -- Loop through each module code and enable it
  FOREACH v_code IN ARRAY p_module_codes
  LOOP
    -- Get module_id from code
    SELECT id INTO v_module_id
    FROM modules_systeme
    WHERE LOWER(code) = LOWER(v_code) AND type = 'metier'
    LIMIT 1;

    IF v_module_id IS NULL THEN
      CONTINUE; -- Skip invalid module codes
    END IF;

    -- Upsert site_module
    INSERT INTO site_modules (site_id, module_id, actif, enabled_by, enabled_at)
    VALUES (p_site_id, v_module_id, true, auth.uid(), NOW())
    ON CONFLICT (site_id, module_id)
    DO UPDATE SET 
      actif = true,
      enabled_by = auth.uid(),
      enabled_at = NOW()
    WHERE site_modules.actif = false;

    v_enabled_count := v_enabled_count + 1;
  END LOOP;

  -- Return result summary
  SELECT jsonb_build_object(
    'success', true,
    'enabled_count', v_enabled_count,
    'site_id', p_site_id
  ) INTO v_result;

  RETURN v_result;

EXCEPTION
  WHEN others THEN
    RAISE EXCEPTION 'Error in quick_enable_site_modules: %', SQLERRM;
END;
$$;