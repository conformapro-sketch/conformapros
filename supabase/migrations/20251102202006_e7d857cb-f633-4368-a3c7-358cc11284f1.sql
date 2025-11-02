-- Migration: Simplifier l'enum applicabilite_reglementaire (version corrigée)
-- Supprimer 'recommande' et garder seulement 'obligatoire' et 'non_applicable'

-- Étape 1: Migrer toutes les valeurs 'recommande' vers 'non_applicable'
UPDATE site_article_status 
SET applicabilite = 'non_applicable' 
WHERE applicabilite = 'recommande';

-- Étape 2: Supprimer la contrainte de default temporairement
ALTER TABLE site_article_status 
  ALTER COLUMN applicabilite DROP DEFAULT;

-- Étape 3: Créer le nouvel enum sans 'recommande'
ALTER TYPE applicabilite_reglementaire RENAME TO applicabilite_reglementaire_old;

CREATE TYPE applicabilite_reglementaire AS ENUM ('obligatoire', 'non_applicable');

-- Étape 4: Mettre à jour la colonne pour utiliser le nouvel enum
ALTER TABLE site_article_status 
  ALTER COLUMN applicabilite TYPE applicabilite_reglementaire 
  USING applicabilite::text::applicabilite_reglementaire;

-- Étape 5: Supprimer l'ancien enum
DROP TYPE applicabilite_reglementaire_old;

-- Étape 6: Remettre un default (optionnel, 'obligatoire' par défaut)
ALTER TABLE site_article_status 
  ALTER COLUMN applicabilite SET DEFAULT 'obligatoire'::applicabilite_reglementaire;

-- Commentaire: Les justifications sont conservées en base mais cachées dans l'UI