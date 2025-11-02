-- Rename applicabilite_id to status_id and update foreign key to reference site_article_status
-- First, drop the existing foreign key constraint
ALTER TABLE conformite DROP CONSTRAINT IF EXISTS conformite_applicabilite_id_fkey;

-- Rename the column
ALTER TABLE conformite RENAME COLUMN applicabilite_id TO status_id;

-- Add new foreign key constraint pointing to site_article_status
ALTER TABLE conformite 
ADD CONSTRAINT conformite_status_id_fkey 
FOREIGN KEY (status_id) 
REFERENCES site_article_status(id) 
ON DELETE CASCADE;

-- Update the RLS policies to use the new column name
DROP POLICY IF EXISTS "Conformite: read if site access" ON conformite;
DROP POLICY IF EXISTS "Conformite: manage if site access" ON conformite;

CREATE POLICY "Conformite: read if site access" ON conformite
FOR SELECT
USING (
  has_site_access(auth.uid(), (
    SELECT site_id 
    FROM site_article_status 
    WHERE id = conformite.status_id
  ))
);

CREATE POLICY "Conformite: manage if site access" ON conformite
FOR ALL
USING (
  has_site_access(auth.uid(), (
    SELECT site_id 
    FROM site_article_status 
    WHERE id = conformite.status_id
  ))
)
WITH CHECK (
  has_site_access(auth.uid(), (
    SELECT site_id 
    FROM site_article_status 
    WHERE id = conformite.status_id
  ))
);

-- Also update actions_correctives to reference the new structure
DROP POLICY IF EXISTS "ActionsCorrectives: read if site access" ON actions_correctives;
DROP POLICY IF EXISTS "ActionsCorrectives: manage if site access" ON actions_correctives;

CREATE POLICY "ActionsCorrectives: read if site access" ON actions_correctives
FOR SELECT
USING (
  has_site_access(auth.uid(), (
    SELECT sas.site_id
    FROM conformite c
    JOIN site_article_status sas ON sas.id = c.status_id
    WHERE c.id = actions_correctives.conformite_id
  ))
);

CREATE POLICY "ActionsCorrectives: manage if site access" ON actions_correctives
FOR ALL
USING (
  has_site_access(auth.uid(), (
    SELECT sas.site_id
    FROM conformite c
    JOIN site_article_status sas ON sas.id = c.status_id
    WHERE c.id = actions_correctives.conformite_id
  ))
)
WITH CHECK (
  has_site_access(auth.uid(), (
    SELECT sas.site_id
    FROM conformite c
    JOIN site_article_status sas ON sas.id = c.status_id
    WHERE c.id = actions_correctives.conformite_id
  ))
);