-- Migration: batch 4 - miscellaneous and supporting tables
CREATE TABLE public.actions_correctives (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    action text NOT NULL,
    conformite_id uuid NOT NULL REFERENCES public.conformite(id),
    cout_estime numeric,
    created_at timestamptz DEFAULT now(),
    created_by uuid,
    echeance date,
    manquement text NOT NULL,
    preuve_cloture_url text,
    priorite text,
    responsable text,
    statut text,
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.applicabilite (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    activite text,
    applicable boolean,
    article_id uuid REFERENCES public.articles(id),
    client_id uuid NOT NULL REFERENCES public.clients(id),
    created_at timestamptz DEFAULT now(),
    created_by uuid,
    justification text,
    site_id uuid REFERENCES public.sites(id),
    texte_id uuid NOT NULL REFERENCES public.actes_reglementaires(id),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.conformite (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    applicabilite_id uuid NOT NULL REFERENCES public.applicabilite(id),
    commentaire text,
    created_at timestamptz DEFAULT now(),
    derniere_mise_a_jour timestamptz,
    etat text,
    mise_a_jour_par uuid,
    score numeric
);

CREATE TABLE public.med_documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    visite_id uuid NOT NULL,
    file_name text NOT NULL,
    file_size integer,
    file_url text NOT NULL,
    type_doc text NOT NULL,
    uploaded_by uuid,
    valid_until date,
    version integer,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE public.med_notes_confidentielles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    visite_id uuid NOT NULL,
    contre_indications text,
    examens_realises text,
    observations text,
    propositions_amenagement text,
    created_at timestamptz DEFAULT now(),
    created_by uuid,
    updated_at timestamptz DEFAULT now(),
    updated_by uuid
);
