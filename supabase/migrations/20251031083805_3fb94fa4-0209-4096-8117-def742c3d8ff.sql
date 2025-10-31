-- Create function to get user's tenant_id from profiles
CREATE OR REPLACE FUNCTION public.get_user_tenant_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.profiles WHERE id = _user_id;
$$;

-- Insert sample tenants
INSERT INTO public.tenants (id, nom) VALUES
  ('00000000-0000-0000-0000-000000000001', 'ConformaPro Internal'),
  ('00000000-0000-0000-0000-000000000002', 'Demo Organization')
ON CONFLICT (id) DO NOTHING;

-- Create a default tenant for existing users if needed (Super Admin tenant)
DO $$
BEGIN
  -- Update profiles to link to default tenant if they don't have one
  UPDATE public.profiles
  SET tenant_id = '00000000-0000-0000-0000-000000000001'
  WHERE tenant_id IS NULL;
END $$;

-- Insert sample clients with full data
INSERT INTO public.clients (
  id, tenant_id, nom, nom_legal, secteur, matricule_fiscale, rne_rc,
  telephone, email, site_web, adresse_siege, gouvernorat, delegation,
  code_postal, billing_mode, currency, is_active, statut
) VALUES
  (
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'TechCorp Tunisie',
    'TechCorp Tunisie SARL',
    'Industriel',
    '1234567ABC123',
    'B12345678',
    '+216 71 123 456',
    'contact@techcorp.tn',
    'https://www.techcorp.tn',
    '15 Avenue de la République, Les Berges du Lac',
    'Tunis',
    'Le Bardo',
    '2000',
    'client',
    'TND',
    true,
    'actif'
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'Services Plus',
    'Services Plus SA',
    'Services',
    '9876543DEF456',
    'C98765432',
    '+216 71 987 654',
    'info@servicesplus.tn',
    'https://www.servicesplus.tn',
    '42 Rue de Marseille',
    'Tunis',
    'La Marsa',
    '2078',
    'site',
    'TND',
    true,
    'actif'
  ),
  (
    '10000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'Commerce Export',
    'Commerce Export International SARL',
    'Commerce',
    '5555666GHI789',
    'D55556666',
    '+216 71 555 777',
    'export@commerce.tn',
    'https://www.commerce-export.tn',
    '88 Avenue Habib Bourguiba',
    'Sfax',
    'Sfax Ville',
    '3000',
    'hybrid',
    'EUR',
    true,
    'actif'
  ),
  (
    '10000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000001',
    'Industrie Moderne',
    'Industrie Moderne SA',
    'Industriel',
    '7777888JKL012',
    'E77778888',
    '+216 73 444 555',
    'contact@industrie.tn',
    NULL,
    'Zone Industrielle Sahline',
    'Sousse',
    'Sahline',
    '4011',
    'client',
    'TND',
    true,
    'actif'
  ),
  (
    '10000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000001',
    'Admin Services',
    'Administration Services Publics',
    'Administration',
    NULL,
    NULL,
    '+216 71 333 222',
    'admin@services.gov.tn',
    NULL,
    'Avenue Mohamed V',
    'Tunis',
    'Tunis Ville',
    '1001',
    'client',
    'TND',
    true,
    'actif'
  )
ON CONFLICT (id) DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  secteur = EXCLUDED.secteur,
  matricule_fiscale = EXCLUDED.matricule_fiscale,
  rne_rc = EXCLUDED.rne_rc,
  gouvernorat = EXCLUDED.gouvernorat,
  delegation = EXCLUDED.delegation,
  adresse_siege = EXCLUDED.adresse_siege,
  site_web = EXCLUDED.site_web,
  billing_mode = EXCLUDED.billing_mode,
  currency = EXCLUDED.currency,
  is_active = EXCLUDED.is_active;