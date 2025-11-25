-- Prompt 20: Seed common regulatory domains and sub-domains for SST/ENV

-- Create function to seed domains (idempotent)
CREATE OR REPLACE FUNCTION seed_common_domains()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sst_id uuid;
  v_env_id uuid;
  v_social_id uuid;
BEGIN
  -- Insert SST domain if not exists
  INSERT INTO domaines_reglementaires (code, libelle, description, couleur, icone, actif)
  VALUES ('SST', 'Santé et Sécurité au Travail', 'Réglementation en matière de santé et sécurité au travail', 'hsl(210, 70%, 50%)', 'shield', true)
  ON CONFLICT (code) DO UPDATE SET 
    libelle = EXCLUDED.libelle,
    description = EXCLUDED.description,
    couleur = EXCLUDED.couleur,
    icone = EXCLUDED.icone
  RETURNING id INTO v_sst_id;

  IF v_sst_id IS NULL THEN
    SELECT id INTO v_sst_id FROM domaines_reglementaires WHERE code = 'SST';
  END IF;

  -- Insert ENV domain if not exists
  INSERT INTO domaines_reglementaires (code, libelle, description, couleur, icone, actif)
  VALUES ('ENV', 'Environnement', 'Réglementation environnementale et gestion des impacts', 'hsl(120, 60%, 45%)', 'leaf', true)
  ON CONFLICT (code) DO UPDATE SET 
    libelle = EXCLUDED.libelle,
    description = EXCLUDED.description,
    couleur = EXCLUDED.couleur,
    icone = EXCLUDED.icone
  RETURNING id INTO v_env_id;

  IF v_env_id IS NULL THEN
    SELECT id INTO v_env_id FROM domaines_reglementaires WHERE code = 'ENV';
  END IF;

  -- Insert SOCIAL domain if not exists
  INSERT INTO domaines_reglementaires (code, libelle, description, couleur, icone, actif)
  VALUES ('SOCIAL', 'Droit Social', 'Réglementation du travail et droit social', 'hsl(280, 60%, 50%)', 'users', true)
  ON CONFLICT (code) DO UPDATE SET 
    libelle = EXCLUDED.libelle,
    description = EXCLUDED.description,
    couleur = EXCLUDED.couleur,
    icone = EXCLUDED.icone
  RETURNING id INTO v_social_id;

  IF v_social_id IS NULL THEN
    SELECT id INTO v_social_id FROM domaines_reglementaires WHERE code = 'SOCIAL';
  END IF;

  -- Insert SST sub-domains
  INSERT INTO sous_domaines_application (domaine_id, code, libelle, description, ordre, actif)
  VALUES 
    (v_sst_id, 'SST-01', 'Équipements de protection individuelle (EPI)', 'Gestion et suivi des EPI', 1, true),
    (v_sst_id, 'SST-02', 'Travail en hauteur', 'Réglementation du travail en hauteur', 2, true),
    (v_sst_id, 'SST-03', 'Incendie et évacuation', 'Prévention incendie et procédures d''évacuation', 3, true),
    (v_sst_id, 'SST-04', 'Substances dangereuses', 'Manipulation et stockage de produits chimiques', 4, true),
    (v_sst_id, 'SST-05', 'Machines et équipements', 'Sécurité des machines et vérifications périodiques', 5, true),
    (v_sst_id, 'SST-06', 'Médecine du travail', 'Visites médicales et suivi de santé', 6, true),
    (v_sst_id, 'SST-07', 'Formation sécurité', 'Formation obligatoire et habilitations', 7, true),
    (v_sst_id, 'SST-08', 'Document unique (DUER)', 'Évaluation des risques professionnels', 8, true),
    (v_sst_id, 'SST-09', 'Ergonomie et TMS', 'Prévention des troubles musculo-squelettiques', 9, true),
    (v_sst_id, 'SST-10', 'Risques psychosociaux', 'Prévention du stress et harcèlement', 10, true)
  ON CONFLICT (domaine_id, code) DO UPDATE SET
    libelle = EXCLUDED.libelle,
    description = EXCLUDED.description,
    ordre = EXCLUDED.ordre;

  -- Insert ENV sub-domains
  INSERT INTO sous_domaines_application (domaine_id, code, libelle, description, ordre, actif)
  VALUES 
    (v_env_id, 'ENV-01', 'Déchets dangereux', 'Gestion des déchets industriels dangereux', 1, true),
    (v_env_id, 'ENV-02', 'Déchets non dangereux', 'Gestion des déchets ordinaires et recyclage', 2, true),
    (v_env_id, 'ENV-03', 'Rejets atmosphériques', 'Contrôle et déclaration des émissions', 3, true),
    (v_env_id, 'ENV-04', 'Rejets aqueux', 'Gestion des eaux usées et assainissement', 4, true),
    (v_env_id, 'ENV-05', 'Bruit et vibrations', 'Surveillance du bruit industriel', 5, true),
    (v_env_id, 'ENV-06', 'ICPE', 'Installations classées pour la protection de l''environnement', 6, true),
    (v_env_id, 'ENV-07', 'Sols pollués', 'Diagnostic et dépollution', 7, true),
    (v_env_id, 'ENV-08', 'Énergie', 'Efficacité énergétique et déclarations', 8, true),
    (v_env_id, 'ENV-09', 'Biodiversité', 'Protection des espèces et habitats', 9, true),
    (v_env_id, 'ENV-10', 'Économie circulaire', 'Réemploi et valorisation', 10, true)
  ON CONFLICT (domaine_id, code) DO UPDATE SET
    libelle = EXCLUDED.libelle,
    description = EXCLUDED.description,
    ordre = EXCLUDED.ordre;

  -- Insert SOCIAL sub-domains
  INSERT INTO sous_domaines_application (domaine_id, code, libelle, description, ordre, actif)
  VALUES 
    (v_social_id, 'SOC-01', 'Contrats de travail', 'Rédaction et gestion des contrats', 1, true),
    (v_social_id, 'SOC-02', 'Durée du travail', 'Horaires, heures supplémentaires, repos', 2, true),
    (v_social_id, 'SOC-03', 'Congés payés', 'Gestion des congés et absences', 3, true),
    (v_social_id, 'SOC-04', 'Représentation du personnel', 'CSE et dialogue social', 4, true),
    (v_social_id, 'SOC-05', 'Formation professionnelle', 'Plan de développement des compétences', 5, true),
    (v_social_id, 'SOC-06', 'Égalité professionnelle', 'Index égalité et non-discrimination', 6, true),
    (v_social_id, 'SOC-07', 'Handicap', 'Obligation d''emploi des travailleurs handicapés', 7, true),
    (v_social_id, 'SOC-08', 'Licenciement', 'Procédures de rupture du contrat', 8, true)
  ON CONFLICT (domaine_id, code) DO UPDATE SET
    libelle = EXCLUDED.libelle,
    description = EXCLUDED.description,
    ordre = EXCLUDED.ordre;

END;
$$;

-- Grant execute to authenticated users (staff only should call this)
GRANT EXECUTE ON FUNCTION seed_common_domains TO authenticated;

-- Run the seed function immediately
SELECT seed_common_domains();