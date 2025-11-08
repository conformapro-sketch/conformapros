-- Insert sample clients with realistic Tunisian data
INSERT INTO public.clients (id, nom, nom_legal, siret, adresse, ville, code_postal, pays, telephone, email, created_at, updated_at)
VALUES 
  (
    '11111111-1111-1111-1111-111111111111',
    'TechCorp Tunisia',
    'TechCorp Tunisia SARL',
    '1234567A',
    'Avenue Habib Bourguiba, Immeuble El Mechtel',
    'Tunis',
    '1000',
    'Tunisie',
    '+216 71 123 456',
    'contact@techcorp.tn',
    now(),
    now()
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'IndustriePro',
    'IndustriePro SA',
    '7654321B',
    'Zone Industrielle Sfax Sud',
    'Sfax',
    '3000',
    'Tunisie',
    '+216 74 987 654',
    'info@industriepro.tn',
    now(),
    now()
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'Services Plus',
    'Services Plus SUARL',
    '9876543C',
    'Centre Urbain Nord',
    'Tunis',
    '1082',
    'Tunisie',
    '+216 71 555 777',
    'admin@servicesplus.tn',
    now(),
    now()
  );

-- Insert sample sites for each client
INSERT INTO public.sites (id, client_id, nom, nom_site, code_site, adresse, ville, code_postal, pays, nombre_employes, telephone, email, created_at, updated_at)
VALUES 
  -- TechCorp Tunisia sites
  (
    'a1111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'Siège Social Tunis',
    'Siège Social Tunis',
    'TCT-001',
    'Avenue Habib Bourguiba, Immeuble El Mechtel',
    'Tunis',
    '1000',
    'Tunisie',
    45,
    '+216 71 123 456',
    'siege@techcorp.tn',
    now(),
    now()
  ),
  (
    'a2222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'Centre R&D Sousse',
    'Centre R&D Sousse',
    'TCT-002',
    'Technopole de Sousse',
    'Sousse',
    '4000',
    'Tunisie',
    28,
    '+216 73 888 999',
    'sousse@techcorp.tn',
    now(),
    now()
  ),
  -- IndustriePro sites
  (
    'b1111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    'Usine Sfax',
    'Usine Sfax',
    'IND-001',
    'Zone Industrielle Sfax Sud',
    'Sfax',
    '3000',
    'Tunisie',
    120,
    '+216 74 987 654',
    'usine@industriepro.tn',
    now(),
    now()
  ),
  (
    'b2222222-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-222222222222',
    'Entrepôt Bizerte',
    'Entrepôt Bizerte',
    'IND-002',
    'Zone Logistique Bizerte',
    'Bizerte',
    '7000',
    'Tunisie',
    35,
    '+216 72 444 555',
    'bizerte@industriepro.tn',
    now(),
    now()
  ),
  -- Services Plus sites
  (
    'c1111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333333333',
    'Bureau Principal CUN',
    'Bureau Principal CUN',
    'SP-001',
    'Centre Urbain Nord, Immeuble Ennour',
    'Tunis',
    '1082',
    'Tunisie',
    52,
    '+216 71 555 777',
    'principal@servicesplus.tn',
    now(),
    now()
  ),
  (
    'c2222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333',
    'Agence Nabeul',
    'Agence Nabeul',
    'SP-002',
    'Avenue Farhat Hached',
    'Nabeul',
    '8000',
    'Tunisie',
    18,
    '+216 72 222 333',
    'nabeul@servicesplus.tn',
    now(),
    now()
  );