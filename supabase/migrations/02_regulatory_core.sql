-- Migration: batch 1 - regulatory and core tables
CREATE TABLE public.actes_reglementaires (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    titre text NOT NULL,
    reference text NOT NULL,
    statut_vigueur text NOT NULL,
    type_acte text NOT NULL,
    domaine text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.articles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    acte_id uuid NOT NULL REFERENCES public.actes_reglementaires(id),
    numero text NOT NULL,
    titre_court text,
    contenu_fr text,
    contenu_ar text,
    exigences text[],
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.articles_versions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id uuid NOT NULL REFERENCES public.articles(id),
    contenu text NOT NULL,
    created_at timestamptz DEFAULT now(),
    date_effet date,
    deleted_at timestamptz,
    remplace_version_id uuid REFERENCES public.articles_versions(id),
    statut_vigueur text,
    updated_at timestamptz DEFAULT now(),
    version_label text NOT NULL
);

CREATE TABLE public.changelog_reglementaire (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    acte_id uuid NOT NULL REFERENCES public.actes_reglementaires(id),
    created_by uuid,
    date_changement date,
    resume text,
    type_changement text
);

CREATE TABLE public.relations_actes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id uuid NOT NULL REFERENCES public.actes_reglementaires(id),
    cible_id uuid NOT NULL REFERENCES public.actes_reglementaires(id),
    relation text NOT NULL,
    details text,
    created_at timestamptz DEFAULT now()
);
