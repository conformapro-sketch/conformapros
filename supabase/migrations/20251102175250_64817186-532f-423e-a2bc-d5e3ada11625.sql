-- Add ordre column to sous_domaines_application table
ALTER TABLE sous_domaines_application 
ADD COLUMN IF NOT EXISTS ordre INTEGER DEFAULT 0;

-- Update existing records to have ordre = 0
UPDATE sous_domaines_application 
SET ordre = 0 
WHERE ordre IS NULL;

-- Make it NOT NULL after setting defaults
ALTER TABLE sous_domaines_application 
ALTER COLUMN ordre SET NOT NULL;