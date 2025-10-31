-- Migration: batch 6 - supporting tables for regulatory, medical, and system modules
CREATE TABLE public.referentiels_secteurs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    actifs_concernes text[],
    exigences_types text[],
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.modules_systeme (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text NOT NULL,
    libelle text NOT NULL,
    actif boolean,
    description text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.organismes_controle (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nom text NOT NULL,
    actif boolean,
    adresse text,
    agrement_numero text,
    email text,
    specialites text[],
    telephone text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.plans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text NOT NULL,
    label text NOT NULL,
    base_price numeric,
    per_site_price numeric,
    periodicity text,
    features jsonb,
    is_active boolean,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id uuid NOT NULL REFERENCES public.invoices(id),
    amount numeric NOT NULL,
    method text NOT NULL,
    paid_at timestamptz NOT NULL,
    reference text,
    notes text,
    created_at timestamptz DEFAULT now()
);
