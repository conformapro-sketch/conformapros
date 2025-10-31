-- Create gouvernorats table for Tunisia
CREATE TABLE public.gouvernorats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  code text UNIQUE,
  pays text DEFAULT 'TN',
  created_at timestamp with time zone DEFAULT now()
);

-- Create delegations table for Tunisia
CREATE TABLE public.delegations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gouvernorat_id uuid NOT NULL REFERENCES public.gouvernorats(id) ON DELETE CASCADE,
  nom text NOT NULL,
  code text UNIQUE,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gouvernorats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delegations ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read gouvernorats and delegations
CREATE POLICY "Gouvernorats: authenticated can read"
ON public.gouvernorats FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Delegations: authenticated can read"
ON public.delegations FOR SELECT
TO authenticated
USING (true);

-- Add INSERT policy on sites table
CREATE POLICY "Sites: super_admin or client access can insert"
ON public.sites FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR has_client_access(auth.uid(), client_id)
);

-- Seed gouvernorats (24 gouvernorats of Tunisia)
INSERT INTO public.gouvernorats (nom, code) VALUES
('Ariana', 'ARI'),
('Béja', 'BEJ'),
('Ben Arous', 'BEN'),
('Bizerte', 'BIZ'),
('Gabès', 'GAB'),
('Gafsa', 'GAF'),
('Jendouba', 'JEN'),
('Kairouan', 'KAI'),
('Kasserine', 'KAS'),
('Kébili', 'KEB'),
('Le Kef', 'KEF'),
('Mahdia', 'MAH'),
('Manouba', 'MAN'),
('Médenine', 'MED'),
('Monastir', 'MON'),
('Nabeul', 'NAB'),
('Sfax', 'SFX'),
('Sidi Bouzid', 'SID'),
('Siliana', 'SIL'),
('Sousse', 'SOU'),
('Tataouine', 'TAT'),
('Tozeur', 'TOZ'),
('Tunis', 'TUN'),
('Zaghouan', 'ZAG');

-- Seed delegations for each gouvernorat
INSERT INTO public.delegations (gouvernorat_id, nom, code)
SELECT g.id, d.nom, d.code FROM public.gouvernorats g
CROSS JOIN LATERAL (VALUES
  -- Ariana
  ('Ariana Ville', 'ARI_VIL'), ('Ettadhamen', 'ARI_ETT'), ('Kalâat el-Andalous', 'ARI_KAL'),
  ('Raoued', 'ARI_RAO'), ('Sidi Thabet', 'ARI_SID'), ('Soukra', 'ARI_SOU'), ('Mnihla', 'ARI_MNI')
) AS d(nom, code) WHERE g.code = 'ARI'
UNION ALL
SELECT g.id, d.nom, d.code FROM public.gouvernorats g
CROSS JOIN LATERAL (VALUES
  -- Béja
  ('Béja Nord', 'BEJ_NOR'), ('Béja Sud', 'BEJ_SUD'), ('Amdoun', 'BEJ_AMD'),
  ('Nefza', 'BEJ_NEF'), ('Téboursouk', 'BEJ_TEB'), ('Testour', 'BEJ_TES'),
  ('Goubellat', 'BEJ_GOU'), ('Medjez el-Bab', 'BEJ_MED'), ('Thibar', 'BEJ_THI')
) AS d(nom, code) WHERE g.code = 'BEJ'
UNION ALL
SELECT g.id, d.nom, d.code FROM public.gouvernorats g
CROSS JOIN LATERAL (VALUES
  -- Ben Arous
  ('Ben Arous', 'BEN_BEN'), ('Bou Mhel el-Bassatine', 'BEN_BOU'), ('El Mourouj', 'BEN_MOU'),
  ('Ezzahra', 'BEN_EZZ'), ('Hammam Chott', 'BEN_CHO'), ('Hammam Lif', 'BEN_LIF'),
  ('Megrine', 'BEN_MEG'), ('Mohamedia', 'BEN_MOH'), ('Mornag', 'BEN_MOR'),
  ('Nouvelle Medina', 'BEN_NOU'), ('Rades', 'BEN_RAD'), ('Fouchana', 'BEN_FOU')
) AS d(nom, code) WHERE g.code = 'BEN'
UNION ALL
SELECT g.id, d.nom, d.code FROM public.gouvernorats g
CROSS JOIN LATERAL (VALUES
  -- Bizerte
  ('Bizerte Nord', 'BIZ_NOR'), ('Bizerte Sud', 'BIZ_SUD'), ('Djoumine', 'BIZ_DJO'),
  ('El Alia', 'BIZ_ALA'), ('Ghar El Melh', 'BIZ_GHA'), ('Ghezala', 'BIZ_GHE'),
  ('Joumine', 'BIZ_JOU'), ('Mateur', 'BIZ_MAT'), ('Menzel Bourguiba', 'BIZ_MBO'),
  ('Menzel Jemil', 'BIZ_MJE'), ('Ras Jebel', 'BIZ_RAS'), ('Sejnane', 'BIZ_SEJ'),
  ('Tinja', 'BIZ_TIN'), ('Utique', 'BIZ_UTI'), ('Zarzouna', 'BIZ_ZAR')
) AS d(nom, code) WHERE g.code = 'BIZ'
UNION ALL
SELECT g.id, d.nom, d.code FROM public.gouvernorats g
CROSS JOIN LATERAL (VALUES
  -- Gabès
  ('Gabès Médina', 'GAB_MED'), ('Gabès Ouest', 'GAB_OUE'), ('Gabès Sud', 'GAB_SUD'),
  ('El Hamma', 'GAB_HAM'), ('Mareth', 'GAB_MAR'), ('Matmata', 'GAB_MAT'),
  ('Menzel El Habib', 'GAB_MEN'), ('Métouia', 'GAB_MET'), ('Nouvelle Matmata', 'GAB_NOU'),
  ('Oudhref', 'GAB_OUD')
) AS d(nom, code) WHERE g.code = 'GAB'
UNION ALL
SELECT g.id, d.nom, d.code FROM public.gouvernorats g
CROSS JOIN LATERAL (VALUES
  -- Gafsa
  ('Gafsa Nord', 'GAF_NOR'), ('Gafsa Sud', 'GAF_SUD'), ('Belkhir', 'GAF_BEL'),
  ('El Guettar', 'GAF_GUE'), ('El Ksar', 'GAF_KSA'), ('Mdhila', 'GAF_MDH'),
  ('Métlaoui', 'GAF_MET'), ('Moularès', 'GAF_MOU'), ('Redeyef', 'GAF_RED'),
  ('Sened', 'GAF_SEN'), ('Sidi Aïch', 'GAF_SID')
) AS d(nom, code) WHERE g.code = 'GAF'
UNION ALL
SELECT g.id, d.nom, d.code FROM public.gouvernorats g
CROSS JOIN LATERAL (VALUES
  -- Jendouba
  ('Jendouba', 'JEN_JEN'), ('Jendouba Nord', 'JEN_NOR'), ('Bou Salem', 'JEN_BOU'),
  ('Fernana', 'JEN_FER'), ('Ghardimaou', 'JEN_GHA'), ('Oued Mliz', 'JEN_OUE'),
  ('Tabarka', 'JEN_TAB'), ('Aïn Draham', 'JEN_AIN'), ('Balta-Bou Aouane', 'JEN_BAL')
) AS d(nom, code) WHERE g.code = 'JEN'
UNION ALL
SELECT g.id, d.nom, d.code FROM public.gouvernorats g
CROSS JOIN LATERAL (VALUES
  -- Kairouan
  ('Kairouan Nord', 'KAI_NOR'), ('Kairouan Sud', 'KAI_SUD'), ('Sbikha', 'KAI_SBI'),
  ('Oueslatia', 'KAI_OUE'), ('Haffouz', 'KAI_HAF'), ('El Alâa', 'KAI_ALA'),
  ('Hajeb El Ayoun', 'KAI_HAJ'), ('Nasrallah', 'KAI_NAS'), ('Echrarda', 'KAI_ECH'),
  ('Bouhajla', 'KAI_BOU'), ('Chebika', 'KAI_CHE')
) AS d(nom, code) WHERE g.code = 'KAI'
UNION ALL
SELECT g.id, d.nom, d.code FROM public.gouvernorats g
CROSS JOIN LATERAL (VALUES
  -- Kasserine
  ('Kasserine Nord', 'KAS_NOR'), ('Kasserine Sud', 'KAS_SUD'), ('Sbeitla', 'KAS_SBE'),
  ('Sbiba', 'KAS_SBI'), ('Djedeliane', 'KAS_DJE'), ('El Ayoun', 'KAS_AYO'),
  ('Thala', 'KAS_THA'), ('Hidra', 'KAS_HID'), ('Foussana', 'KAS_FOU'),
  ('Feriana', 'KAS_FER'), ('Mejel Bel Abbès', 'KAS_MEJ'), ('Hassi El Frid', 'KAS_HAS')
) AS d(nom, code) WHERE g.code = 'KAS'
UNION ALL
SELECT g.id, d.nom, d.code FROM public.gouvernorats g
CROSS JOIN LATERAL (VALUES
  -- Kébili
  ('Kébili Nord', 'KEB_NOR'), ('Kébili Sud', 'KEB_SUD'), ('Douz Nord', 'KEB_DNO'),
  ('Douz Sud', 'KEB_DSU'), ('Faouar', 'KEB_FAO'), ('Souk Lahad', 'KEB_SOU')
) AS d(nom, code) WHERE g.code = 'KEB'
UNION ALL
SELECT g.id, d.nom, d.code FROM public.gouvernorats g
CROSS JOIN LATERAL (VALUES
  -- Le Kef
  ('Le Kef Est', 'KEF_EST'), ('Le Kef Ouest', 'KEF_OUE'), ('Nebeur', 'KEF_NEB'),
  ('Sakiet Sidi Youssef', 'KEF_SAK'), ('Tajerouine', 'KEF_TAJ'), ('Kalaat Senan', 'KEF_KAS'),
  ('Kalâat Khasba', 'KEF_KAK'), ('Jérissa', 'KEF_JER'), ('El Ksour', 'KEF_KSO'),
  ('Dahmani', 'KEF_DAH'), ('Sers', 'KEF_SER')
) AS d(nom, code) WHERE g.code = 'KEF'
UNION ALL
SELECT g.id, d.nom, d.code FROM public.gouvernorats g
CROSS JOIN LATERAL (VALUES
  -- Mahdia
  ('Mahdia', 'MAH_MAH'), ('Boumerdes', 'MAH_BOU'), ('Ouled Chamekh', 'MAH_OUL'),
  ('Chorbane', 'MAH_CHO'), ('Hebira', 'MAH_HEB'), ('Essouassi', 'MAH_ESS'),
  ('El Jem', 'MAH_JEM'), ('Chebba', 'MAH_CHE'), ('Melloulèche', 'MAH_MEL'),
  ('Sidi Alouane', 'MAH_SID'), ('Ksour Essef', 'MAH_KSO')
) AS d(nom, code) WHERE g.code = 'MAH'
UNION ALL
SELECT g.id, d.nom, d.code FROM public.gouvernorats g
CROSS JOIN LATERAL (VALUES
  -- Manouba
  ('Manouba', 'MAN_MAN'), ('Den Den', 'MAN_DEN'), ('Douar Hicher', 'MAN_DOU'),
  ('Oued Ellil', 'MAN_OUE'), ('Mornaguia', 'MAN_MOR'), ('Borj El Amri', 'MAN_BOR'),
  ('Djedeida', 'MAN_DJE'), ('Tebourba', 'MAN_TEB'), ('El Battan', 'MAN_BAT')
) AS d(nom, code) WHERE g.code = 'MAN'
UNION ALL
SELECT g.id, d.nom, d.code FROM public.gouvernorats g
CROSS JOIN LATERAL (VALUES
  -- Médenine
  ('Médenine Nord', 'MED_NOR'), ('Médenine Sud', 'MED_SUD'), ('Beni Khedache', 'MED_BEN'),
  ('Ben Gardane', 'MED_GAR'), ('Djerba - Ajim', 'MED_AJI'), ('Djerba - Houmt Souk', 'MED_HOU'),
  ('Djerba - Midoun', 'MED_MID'), ('Sidi Makhlouf', 'MED_SID'), ('Zarzis', 'MED_ZAR')
) AS d(nom, code) WHERE g.code = 'MED'
UNION ALL
SELECT g.id, d.nom, d.code FROM public.gouvernorats g
CROSS JOIN LATERAL (VALUES
  -- Monastir
  ('Monastir', 'MON_MON'), ('Ksar Hellal', 'MON_KSA'), ('Moknine', 'MON_MOK'),
  ('Jemmal', 'MON_JEM'), ('Bembla', 'MON_BEM'), ('Beni Hassen', 'MON_BEN'),
  ('Ouerdanine', 'MON_OUE'), ('Sahline', 'MON_SAH'), ('Zéramdine', 'MON_ZER'),
  ('Sayada-Lamta-Bou Hajar', 'MON_SAY'), ('Bekalta', 'MON_BEK'), ('Téboulba', 'MON_TEB')
) AS d(nom, code) WHERE g.code = 'MON'
UNION ALL
SELECT g.id, d.nom, d.code FROM public.gouvernorats g
CROSS JOIN LATERAL (VALUES
  -- Nabeul
  ('Nabeul', 'NAB_NAB'), ('Dar Chaabane El Fehri', 'NAB_DAR'), ('Béni Khiar', 'NAB_BKH'),
  ('El Haouaria', 'NAB_HAO'), ('Takelsa', 'NAB_TAK'), ('Soliman', 'NAB_SOL'),
  ('Menzel Temime', 'NAB_MTE'), ('Menzel Bouzelfa', 'NAB_MBO'), ('Béni Khalled', 'NAB_BKA'),
  ('Korba', 'NAB_KOR'), ('Grombalia', 'NAB_GRO'), ('Hammam Ghezèze', 'NAB_HAM'),
  ('Hammamet', 'NAB_HMT'), ('Kelibia', 'NAB_KEL'), ('Mida', 'NAB_MID'), ('El Maamoura', 'NAB_MAA')
) AS d(nom, code) WHERE g.code = 'NAB'
UNION ALL
SELECT g.id, d.nom, d.code FROM public.gouvernorats g
CROSS JOIN LATERAL (VALUES
  -- Sfax
  ('Sfax Ville', 'SFX_VIL'), ('Sfax Ouest', 'SFX_OUE'), ('Sakiet Ezzit', 'SFX_EZZ'),
  ('Sakiet Eddaïer', 'SFX_DAI'), ('Agareb', 'SFX_AGA'), ('Jebiniana', 'SFX_JEB'),
  ('El Amra', 'SFX_AMR'), ('El Hencha', 'SFX_HEN'), ('Menzel Chaker', 'SFX_MCH'),
  ('Ghraïba', 'SFX_GHR'), ('Bir Ali Ben Khalifa', 'SFX_BIR'), ('Skhira', 'SFX_SKH'),
  ('Mahres', 'SFX_MAH'), ('Kerkennah', 'SFX_KER')
) AS d(nom, code) WHERE g.code = 'SFX'
UNION ALL
SELECT g.id, d.nom, d.code FROM public.gouvernorats g
CROSS JOIN LATERAL (VALUES
  -- Sidi Bouzid
  ('Sidi Bouzid Ouest', 'SID_OUE'), ('Sidi Bouzid Est', 'SID_EST'), ('Jilma', 'SID_JIL'),
  ('Cebalet Ouled Asker', 'SID_CEB'), ('Bir El Hafey', 'SID_BIR'), ('Sidi Ali Ben Aoun', 'SID_ALI'),
  ('Menzel Bouzaiane', 'SID_MEN'), ('Meknassy', 'SID_MEK'), ('Souk Jedid', 'SID_SOU'),
  ('Mezzouna', 'SID_MEZ'), ('Regueb', 'SID_REG'), ('Ouled Haffouz', 'SID_OUL')
) AS d(nom, code) WHERE g.code = 'SID'
UNION ALL
SELECT g.id, d.nom, d.code FROM public.gouvernorats g
CROSS JOIN LATERAL (VALUES
  -- Siliana
  ('Siliana Nord', 'SIL_NOR'), ('Siliana Sud', 'SIL_SUD'), ('Bou Arada', 'SIL_BOU'),
  ('Gaâfour', 'SIL_GAA'), ('El Krib', 'SIL_KRI'), ('El Aroussa', 'SIL_ARO'),
  ('Rouhia', 'SIL_ROU'), ('Kesra', 'SIL_KES'), ('Bargou', 'SIL_BAR'),
  ('Maktar', 'SIL_MAK'), ('Sidi Bou Rouis', 'SIL_SID')
) AS d(nom, code) WHERE g.code = 'SIL'
UNION ALL
SELECT g.id, d.nom, d.code FROM public.gouvernorats g
CROSS JOIN LATERAL (VALUES
  -- Sousse
  ('Sousse Ville', 'SOU_VIL'), ('Sousse Riadh', 'SOU_RIA'), ('Sousse Jawhara', 'SOU_JAW'),
  ('Sousse Sidi Abdelhamid', 'SOU_SID'), ('Hammam Sousse', 'SOU_HAM'), ('Akouda', 'SOU_AKO'),
  ('Kalâa Kebira', 'SOU_KKE'), ('Sidi Bou Ali', 'SOU_BOA'), ('Hergla', 'SOU_HER'),
  ('Enfidha', 'SOU_ENF'), ('Bouficha', 'SOU_BOU'), ('Kondar', 'SOU_KON'),
  ('Sidi El Hani', 'SOU_HAN'), ('M''saken', 'SOU_MSA'), ('Kalâa Seghira', 'SOU_KSE')
) AS d(nom, code) WHERE g.code = 'SOU'
UNION ALL
SELECT g.id, d.nom, d.code FROM public.gouvernorats g
CROSS JOIN LATERAL (VALUES
  -- Tataouine
  ('Tataouine Nord', 'TAT_NOR'), ('Tataouine Sud', 'TAT_SUD'), ('Bir Lahmar', 'TAT_BIR'),
  ('Ghomrassen', 'TAT_GHO'), ('Dehiba', 'TAT_DEH'), ('Remada', 'TAT_REM'), ('Smar', 'TAT_SMA')
) AS d(nom, code) WHERE g.code = 'TAT'
UNION ALL
SELECT g.id, d.nom, d.code FROM public.gouvernorats g
CROSS JOIN LATERAL (VALUES
  -- Tozeur
  ('Tozeur', 'TOZ_TOZ'), ('Degache', 'TOZ_DEG'), ('Tameghza', 'TOZ_TAM'),
  ('Nefta', 'TOZ_NEF'), ('Hazoua', 'TOZ_HAZ')
) AS d(nom, code) WHERE g.code = 'TOZ'
UNION ALL
SELECT g.id, d.nom, d.code FROM public.gouvernorats g
CROSS JOIN LATERAL (VALUES
  -- Tunis
  ('Bab El Bhar', 'TUN_BAB'), ('Bab Souika', 'TUN_SOU'), ('Cité El Khadra', 'TUN_KHA'),
  ('Djebel Jelloud', 'TUN_DJE'), ('El Kabaria', 'TUN_KAB'), ('El Menzah', 'TUN_MEN'),
  ('El Omrane', 'TUN_OMR'), ('El Omrane supérieur', 'TUN_OMS'), ('El Ouardia', 'TUN_OUA'),
  ('Ettahrir', 'TUN_TAH'), ('Ezzouhour', 'TUN_ZOU'), ('Hraïria', 'TUN_HRA'),
  ('La Goulette', 'TUN_GOU'), ('La Marsa', 'TUN_MAR'), ('Le Bardo', 'TUN_BAR'),
  ('Le Kram', 'TUN_KRA'), ('Médina', 'TUN_MED'), ('Séjoumi', 'TUN_SEJ'),
  ('Sidi El Béchir', 'TUN_BEC'), ('Sidi Hassine', 'TUN_HAS')
) AS d(nom, code) WHERE g.code = 'TUN'
UNION ALL
SELECT g.id, d.nom, d.code FROM public.gouvernorats g
CROSS JOIN LATERAL (VALUES
  -- Zaghouan
  ('Zaghouan', 'ZAG_ZAG'), ('Zriba', 'ZAG_ZRI'), ('Birmcherga', 'ZAG_BIR'),
  ('Djebel Oust', 'ZAG_DJE'), ('El Fahs', 'ZAG_FAH'), ('Nadhour', 'ZAG_NAD')
) AS d(nom, code) WHERE g.code = 'ZAG';