-- Migration: batch 3 - invoicing, subscription, and equipment tables
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
    updated_at timestamptz DEFAULT now()
);

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
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.invoice_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id uuid NOT NULL REFERENCES public.invoices(id),
    designation text NOT NULL,
    description text,
    quantity integer,
    unit_price numeric,
    tax_rate numeric,
    total_ht numeric
);

CREATE TABLE public.equipements_controle (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code_identification text NOT NULL,
    site_id uuid NOT NULL REFERENCES public.sites(id),
    type_equipement_id uuid NOT NULL,
    created_at timestamptz DEFAULT now(),
    created_by uuid,
    batiment text,
    date_dernier_controle date,
    date_mise_en_service date,
    etage text,
    localisation text,
    marque text,
    modele text,
    numero_serie text,
    observations text,
    organisme_controle_id uuid,
    periodicite_mois integer,
    prochaine_echeance date,
    responsable_hse_id uuid,
    resultat_dernier_controle text,
    statut_conformite text,
    statut_operationnel text,
    updated_at timestamptz DEFAULT now()
);
