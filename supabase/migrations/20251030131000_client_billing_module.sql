-- Client Management & Billing module migration
-- Step 1: rebuild app_role enum to include new roles

DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);

CREATE TYPE public.app_role_new AS ENUM (
  'super_admin',
  'admin_global',
  'admin_client',
  'billing_manager',
  'account_manager',
  'viewer',
  'gestionnaire_hse',
  'chef_site',
  'lecteur',
  'med_practitioner',
  'med_admin'
);

ALTER TABLE public.user_roles
  ALTER COLUMN role TYPE public.app_role_new
  USING role::text::public.app_role_new;

DROP TYPE IF EXISTS public.app_role;
ALTER TYPE public.app_role_new RENAME TO app_role;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Helper: returns TRUE if user has any role in provided array
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid, _roles public.app_role[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = ANY(_roles)
  )
$$;

-- Step 2: enums for billing scopes

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'billing_mode') THEN
    CREATE TYPE public.billing_mode AS ENUM ('client', 'site', 'hybrid');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'plan_periodicity') THEN
    CREATE TYPE public.plan_periodicity AS ENUM ('monthly', 'quarterly', 'yearly');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_scope') THEN
    CREATE TYPE public.subscription_scope AS ENUM ('client', 'site');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN
    CREATE TYPE public.subscription_status AS ENUM ('active', 'paused', 'canceled');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_status') THEN
    CREATE TYPE public.invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue', 'canceled');
  END IF;
END$$;

-- Step 3: tenants and tenant references

CREATE TABLE IF NOT EXISTS public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,
  default_currency text NOT NULL DEFAULT 'TND',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tenants_touch_updated_at ON public.tenants;
CREATE TRIGGER tenants_touch_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();

-- Tenant helpers
CREATE OR REPLACE FUNCTION public.get_user_tenant_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id
  FROM public.profiles
  WHERE id = _user_id
$$;

CREATE OR REPLACE FUNCTION public.require_same_tenant(_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(_tenant_id, '00000000-0000-0000-0000-000000000000'::uuid) =
         COALESCE(public.get_user_tenant_id(auth.uid()), '00000000-0000-0000-0000-000000000000'::uuid)
    OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
$$;

-- Step 4: extend existing tables with tenant & billing metadata

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tenant_id uuid,
  ADD CONSTRAINT IF NOT EXISTS profiles_tenant_id_fkey
    FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE SET NULL;

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS tenant_id uuid,
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS matricule_fiscale text,
  ADD COLUMN IF NOT EXISTS billing_mode public.billing_mode DEFAULT 'client',
  ADD COLUMN IF NOT EXISTS payment_terms text,
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'TND',
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS billing_email text,
  ADD COLUMN IF NOT EXISTS billing_phone text,
  ADD COLUMN IF NOT EXISTS billing_notes text,
  ADD COLUMN IF NOT EXISTS billing_address text,
  ADD COLUMN IF NOT EXISTS primary_contact_id uuid;

ALTER TABLE public.sites
  ADD COLUMN IF NOT EXISTS tenant_id uuid,
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS matricule_fiscale text,
  ADD COLUMN IF NOT EXISTS is_billable boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Copy legacy data into new fields when empty
UPDATE public.clients
SET name = COALESCE(name, nom_legal),
    billing_address = COALESCE(billing_address, adresse_siege),
    currency = COALESCE(currency, 'TND')
WHERE name IS DISTINCT FROM nom_legal OR billing_address IS NULL OR currency IS NULL;

UPDATE public.clients
SET matricule_fiscale = COALESCE(matricule_fiscale, matricule_fiscal)
WHERE matricule_fiscal IS NOT NULL AND matricule_fiscale IS NULL;

UPDATE public.sites
SET name = COALESCE(name, nom_site)
WHERE name IS DISTINCT FROM nom_site OR name IS NULL;

-- Step 5: default tenant + propagate tenant ids

INSERT INTO public.tenants (id, name, slug)
VALUES ('00000000-0000-4000-8000-000000000001', 'ConformaPro Default', 'conformapro-default')
ON CONFLICT (id) DO NOTHING;

UPDATE public.clients
SET tenant_id = COALESCE(tenant_id, '00000000-0000-4000-8000-000000000001');

UPDATE public.profiles p
SET tenant_id = COALESCE(p.tenant_id,
  CASE
    WHEN p.client_id IS NOT NULL THEN c.tenant_id
    ELSE '00000000-0000-4000-8000-000000000001'
  END)
FROM public.clients c
WHERE p.client_id = c.id;

UPDATE public.profiles
SET tenant_id = COALESCE(tenant_id, '00000000-0000-4000-8000-000000000001')
WHERE tenant_id IS NULL;

UPDATE public.sites s
SET tenant_id = COALESCE(s.tenant_id, c.tenant_id)
FROM public.clients c
WHERE s.client_id = c.id;

UPDATE public.sites
SET tenant_id = COALESCE(tenant_id, '00000000-0000-4000-8000-000000000001')
WHERE tenant_id IS NULL;

-- Enforce NOT NULL where required
ALTER TABLE public.clients
  ALTER COLUMN tenant_id SET NOT NULL,
  ALTER COLUMN name SET NOT NULL,
  ALTER COLUMN billing_mode SET NOT NULL,
  ALTER COLUMN currency SET NOT NULL,
  ALTER COLUMN is_active SET NOT NULL;

ALTER TABLE public.sites
  ALTER COLUMN tenant_id SET NOT NULL,
  ALTER COLUMN name SET NOT NULL,
  ALTER COLUMN is_billable SET NOT NULL,
  ALTER COLUMN is_active SET NOT NULL;

ALTER TABLE public.profiles
  ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.clients
  ADD CONSTRAINT IF NOT EXISTS clients_tenant_id_fkey
    FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.sites
  ADD CONSTRAINT IF NOT EXISTS sites_tenant_id_fkey
    FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS clients_tenant_name_idx ON public.clients(tenant_id, name);
CREATE INDEX IF NOT EXISTS sites_tenant_name_idx ON public.sites(tenant_id, name);

-- Step 6: core billing tables

CREATE TABLE IF NOT EXISTS public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  site_id uuid REFERENCES public.sites(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text,
  phone text,
  role text,
  is_primary boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS contacts_touch_updated_at ON public.contacts;
CREATE TRIGGER contacts_touch_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.clients
  DROP CONSTRAINT IF EXISTS clients_primary_contact_id_fkey,
  ADD CONSTRAINT clients_primary_contact_id_fkey
    FOREIGN KEY (primary_contact_id) REFERENCES public.contacts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS contacts_tenant_idx ON public.contacts(tenant_id, client_id);

CREATE TABLE IF NOT EXISTS public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  label text NOT NULL,
  periodicity public.plan_periodicity NOT NULL,
  base_price numeric(12,2) NOT NULL DEFAULT 0,
  per_site_price numeric(12,2),
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS plans_touch_updated_at ON public.plans;
CREATE TRIGGER plans_touch_updated_at
  BEFORE UPDATE ON public.plans
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.plans(id) ON DELETE RESTRICT,
  scope public.subscription_scope NOT NULL,
  site_id uuid REFERENCES public.sites(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date,
  status public.subscription_status NOT NULL DEFAULT 'active',
  price_override numeric(12,2),
  currency text,
  notes text,
  next_billing_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (scope = 'client' OR site_id IS NOT NULL)
);

DROP TRIGGER IF EXISTS subscriptions_touch_updated_at ON public.subscriptions;
CREATE TRIGGER subscriptions_touch_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();

CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_unique_client_scope
  ON public.subscriptions(tenant_id, client_id, plan_id, scope)
  WHERE site_id IS NULL AND status = 'active';

CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_unique_site_scope
  ON public.subscriptions(tenant_id, client_id, plan_id, scope, site_id)
  WHERE site_id IS NOT NULL AND status = 'active';

CREATE TABLE IF NOT EXISTS public.invoice_sequences (
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  year integer NOT NULL,
  last_sequence integer NOT NULL DEFAULT 0,
  PRIMARY KEY (tenant_id, year)
);

CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  site_id uuid REFERENCES public.sites(id) ON DELETE SET NULL,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  invoice_no text NOT NULL,
  invoice_date date NOT NULL DEFAULT current_date,
  due_date date,
  currency text NOT NULL DEFAULT 'TND',
  status public.invoice_status NOT NULL DEFAULT 'draft',
  total_ht numeric(14,3) NOT NULL DEFAULT 0,
  total_tva numeric(14,3) NOT NULL DEFAULT 0,
  total_ttc numeric(14,3) NOT NULL DEFAULT 0,
  notes text,
  pdf_url text,
  tax_breakdown jsonb DEFAULT '[]'::jsonb,
  consolidated_parent_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, invoice_no)
);

DROP TRIGGER IF EXISTS invoices_touch_updated_at ON public.invoices;
CREATE TRIGGER invoices_touch_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX IF NOT EXISTS invoices_tenant_date_idx ON public.invoices(tenant_id, invoice_date);
CREATE INDEX IF NOT EXISTS invoices_client_idx ON public.invoices(client_id);
CREATE INDEX IF NOT EXISTS invoices_site_idx ON public.invoices(site_id);

CREATE TABLE IF NOT EXISTS public.invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  designation text NOT NULL,
  description text,
  quantity numeric(12,3) NOT NULL DEFAULT 1,
  unit_price numeric(12,3) NOT NULL DEFAULT 0,
  tax_rate numeric(5,2) NOT NULL DEFAULT 19,
  total_ht numeric(14,3) NOT NULL DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS invoice_items_invoice_idx ON public.invoice_items(invoice_id);

CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  method text NOT NULL,
  amount numeric(14,3) NOT NULL,
  paid_at timestamptz NOT NULL,
  reference text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payments_invoice_idx ON public.payments(invoice_id);

CREATE TABLE IF NOT EXISTS public.invoice_links (
  parent_invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  child_invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  PRIMARY KEY (parent_invoice_id, child_invoice_id),
  CHECK (parent_invoice_id <> child_invoice_id)
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  actor_id uuid,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id uuid,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  site_id uuid REFERENCES public.sites(id) ON DELETE SET NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  ts timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_logs_tenant_ts_idx ON public.audit_logs(tenant_id, ts DESC);

-- Step 7: invoice numbering helper

CREATE OR REPLACE FUNCTION public.generate_invoice_no(p_tenant_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year integer := EXTRACT(YEAR FROM current_date)::integer;
  v_sequence integer;
BEGIN
  LOOP
    UPDATE public.invoice_sequences
    SET last_sequence = last_sequence + 1
    WHERE tenant_id = p_tenant_id
      AND year = v_year
    RETURNING last_sequence INTO v_sequence;

    IF FOUND THEN
      EXIT;
    END IF;

    BEGIN
      INSERT INTO public.invoice_sequences(tenant_id, year, last_sequence)
      VALUES (p_tenant_id, v_year, 1)
      RETURNING last_sequence INTO v_sequence;
      EXIT;
    EXCEPTION
      WHEN unique_violation THEN
        -- loop and try update again
        NULL;
    END;
  END LOOP;

  RETURN format('INV-%s-%s', v_year, LPAD(v_sequence::text, 5, '0'));
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_invoice_defaults()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_currency text;
BEGIN
  IF NEW.tenant_id IS NULL THEN
    NEW.tenant_id := public.get_user_tenant_id(auth.uid());
  END IF;

  IF NEW.invoice_no IS NULL OR NEW.invoice_no = '' THEN
    NEW.invoice_no := public.generate_invoice_no(NEW.tenant_id);
  END IF;

  IF NEW.currency IS NULL OR NEW.currency = '' THEN
    SELECT currency INTO v_currency FROM public.clients WHERE id = NEW.client_id;
    NEW.currency := COALESCE(v_currency, 'TND');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS invoices_assign_defaults ON public.invoices;
CREATE TRIGGER invoices_assign_defaults
  BEFORE INSERT ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_invoice_defaults();

-- Step 8: tenant propagation triggers

CREATE OR REPLACE FUNCTION public.ensure_client_tenant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    NEW.tenant_id := public.get_user_tenant_id(auth.uid());
  END IF;

  IF NEW.currency IS NULL OR NEW.currency = '' THEN
    NEW.currency := 'TND';
  END IF;

  IF NEW.name IS NULL OR NEW.name = '' THEN
    NEW.name := NEW.nom_legal;
  END IF;

  IF NEW.billing_address IS NULL THEN
    NEW.billing_address := NEW.adresse_siege;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS clients_ensure_tenant ON public.clients;
CREATE TRIGGER clients_ensure_tenant
  BEFORE INSERT ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_client_tenant();

CREATE OR REPLACE FUNCTION public.ensure_site_tenant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant uuid;
BEGIN
  SELECT tenant_id INTO v_tenant FROM public.clients WHERE id = NEW.client_id;
  IF NEW.tenant_id IS NULL THEN
    NEW.tenant_id := v_tenant;
  END IF;
  IF NEW.name IS NULL OR NEW.name = '' THEN
    NEW.name := NEW.nom_site;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sites_ensure_tenant ON public.sites;
CREATE TRIGGER sites_ensure_tenant
  BEFORE INSERT ON public.sites
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_site_tenant();

CREATE OR REPLACE FUNCTION public.ensure_contact_tenant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    SELECT tenant_id INTO NEW.tenant_id FROM public.clients WHERE id = NEW.client_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS contacts_ensure_tenant ON public.contacts;
CREATE TRIGGER contacts_ensure_tenant
  BEFORE INSERT ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_contact_tenant();

CREATE OR REPLACE FUNCTION public.ensure_subscription_tenant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant uuid;
BEGIN
  SELECT tenant_id INTO v_tenant FROM public.clients WHERE id = NEW.client_id;
  NEW.tenant_id := v_tenant;

  IF NEW.currency IS NULL OR NEW.currency = '' THEN
    SELECT currency INTO NEW.currency FROM public.clients WHERE id = NEW.client_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS subscriptions_ensure_tenant ON public.subscriptions;
CREATE TRIGGER subscriptions_ensure_tenant
  BEFORE INSERT ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_subscription_tenant();

CREATE OR REPLACE FUNCTION public.ensure_audit_log_tenant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    NEW.tenant_id := public.get_user_tenant_id(auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS audit_logs_ensure_tenant ON public.audit_logs;
CREATE TRIGGER audit_logs_ensure_tenant
  BEFORE INSERT ON public.audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_audit_log_tenant();

-- Step 9: RBAC policies (tenant isolation + role checks)

GRANT USAGE ON SCHEMA public TO authenticated;

-- Tenants table: only super_admin can view/manage
DROP POLICY IF EXISTS "tenant_read" ON public.tenants;
DROP POLICY IF EXISTS "tenant_write" ON public.tenants;

CREATE POLICY "tenant_read" ON public.tenants
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

CREATE POLICY "tenant_write" ON public.tenants
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::public.app_role));

-- Profiles: enforce tenant isolation
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their profile or tenant" ON public.profiles
FOR SELECT
USING (
  id = auth.uid()
  OR (tenant_id = public.get_user_tenant_id(auth.uid()) AND public.has_any_role(auth.uid(), ARRAY['super_admin','admin_global','account_manager','billing_manager','viewer']::public.app_role[]))
);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users update self or admins" ON public.profiles
FOR UPDATE
USING (
  id = auth.uid()
  OR public.has_any_role(auth.uid(), ARRAY['super_admin','admin_global']::public.app_role[])
)
WITH CHECK (
  tenant_id = public.get_user_tenant_id(auth.uid())
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
);

-- Clients policies
DROP POLICY IF EXISTS "Admin and HSE can create clients" ON public.clients;
DROP POLICY IF EXISTS "Users can view their client or admins can view all" ON public.clients;
DROP POLICY IF EXISTS "Admins can update clients" ON public.clients;
DROP POLICY IF EXISTS "Admin global can delete clients" ON public.clients;

CREATE POLICY "Clients select tenant scope" ON public.clients
FOR SELECT
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
);

CREATE POLICY "Clients insert managed roles" ON public.clients
FOR INSERT
WITH CHECK (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.has_any_role(auth.uid(), ARRAY['super_admin','admin_global','account_manager']::public.app_role[])
);

CREATE POLICY "Clients update managed roles" ON public.clients
FOR UPDATE
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.has_any_role(auth.uid(), ARRAY['super_admin','admin_global','account_manager','billing_manager']::public.app_role[])
)
WITH CHECK (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND (
    NEW.billing_mode = OLD.billing_mode
    OR public.has_any_role(auth.uid(), ARRAY['super_admin','admin_global','billing_manager']::public.app_role[])
  )
);

CREATE POLICY "Clients delete only super admin" ON public.clients
FOR DELETE
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

-- Sites policies
DROP POLICY IF EXISTS "Sites select policy" ON public.sites;

CREATE POLICY "Sites select tenant scope" ON public.sites
FOR SELECT
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
);

CREATE POLICY "Sites insert managed roles" ON public.sites
FOR INSERT
WITH CHECK (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.has_any_role(auth.uid(), ARRAY['super_admin','admin_global','account_manager']::public.app_role[])
);

CREATE POLICY "Sites update managed roles" ON public.sites
FOR UPDATE
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.has_any_role(auth.uid(), ARRAY['super_admin','admin_global','account_manager','billing_manager']::public.app_role[])
)
WITH CHECK (
  tenant_id = public.get_user_tenant_id(auth.uid())
);

CREATE POLICY "Sites delete admin" ON public.sites
FOR DELETE
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.has_any_role(auth.uid(), ARRAY['super_admin','admin_global']::public.app_role[])
);

-- Contacts policies
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contacts select tenant" ON public.contacts
FOR SELECT
USING (tenant_id = public.get_user_tenant_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Contacts insert account" ON public.contacts
FOR INSERT
WITH CHECK (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.has_any_role(auth.uid(), ARRAY['super_admin','admin_global','account_manager','billing_manager']::public.app_role[])
);

CREATE POLICY "Contacts update account" ON public.contacts
FOR UPDATE
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.has_any_role(auth.uid(), ARRAY['super_admin','admin_global','account_manager','billing_manager']::public.app_role[])
)
WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Contacts delete admin" ON public.contacts
FOR DELETE
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.has_any_role(auth.uid(), ARRAY['super_admin','admin_global']::public.app_role[])
);

-- Plans policies (global, controlled by super admin or billing manager)
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Plans read" ON public.plans
FOR SELECT
USING (true);

CREATE POLICY "Plans write" ON public.plans
FOR ALL
USING (public.has_any_role(auth.uid(), ARRAY['super_admin','billing_manager']::public.app_role[]))
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','billing_manager']::public.app_role[]));

-- Subscriptions policies
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Subscriptions select" ON public.subscriptions
FOR SELECT
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
);

CREATE POLICY "Subscriptions write" ON public.subscriptions
FOR ALL
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.has_any_role(auth.uid(), ARRAY['super_admin','admin_global','billing_manager']::public.app_role[])
)
WITH CHECK (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.has_any_role(auth.uid(), ARRAY['super_admin','admin_global','billing_manager']::public.app_role[])
);

-- Invoices policies
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Invoices select tenant" ON public.invoices
FOR SELECT
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
);

CREATE POLICY "Invoices manage billing" ON public.invoices
FOR ALL
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.has_any_role(auth.uid(), ARRAY['super_admin','admin_global','billing_manager']::public.app_role[])
)
WITH CHECK (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.has_any_role(auth.uid(), ARRAY['super_admin','admin_global','billing_manager']::public.app_role[])
);

-- Invoice items policies
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Invoice items select" ON public.invoice_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.invoices i
    WHERE i.id = invoice_id
      AND (i.tenant_id = public.get_user_tenant_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'))
  )
);

CREATE POLICY "Invoice items manage" ON public.invoice_items
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.invoices i
    WHERE i.id = invoice_id
      AND i.tenant_id = public.get_user_tenant_id(auth.uid())
  )
  AND public.has_any_role(auth.uid(), ARRAY['super_admin','admin_global','billing_manager']::public.app_role[])
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.invoices i
    WHERE i.id = invoice_id
      AND i.tenant_id = public.get_user_tenant_id(auth.uid())
  )
  AND public.has_any_role(auth.uid(), ARRAY['super_admin','admin_global','billing_manager']::public.app_role[])
);

-- Payments policies
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Payments select" ON public.payments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.invoices i
    WHERE i.id = invoice_id
      AND (i.tenant_id = public.get_user_tenant_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'))
  )
);

CREATE POLICY "Payments manage" ON public.payments
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.invoices i
    WHERE i.id = invoice_id
      AND i.tenant_id = public.get_user_tenant_id(auth.uid())
  )
  AND public.has_any_role(auth.uid(), ARRAY['super_admin','admin_global','billing_manager']::public.app_role[])
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.invoices i
    WHERE i.id = invoice_id
      AND i.tenant_id = public.get_user_tenant_id(auth.uid())
  )
  AND public.has_any_role(auth.uid(), ARRAY['super_admin','admin_global','billing_manager']::public.app_role[])
);

-- Invoice links policies
ALTER TABLE public.invoice_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Invoice links select" ON public.invoice_links
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.invoices i
    WHERE i.id = parent_invoice_id
      AND (i.tenant_id = public.get_user_tenant_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'))
  )
);

CREATE POLICY "Invoice links manage" ON public.invoice_links
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.invoices i
    WHERE i.id = parent_invoice_id
      AND i.tenant_id = public.get_user_tenant_id(auth.uid())
  )
  AND public.has_any_role(auth.uid(), ARRAY['super_admin','admin_global','billing_manager']::public.app_role[])
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.invoices i
    WHERE i.id = parent_invoice_id
      AND i.tenant_id = public.get_user_tenant_id(auth.uid())
  )
  AND public.has_any_role(auth.uid(), ARRAY['super_admin','admin_global','billing_manager']::public.app_role[])
);

-- Audit logs policies
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Audit logs select" ON public.audit_logs
FOR SELECT
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  OR public.has_any_role(auth.uid(), ARRAY['super_admin','admin_global','billing_manager']::public.app_role[])
);

CREATE POLICY "Audit logs insert" ON public.audit_logs
FOR INSERT
WITH CHECK (
  tenant_id = public.get_user_tenant_id(auth.uid())
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
);

-- Views / helper comments
COMMENT ON TABLE public.invoices IS 'Invoices generated per tenant/client/site with consolidated support';
COMMENT ON COLUMN public.invoices.invoice_no IS 'Unique invoice number per tenant generated via generate_invoice_no()';
COMMENT ON COLUMN public.clients.billing_mode IS 'Determines whether billing occurs at client, site, or hybrid scope';
COMMENT ON COLUMN public.subscriptions.scope IS 'Scope for billing: client-wide or per site';
