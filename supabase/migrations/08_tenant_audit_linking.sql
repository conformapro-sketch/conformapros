-- Migration: batch 7 - tenant, audit, and linking tables
CREATE TABLE public.tenants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    default_currency text,
    metadata jsonb,
    slug text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    action text NOT NULL,
    actor_id uuid,
    client_id uuid REFERENCES public.clients(id),
    site_id uuid REFERENCES public.sites(id),
    tenant_id uuid REFERENCES public.tenants(id),
    entity text NOT NULL,
    entity_id uuid,
    details jsonb,
    ts timestamptz DEFAULT now()
);

CREATE TABLE public.invoice_links (
    parent_invoice_id uuid NOT NULL REFERENCES public.invoices(id),
    child_invoice_id uuid NOT NULL REFERENCES public.invoices(id),
    PRIMARY KEY (parent_invoice_id, child_invoice_id)
);

CREATE TABLE public.site_modules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id uuid NOT NULL REFERENCES public.sites(id),
    module_id uuid NOT NULL REFERENCES public.modules_systeme(id),
    enabled boolean,
    enabled_at timestamptz,
    enabled_by uuid
);

CREATE TABLE public.site_veille_domaines (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id uuid NOT NULL REFERENCES public.sites(id),
    domaine_id uuid NOT NULL REFERENCES public.domaines_application(id),
    enabled boolean
);
