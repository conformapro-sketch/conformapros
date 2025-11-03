-- Étendre le type modification_type pour inclure 'restauration'
ALTER TABLE article_versions 
DROP CONSTRAINT IF EXISTS article_versions_modification_type_check;

ALTER TABLE article_versions 
ADD CONSTRAINT article_versions_modification_type_check 
CHECK (modification_type IN (
  'modifie',
  'abroge', 
  'remplace',
  'renumerote',
  'complete',
  'ajoute',
  'restauration'
));