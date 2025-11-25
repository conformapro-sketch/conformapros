-- Ajout des colonnes manquantes sur sous_domaines_application pour supporter l'UI

ALTER TABLE sous_domaines_application
  ADD COLUMN IF NOT EXISTS ordre integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Initialiser un ordre cohérent par domaine si non défini
UPDATE sous_domaines_application sd
SET ordre = sub.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY domaine_id ORDER BY libelle) AS rn
  FROM sous_domaines_application
) AS sub
WHERE sd.id = sub.id;