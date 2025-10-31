-- Delete all articles to avoid foreign key conflicts
TRUNCATE TABLE textes_articles CASCADE;

-- Drop existing foreign key constraint
ALTER TABLE textes_articles 
DROP CONSTRAINT IF EXISTS textes_articles_texte_id_fkey;

-- Add new foreign key constraint pointing to actes_reglementaires
ALTER TABLE textes_articles
ADD CONSTRAINT textes_articles_texte_id_fkey 
FOREIGN KEY (texte_id) REFERENCES actes_reglementaires(id) ON DELETE CASCADE;

-- Now insert sample articles for actes
INSERT INTO textes_articles (texte_id, numero_article, titre, contenu, ordre, created_at, updated_at)
SELECT 
  ar.id,
  'Article ' || gs.i,
  'Dispositions générales - Article ' || gs.i,
  'Contenu de l''article ' || gs.i || ' du ' || ar.intitule,
  gs.i,
  NOW(),
  NOW()
FROM actes_reglementaires ar
CROSS JOIN generate_series(1, 3) as gs(i)
LIMIT 15;

-- Populate actes_reglementaires_domaines junction table
INSERT INTO actes_reglementaires_domaines (acte_id, domaine_id)
SELECT DISTINCT ar.id, dr.id
FROM actes_reglementaires ar
CROSS JOIN domaines_reglementaires dr
WHERE dr.code IN ('ENV', 'TRAV', 'HYGI', 'SEC')
ON CONFLICT DO NOTHING;

-- Update autorite_emettrice for existing acts
UPDATE actes_reglementaires
SET autorite_emettrice = CASE
  WHEN type_acte = 'loi' THEN 'Assemblée des Représentants du Peuple'
  WHEN type_acte = 'decret' THEN 'Présidence du Gouvernement'
  WHEN type_acte = 'arrete' THEN 'Ministère concerné'
  WHEN type_acte = 'circulaire' THEN 'Administration centrale'
  ELSE 'Autorité compétente'
END
WHERE autorite_emettrice IS NULL;