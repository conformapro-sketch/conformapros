-- Phase 1: Corriger les contraintes de clé étrangère
-- Supprimer les anciennes contraintes pointant vers textes_reglementaires
ALTER TABLE articles_effets_juridiques
  DROP CONSTRAINT IF EXISTS articles_effets_juridiques_texte_cible_id_fkey,
  DROP CONSTRAINT IF EXISTS articles_effets_juridiques_texte_source_id_fkey;

-- Créer les nouvelles contraintes pointant vers actes_reglementaires
ALTER TABLE articles_effets_juridiques
  ADD CONSTRAINT articles_effets_juridiques_texte_cible_id_fkey
  FOREIGN KEY (texte_cible_id) 
  REFERENCES actes_reglementaires(id) ON DELETE CASCADE;

ALTER TABLE articles_effets_juridiques
  ADD CONSTRAINT articles_effets_juridiques_texte_source_id_fkey
  FOREIGN KEY (texte_source_id) 
  REFERENCES actes_reglementaires(id) ON DELETE CASCADE;

COMMENT ON TABLE articles_effets_juridiques IS 'Table des modifications réglementaires entre articles';