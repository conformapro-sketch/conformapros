-- Normaliser les valeurs type_acte en MAJUSCULES
UPDATE actes_reglementaires 
SET type_acte = CASE 
  WHEN type_acte = 'loi' THEN 'LOI'
  WHEN type_acte = 'decret' THEN 'DECRET'
  WHEN type_acte = 'decret-loi' THEN 'DECRET-LOI'
  WHEN type_acte = 'arrete' THEN 'ARRETE'
  WHEN type_acte = 'circulaire' THEN 'CIRCULAIRE'
  ELSE UPPER(type_acte)
END
WHERE type_acte != UPPER(type_acte);