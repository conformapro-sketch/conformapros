-- Migration: batch 5 - domain, delegation, and supporting reference tables
CREATE TABLE public.domaines_application (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text NOT NULL,
    libelle text NOT NULL,
    actif boolean,
    description text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    deleted_at timestamptz
);

CREATE TABLE public.sous_domaines_application (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    domaine_id uuid NOT NULL REFERENCES public.domaines_application(id),
    code text NOT NULL,
    libelle text NOT NULL,
    actif boolean,
    description text,
    ordre integer,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    deleted_at timestamptz
);

CREATE TABLE public.delegations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    gouvernorat_id uuid NOT NULL,
    code text NOT NULL,
    nom text NOT NULL,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE public.gouvernorats (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text NOT NULL,
    nom text NOT NULL,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE public.localites (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    delegation_id uuid NOT NULL REFERENCES public.delegations(id),
    nom text NOT NULL,
    code_postal text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE public.codes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    titre text NOT NULL,
    description text,
    structure jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    deleted_at timestamptz
);
