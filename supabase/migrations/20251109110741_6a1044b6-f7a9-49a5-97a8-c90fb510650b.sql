-- Create gouvernorats table for Tunisian governorates
CREATE TABLE IF NOT EXISTS public.gouvernorats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  nom TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create delegations table for Tunisian delegations
CREATE TABLE IF NOT EXISTS public.delegations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gouvernorat_id UUID NOT NULL REFERENCES public.gouvernorats(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(gouvernorat_id, nom)
);

-- Enable RLS
ALTER TABLE public.gouvernorats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delegations ENABLE ROW LEVEL SECURITY;

-- Public read access (these are reference data)
CREATE POLICY "Gouvernorats: read by all"
  ON public.gouvernorats FOR SELECT
  USING (true);

CREATE POLICY "Delegations: read by all"
  ON public.delegations FOR SELECT
  USING (true);

-- Only super_admin can manage
CREATE POLICY "Gouvernorats: super_admin manage"
  ON public.gouvernorats FOR ALL
  USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Delegations: super_admin manage"
  ON public.delegations FOR ALL
  USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- Insert all 24 Tunisian governorates
INSERT INTO public.gouvernorats (code, nom) VALUES
  ('TU', 'Tunis'),
  ('AR', 'Ariana'),
  ('BE', 'Ben Arous'),
  ('MA', 'Manouba'),
  ('NA', 'Nabeul'),
  ('ZA', 'Zaghouan'),
  ('BI', 'Bizerte'),
  ('BA', 'Béja'),
  ('JE', 'Jendouba'),
  ('KF', 'Le Kef'),
  ('SI', 'Siliana'),
  ('SO', 'Sousse'),
  ('MO', 'Monastir'),
  ('MH', 'Mahdia'),
  ('SF', 'Sfax'),
  ('KA', 'Kairouan'),
  ('KS', 'Kasserine'),
  ('SB', 'Sidi Bouzid'),
  ('GA', 'Gabès'),
  ('ME', 'Medenine'),
  ('TA', 'Tataouine'),
  ('GF', 'Gafsa'),
  ('TO', 'Tozeur'),
  ('KB', 'Kébili')
ON CONFLICT (code) DO NOTHING;

-- Insert delegations for Tunis
INSERT INTO public.delegations (gouvernorat_id, nom)
SELECT id, delegation FROM public.gouvernorats, (VALUES
  ('Carthage'),
  ('El Bardo'),
  ('El Kabaria'),
  ('El Menzah'),
  ('El Omrane'),
  ('El Omrane supérieur'),
  ('El Ouardia'),
  ('Ettahrir'),
  ('Ezzouhour'),
  ('Hrairia'),
  ('La Goulette'),
  ('La Marsa'),
  ('Le Kram'),
  ('Médina'),
  ('Sidi El Béchir'),
  ('Sidi Hassine'),
  ('Séjoumi')
) AS delegations(delegation)
WHERE gouvernorats.code = 'TU'
ON CONFLICT (gouvernorat_id, nom) DO NOTHING;

-- Insert delegations for Ariana
INSERT INTO public.delegations (gouvernorat_id, nom)
SELECT id, delegation FROM public.gouvernorats, (VALUES
  ('Ariana Ville'),
  ('Ettadhamen'),
  ('Kalâat el-Andalous'),
  ('La Soukra'),
  ('Mnihla'),
  ('Raoued'),
  ('Sidi Thabet')
) AS delegations(delegation)
WHERE gouvernorats.code = 'AR'
ON CONFLICT (gouvernorat_id, nom) DO NOTHING;

-- Insert delegations for Ben Arous
INSERT INTO public.delegations (gouvernorat_id, nom)
SELECT id, delegation FROM public.gouvernorats, (VALUES
  ('Ben Arous'),
  ('Bou Mhel el-Bassatine'),
  ('El Mourouj'),
  ('Ezzahra'),
  ('Fouchana'),
  ('Hammam Chott'),
  ('Hammam Lif'),
  ('Mégrine'),
  ('Mornag'),
  ('Mohamedia'),
  ('Nouvelle Médina'),
  ('Radès')
) AS delegations(delegation)
WHERE gouvernorats.code = 'BE'
ON CONFLICT (gouvernorat_id, nom) DO NOTHING;

-- Insert delegations for Manouba
INSERT INTO public.delegations (gouvernorat_id, nom)
SELECT id, delegation FROM public.gouvernorats, (VALUES
  ('Borj El Amri'),
  ('Douar Hicher'),
  ('El Batan'),
  ('Jedaida'),
  ('Manouba'),
  ('Mornaguia'),
  ('Oued Ellil'),
  ('Tebourba')
) AS delegations(delegation)
WHERE gouvernorats.code = 'MA'
ON CONFLICT (gouvernorat_id, nom) DO NOTHING;

-- Insert delegations for Nabeul
INSERT INTO public.delegations (gouvernorat_id, nom)
SELECT id, delegation FROM public.gouvernorats, (VALUES
  ('Béni Khalled'),
  ('Béni Khiar'),
  ('Bou Argoub'),
  ('Dar Chaâbane El Fehri'),
  ('El Haouaria'),
  ('El Mida'),
  ('Grombalia'),
  ('Hammamet'),
  ('Hammam Ghezèze'),
  ('Kélibia'),
  ('Korba'),
  ('Menzel Bouzelfa'),
  ('Menzel Temime'),
  ('Nabeul'),
  ('Soliman'),
  ('Takelsa')
) AS delegations(delegation)
WHERE gouvernorats.code = 'NA'
ON CONFLICT (gouvernorat_id, nom) DO NOTHING;

-- Insert delegations for Zaghouan
INSERT INTO public.delegations (gouvernorat_id, nom)
SELECT id, delegation FROM public.gouvernorats, (VALUES
  ('Bir Mcherga'),
  ('El Fahs'),
  ('Nadhour'),
  ('Saouaf'),
  ('Zaghouan'),
  ('Zriba')
) AS delegations(delegation)
WHERE gouvernorats.code = 'ZA'
ON CONFLICT (gouvernorat_id, nom) DO NOTHING;

-- Insert delegations for Bizerte
INSERT INTO public.delegations (gouvernorat_id, nom)
SELECT id, delegation FROM public.gouvernorats, (VALUES
  ('Bizerte Nord'),
  ('Bizerte Sud'),
  ('Djoumine'),
  ('El Alia'),
  ('Ghar El Melh'),
  ('Ghezala'),
  ('Joumine'),
  ('Mateur'),
  ('Menzel Bourguiba'),
  ('Menzel Jemil'),
  ('Ras Jebel'),
  ('Sejnane'),
  ('Tinja'),
  ('Utique'),
  ('Zarzouna')
) AS delegations(delegation)
WHERE gouvernorats.code = 'BI'
ON CONFLICT (gouvernorat_id, nom) DO NOTHING;

-- Insert delegations for Sousse
INSERT INTO public.delegations (gouvernorat_id, nom)
SELECT id, delegation FROM public.gouvernorats, (VALUES
  ('Akouda'),
  ('Bouficha'),
  ('Enfidha'),
  ('Hammam Sousse'),
  ('Hergla'),
  ('Kalâa Kebira'),
  ('Kalâa Seghira'),
  ('Kondar'),
  ('M''Saken'),
  ('Sidi Bou Ali'),
  ('Sidi El Héni'),
  ('Sousse Jawhara'),
  ('Sousse Médina'),
  ('Sousse Riadh'),
  ('Sousse Sidi Abdelhamid'),
  ('Zaouiet Sousse')
) AS delegations(delegation)
WHERE gouvernorats.code = 'SO'
ON CONFLICT (gouvernorat_id, nom) DO NOTHING;

-- Insert delegations for Sfax
INSERT INTO public.delegations (gouvernorat_id, nom)
SELECT id, delegation FROM public.gouvernorats, (VALUES
  ('Agareb'),
  ('Bir Ali Ben Khalifa'),
  ('El Amra'),
  ('El Hencha'),
  ('Ghraiba'),
  ('Jebiniana'),
  ('Kerkennah'),
  ('Mahrès'),
  ('Menzel Chaker'),
  ('Sakiet Eddaier'),
  ('Sakiet Ezzit'),
  ('Sfax Médina'),
  ('Sfax Ouest'),
  ('Sfax Sud'),
  ('Sfax Ville'),
  ('Skhira'),
  ('Thyna')
) AS delegations(delegation)
WHERE gouvernorats.code = 'SF'
ON CONFLICT (gouvernorat_id, nom) DO NOTHING;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_delegations_gouvernorat ON public.delegations(gouvernorat_id);
CREATE INDEX IF NOT EXISTS idx_gouvernorats_nom ON public.gouvernorats(nom);
CREATE INDEX IF NOT EXISTS idx_delegations_nom ON public.delegations(nom);

COMMENT ON TABLE public.gouvernorats IS 'Reference data: 24 Tunisian governorates';
COMMENT ON TABLE public.delegations IS 'Reference data: Tunisian administrative delegations by governorate';