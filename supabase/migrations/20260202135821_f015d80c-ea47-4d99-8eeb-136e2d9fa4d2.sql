-- Phase 3: Data Migration from textes_articles (legacy) to articles (correct)
-- This migration ensures the new Veille and Bibliothèque modules work correctly

-- Step 1: Migrate articles from legacy textes_articles to articles table
INSERT INTO articles (texte_id, numero, titre, resume, porte_exigence, est_introductif, created_at, updated_at)
SELECT 
  ta.texte_id,
  COALESCE(ta.numero, ta.numero_article, 'Art. 1') as numero,
  COALESCE(ta.titre, ta.titre_court, 'Sans titre') as titre,
  NULL as resume,
  COALESCE(ta.is_exigence, true) as porte_exigence,
  false as est_introductif,
  ta.created_at,
  NOW()
FROM textes_articles ta
WHERE ta.texte_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM articles a 
  WHERE a.texte_id = ta.texte_id 
  AND a.numero = COALESCE(ta.numero, ta.numero_article, 'Art. 1')
);

-- Step 2: Create initial versions for migrated articles using legacy content
INSERT INTO article_versions (
  article_id, 
  numero_version, 
  contenu, 
  date_effet, 
  statut, 
  source_texte_id,
  notes_modifications,
  created_at,
  updated_at
)
SELECT 
  a.id as article_id,
  1 as numero_version,
  COALESCE(ta.contenu, '<p>Contenu à compléter</p>') as contenu,
  COALESCE(tr.date_publication, CURRENT_DATE) as date_effet,
  'en_vigueur' as statut,
  a.texte_id as source_texte_id,
  'Version initiale migrée depuis textes_articles' as notes_modifications,
  NOW() as created_at,
  NOW() as updated_at
FROM articles a
JOIN textes_articles ta ON ta.texte_id = a.texte_id 
  AND COALESCE(ta.numero, ta.numero_article, 'Art. 1') = a.numero
JOIN textes_reglementaires tr ON tr.id = a.texte_id
WHERE NOT EXISTS (
  SELECT 1 FROM article_versions av WHERE av.article_id = a.id
);