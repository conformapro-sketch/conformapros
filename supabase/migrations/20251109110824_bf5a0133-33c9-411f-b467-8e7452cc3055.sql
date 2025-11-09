-- Insert delegations for remaining governorates

-- Béja
INSERT INTO public.delegations (gouvernorat_id, nom)
SELECT id, delegation FROM public.gouvernorats, (VALUES
  ('Amdoun'),
  ('Béja Nord'),
  ('Béja Sud'),
  ('Goubellat'),
  ('Medjez el-Bab'),
  ('Nefza'),
  ('Testour'),
  ('Teboursouk'),
  ('Thibar')
) AS delegations(delegation)
WHERE gouvernorats.code = 'BA'
ON CONFLICT (gouvernorat_id, nom) DO NOTHING;

-- Jendouba
INSERT INTO public.delegations (gouvernorat_id, nom)
SELECT id, delegation FROM public.gouvernorats, (VALUES
  ('Aïn Draham'),
  ('Balta-Bou Aouane'),
  ('Bou Salem'),
  ('Fernana'),
  ('Ghardimaou'),
  ('Jendouba'),
  ('Jendouba Nord'),
  ('Oued Meliz'),
  ('Tabarka')
) AS delegations(delegation)
WHERE gouvernorats.code = 'JE'
ON CONFLICT (gouvernorat_id, nom) DO NOTHING;

-- Le Kef
INSERT INTO public.delegations (gouvernorat_id, nom)
SELECT id, delegation FROM public.gouvernorats, (VALUES
  ('Dahmani'),
  ('El Ksour'),
  ('Jerissa'),
  ('Kalaat Khasba'),
  ('Kalâat Senan'),
  ('Kef Est'),
  ('Kef Ouest'),
  ('Nebeur'),
  ('Sakiet Sidi Youssef'),
  ('Sers'),
  ('Tajerouine')
) AS delegations(delegation)
WHERE gouvernorats.code = 'KF'
ON CONFLICT (gouvernorat_id, nom) DO NOTHING;

-- Siliana
INSERT INTO public.delegations (gouvernorat_id, nom)
SELECT id, delegation FROM public.gouvernorats, (VALUES
  ('Bargou'),
  ('Bou Arada'),
  ('El Aroussa'),
  ('El Krib'),
  ('Gaâfour'),
  ('Kesra'),
  ('Makthar'),
  ('Rouhia'),
  ('Sidi Bou Rouis'),
  ('Siliana Nord'),
  ('Siliana Sud')
) AS delegations(delegation)
WHERE gouvernorats.code = 'SI'
ON CONFLICT (gouvernorat_id, nom) DO NOTHING;

-- Monastir
INSERT INTO public.delegations (gouvernorat_id, nom)
SELECT id, delegation FROM public.gouvernorats, (VALUES
  ('Amiret El Fhoul'),
  ('Amiret El Hojjaj'),
  ('Amiret Touazra'),
  ('Bekalta'),
  ('Bembla'),
  ('Beni Hassen'),
  ('Jemmal'),
  ('Ksar Hellal'),
  ('Ksibet el-Médiouni'),
  ('Lemta'),
  ('Moknine'),
  ('Monastir'),
  ('Ouerdanine'),
  ('Sahline'),
  ('Sayada-Lamta-Bou Hajar'),
  ('Téboulba'),
  ('Zéramdine')
) AS delegations(delegation)
WHERE gouvernorats.code = 'MO'
ON CONFLICT (gouvernorat_id, nom) DO NOTHING;

-- Mahdia
INSERT INTO public.delegations (gouvernorat_id, nom)
SELECT id, delegation FROM public.gouvernorats, (VALUES
  ('Bou Merdes'),
  ('Chebba'),
  ('Chorbane'),
  ('El Jem'),
  ('Essouassi'),
  ('Hebira'),
  ('Ksour Essef'),
  ('Mahdia'),
  ('Melloulèche'),
  ('Ouled Chamekh'),
  ('Sidi Alouane')
) AS delegations(delegation)
WHERE gouvernorats.code = 'MH'
ON CONFLICT (gouvernorat_id, nom) DO NOTHING;

-- Kairouan
INSERT INTO public.delegations (gouvernorat_id, nom)
SELECT id, delegation FROM public.gouvernorats, (VALUES
  ('Aïn Jloula'),
  ('Alaâ'),
  ('Bou Hajla'),
  ('Chebika'),
  ('Echrarda'),
  ('El Oueslatia'),
  ('Haffouz'),
  ('Hajeb El Ayoun'),
  ('Kairouan Nord'),
  ('Kairouan Sud'),
  ('Nasrallah'),
  ('Sbikha')
) AS delegations(delegation)
WHERE gouvernorats.code = 'KA'
ON CONFLICT (gouvernorat_id, nom) DO NOTHING;

-- Kasserine
INSERT INTO public.delegations (gouvernorat_id, nom)
SELECT id, delegation FROM public.gouvernorats, (VALUES
  ('El Ayoun'),
  ('Ezzouhour'),
  ('Feriana'),
  ('Foussana'),
  ('Hassi El Ferid'),
  ('Hidra'),
  ('Jedeliane'),
  ('Kasserine Nord'),
  ('Kasserine Sud'),
  ('Majel Bel Abbès'),
  ('Sbeitla'),
  ('Sbiba'),
  ('Thala')
) AS delegations(delegation)
WHERE gouvernorats.code = 'KS'
ON CONFLICT (gouvernorat_id, nom) DO NOTHING;

-- Sidi Bouzid
INSERT INTO public.delegations (gouvernorat_id, nom)
SELECT id, delegation FROM public.gouvernorats, (VALUES
  ('Bir El Hafey'),
  ('Cebbala Ouled Asker'),
  ('Jilma'),
  ('Meknassy'),
  ('Menzel Bouzaiane'),
  ('Mezzouna'),
  ('Ouled Haffouz'),
  ('Regueb'),
  ('Sidi Ali Ben Aoun'),
  ('Sidi Bouzid Est'),
  ('Sidi Bouzid Ouest'),
  ('Souk Jedid')
) AS delegations(delegation)
WHERE gouvernorats.code = 'SB'
ON CONFLICT (gouvernorat_id, nom) DO NOTHING;

-- Gabès
INSERT INTO public.delegations (gouvernorat_id, nom)
SELECT id, delegation FROM public.gouvernorats, (VALUES
  ('El Hamma'),
  ('Gabès Médina'),
  ('Gabès Ouest'),
  ('Gabès Sud'),
  ('Ghannouche'),
  ('Mareth'),
  ('Matmata'),
  ('Menzel El Habib'),
  ('Métouia'),
  ('Nouvelle Matmata')
) AS delegations(delegation)
WHERE gouvernorats.code = 'GA'
ON CONFLICT (gouvernorat_id, nom) DO NOTHING;

-- Medenine
INSERT INTO public.delegations (gouvernorat_id, nom)
SELECT id, delegation FROM public.gouvernorats, (VALUES
  ('Ben Gardane'),
  ('Beni Khedache'),
  ('Djerba - Ajim'),
  ('Djerba - Houmt Souk'),
  ('Djerba - Midoun'),
  ('Médenine Nord'),
  ('Médenine Sud'),
  ('Sidi Makhlouf'),
  ('Zarzis')
) AS delegations(delegation)
WHERE gouvernorats.code = 'ME'
ON CONFLICT (gouvernorat_id, nom) DO NOTHING;

-- Tataouine
INSERT INTO public.delegations (gouvernorat_id, nom)
SELECT id, delegation FROM public.gouvernorats, (VALUES
  ('Bir Lahmar'),
  ('Dehiba'),
  ('Ghomrassen'),
  ('Remada'),
  ('Smar'),
  ('Tataouine Nord'),
  ('Tataouine Sud')
) AS delegations(delegation)
WHERE gouvernorats.code = 'TA'
ON CONFLICT (gouvernorat_id, nom) DO NOTHING;

-- Gafsa
INSERT INTO public.delegations (gouvernorat_id, nom)
SELECT id, delegation FROM public.gouvernorats, (VALUES
  ('Belkhir'),
  ('El Guetar'),
  ('El Ksar'),
  ('Gafsa Nord'),
  ('Gafsa Sud'),
  ('Mdhilla'),
  ('Metlaoui'),
  ('Moularès'),
  ('Redeyef'),
  ('Sened'),
  ('Sidi Aïch')
) AS delegations(delegation)
WHERE gouvernorats.code = 'GF'
ON CONFLICT (gouvernorat_id, nom) DO NOTHING;

-- Tozeur
INSERT INTO public.delegations (gouvernorat_id, nom)
SELECT id, delegation FROM public.gouvernorats, (VALUES
  ('Degache'),
  ('Hazoua'),
  ('Nefta'),
  ('Tameghza'),
  ('Tozeur')
) AS delegations(delegation)
WHERE gouvernorats.code = 'TO'
ON CONFLICT (gouvernorat_id, nom) DO NOTHING;

-- Kébili
INSERT INTO public.delegations (gouvernorat_id, nom)
SELECT id, delegation FROM public.gouvernorats, (VALUES
  ('Douz Nord'),
  ('Douz Sud'),
  ('Faouar'),
  ('Kébili Nord'),
  ('Kébili Sud'),
  ('Souk Lahad')
) AS delegations(delegation)
WHERE gouvernorats.code = 'KB'
ON CONFLICT (gouvernorat_id, nom) DO NOTHING;