-- Supabase migration: full schema based on src/integrations/supabase/types.ts
-- This file contains SQL to create all main tables, relationships, and enums for your app.

-- Example: Create 'clients' table
CREATE TABLE public.clients (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    nom_legal text,
    is_active boolean NOT NULL DEFAULT true,
    tenant_id uuid NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    -- ...other columns as per types.ts
);

-- Example: Create 'sites' table
CREATE TABLE public.sites (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL REFERENCES public.clients(id),
    name text NOT NULL,
    nom_site text,
    is_active boolean NOT NULL DEFAULT true,
    tenant_id uuid NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    -- ...other columns as per types.ts
);

-- Example: Create 'profiles' table
CREATE TABLE public.profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nom text,
    prenom text,
    email text,
    client_id uuid REFERENCES public.clients(id),
    site_id uuid REFERENCES public.sites(id),
    tenant_id uuid NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    -- ...other columns as per types.ts
);

-- Example: Create 'subscriptions' table
CREATE TABLE public.subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL REFERENCES public.clients(id),
    site_id uuid REFERENCES public.sites(id),
    plan_id uuid NOT NULL,
    start_date date NOT NULL,
    end_date date,
    status text NOT NULL,
    tenant_id uuid NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    -- ...other columns as per types.ts
);

-- Example: Create 'invoices' table
CREATE TABLE public.invoices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL REFERENCES public.clients(id),
    site_id uuid REFERENCES public.sites(id),
    subscription_id uuid REFERENCES public.subscriptions(id),
    invoice_no text NOT NULL,
    invoice_date date NOT NULL,
    status text NOT NULL,
    total_ht numeric,
    total_ttc numeric,
    total_tva numeric,
    tenant_id uuid NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    -- ...other columns as per types.ts
);

-- Example: Create 'articles' table
CREATE TABLE public.articles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    acte_id uuid NOT NULL,
    numero text NOT NULL,
    titre_court text,
    contenu_fr text,
    contenu_ar text,
    exigences text[],
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    -- ...other columns as per types.ts
);

-- Example: Create 'actes_reglementaires' table
CREATE TABLE public.actes_reglementaires (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    titre text NOT NULL,
    reference text NOT NULL,
    statut_vigueur text NOT NULL,
    type_acte text NOT NULL,
    domaine text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    -- ...other columns as per types.ts
);

-- Add more tables and relationships as needed, following the structure in types.ts
-- Add enums, foreign keys, and constraints for full schema coverage

-- NOTE: This is a template. You must expand each CREATE TABLE statement to include all columns and constraints from your TypeScript schema.
-- You can copy this file to supabase/migrations/ and run it using Supabase CLI or paste sections into the Supabase SQL editor online.
