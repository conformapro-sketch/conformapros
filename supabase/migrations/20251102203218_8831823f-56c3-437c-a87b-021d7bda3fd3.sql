-- Add 'non_concerne' value to applicabilite_reglementaire enum
ALTER TYPE applicabilite_reglementaire ADD VALUE IF NOT EXISTS 'non_concerne';