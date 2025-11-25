-- Create autorites_emettrices table
CREATE TABLE autorites_emettrices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL UNIQUE,
  nom_court text,
  type text CHECK (type IN ('legislatif', 'executif', 'ministeriel', 'agence', 'autre')),
  description text,
  pays text DEFAULT 'Tunisie',
  actif boolean DEFAULT true,
  ordre integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now()
);

-- Add foreign key column to textes_reglementaires
ALTER TABLE textes_reglementaires 
ADD COLUMN autorite_emettrice_id uuid REFERENCES autorites_emettrices(id);

-- Create index for better performance
CREATE INDEX idx_autorites_emettrices_actif ON autorites_emettrices(actif) WHERE actif = true;
CREATE INDEX idx_autorites_emettrices_nom ON autorites_emettrices(nom);
CREATE INDEX idx_textes_autorite_id ON textes_reglementaires(autorite_emettrice_id);

-- Enable RLS
ALTER TABLE autorites_emettrices ENABLE ROW LEVEL SECURITY;

-- Public can view active authorities
CREATE POLICY "Anyone can view active autorites" ON autorites_emettrices
FOR SELECT USING (actif = true OR auth.uid() IS NOT NULL);

-- Staff can manage all authorities
CREATE POLICY "Staff can insert autorites" ON autorites_emettrices
FOR INSERT WITH CHECK (
  has_role(auth.uid(), 'Super Admin') OR has_role(auth.uid(), 'Admin Global')
);

CREATE POLICY "Staff can update autorites" ON autorites_emettrices
FOR UPDATE USING (
  has_role(auth.uid(), 'Super Admin') OR has_role(auth.uid(), 'Admin Global')
);

CREATE POLICY "Staff can delete autorites" ON autorites_emettrices
FOR DELETE USING (
  has_role(auth.uid(), 'Super Admin') OR has_role(auth.uid(), 'Admin Global')
);

-- Trigger to update updated_at
CREATE TRIGGER update_autorites_emettrices_updated_at
BEFORE UPDATE ON autorites_emettrices
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Insert initial Tunisian authorities
INSERT INTO autorites_emettrices (nom, nom_court, type, ordre) VALUES
  ('Assemblée des Représentants du Peuple', 'ARP', 'legislatif', 1),
  ('Présidence de la République', 'PR', 'executif', 2),
  ('Présidence du Gouvernement', 'PG', 'executif', 3),
  ('Ministère des Affaires Sociales', 'MAS', 'ministeriel', 10),
  ('Ministère de l''Industrie, des Mines et de l''Énergie', 'MIME', 'ministeriel', 11),
  ('Ministère de l''Environnement', 'ME', 'ministeriel', 12),
  ('Ministère de la Santé', 'MS', 'ministeriel', 13),
  ('Ministère de l''Intérieur', 'MI', 'ministeriel', 14),
  ('Ministère des Finances', 'MF', 'ministeriel', 15),
  ('Ministère du Transport', 'MT', 'ministeriel', 16),
  ('Ministère de l''Agriculture', 'MA', 'ministeriel', 17),
  ('Agence Nationale de Protection de l''Environnement', 'ANPE', 'agence', 20),
  ('Caisse Nationale de Sécurité Sociale', 'CNSS', 'agence', 21),
  ('Institut de Santé et de Sécurité au Travail', 'ISST', 'agence', 22),
  ('Agence Nationale de Gestion des Déchets', 'ANGed', 'agence', 23),
  ('Office National de l''Assainissement', 'ONAS', 'agence', 24);