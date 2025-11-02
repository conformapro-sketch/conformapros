// Types pour les Codes juridiques

export type TypeRelationCode = 'appartient_a' | 'modifie' | 'abroge_partiellement' | 'complete';

export interface CodeJuridique {
  id: string;
  nom_officiel: string;
  abreviation: string;
  domaine_reglementaire_id?: string;
  reference_jort?: string;
  description?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  domaines_reglementaires?: {
    id: string;
    libelle: string;
    code: string;
  };
}

export interface TexteCode {
  id: string;
  texte_id: string;
  code_id: string;
  type_relation: TypeRelationCode;
  created_at: string;
}

export interface CodeWithTextes extends CodeJuridique {
  textes?: Array<{
    texte_code_id: string;
    type_relation: TypeRelationCode;
    texte: {
      id: string;
      reference_officielle: string;
      intitule: string;
      type_acte?: string;
      date_publication?: string;
      statut_vigueur?: string;
    };
  }>;
}

export const TYPE_RELATION_LABELS: Record<TypeRelationCode, string> = {
  appartient_a: 'Appartient à',
  modifie: 'Modifie',
  abroge_partiellement: 'Abroge partiellement',
  complete: 'Complète',
};
