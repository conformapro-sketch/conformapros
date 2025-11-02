-- Supprimer la table applicabilite obsolète (remplacée par site_article_status)
-- ATTENTION: Cette migration supprime définitivement la table et ses données
-- Assurez-vous que toutes les données ont été migrées vers site_article_status

DROP TABLE IF EXISTS public.applicabilite CASCADE;

-- Commentaire: La table applicabilite a été remplacée par site_article_status
-- qui offre une meilleure structure pour gérer l'applicabilité et la conformité
-- de manière unifiée.