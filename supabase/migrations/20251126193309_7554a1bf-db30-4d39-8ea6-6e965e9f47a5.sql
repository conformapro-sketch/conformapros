-- Add missing foreign key constraint for textes_articles
-- Only add if it doesn't exist

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'textes_articles_texte_id_fkey'
    ) THEN
        ALTER TABLE textes_articles
        ADD CONSTRAINT textes_articles_texte_id_fkey 
        FOREIGN KEY (texte_id) 
        REFERENCES textes_reglementaires(id) 
        ON DELETE CASCADE;
    END IF;
END $$;