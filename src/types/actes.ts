// Type definitions for Actes Réglementaires (Regulatory Acts)

export type TypeActe = "loi" | "decret" | "arrete" | "circulaire";

export type StatutVigueur = "en_vigueur" | "modifie" | "abroge" | "suspendu";

export type TypeRelation = "modifie" | "abroge" | "complete" | "rend_applicable" | "rectifie" | "renvoi";

export type NiveauStructure = "livre" | "titre" | "chapitre" | "section";

export type EtatConformite = "conforme" | "partiel" | "non_conforme" | "non_evalue";

export type TypePreuve = "procedure" | "rapport" | "certificat" | "photo" | "autre";

export interface TypeActeRow {
  id: string;
  code: TypeActe;
  libelle: string;
  created_at: string;
}

export interface DomaineApplication {
  id: string;
  code: string;
  libelle: string;
  actif: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface SousDomaineApplication {
  id: string;
  domaine_id: string;
  code: string;
  libelle: string;
  actif: boolean;
  ordre: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface Applicability {
  establishment_types: string[];
  sectors: string[];
  risk_classes: string[];
}

export interface ActeReglementaire {
  id: string;
  type_acte: TypeActe;
  numero_officiel?: string;
  reference_officielle?: string;
  annee?: number;
  date_signature?: string;
  date_publication_jort?: string;
  jort_numero?: string;
  jort_page_debut?: string;
  jort_page_fin?: string;
  autorite_emettrice?: string;
  intitule: string;
  objet_resume?: string;
  domaines?: string[];
  mots_cles?: string[];
  statut_vigueur: StatutVigueur;
  langue_disponible?: string;
  url_pdf_ar?: string;
  url_pdf_fr?: string;
  lien_pdf?: string;
  notes_editoriales?: string;
  date_entree_vigueur_effective?: string;
  // Nouveaux champs
  tags?: string[];
  applicability?: Applicability;
  content?: string;
  source_url?: string;
  version?: number;
  previous_version_id?: string;
  search_vector?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  deleted_at?: string;
  types_acte?: TypeActeRow;
}

export interface ActeAnnexe {
  id: string;
  acte_id: string;
  label: string;
  file_url: string;
  file_size?: number;
  file_type?: string;
  uploaded_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ApplicabiliteMapping {
  id: string;
  acte_id: string;
  establishment_type: string;
  risk_class?: string;
  sector?: string;
  created_at: string;
}

export interface Article {
  id: string;
  acte_id: string;
  numero: string;
  reference_article?: string;
  titre_court?: string;
  ordre: number;
  contenu_ar?: string;
  contenu_fr?: string;
  notes?: string;
  indicatif?: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export type ModificationType = 
  | "ajout" 
  | "modification" 
  | "abrogation" 
  | "remplacement" 
  | "insertion";

export interface ArticleVersion {
  id: string;
  article_id: string;
  version_numero: number;
  version_label: string;
  contenu: string;
  date_version: string;
  raison_modification?: string;
  // Nouveaux champs de traçabilité
  modification_type: ModificationType;
  source_text_id?: string;
  source_article_reference?: string;
  effective_from: string;
  effective_to?: string;
  is_active: boolean;
  notes_modification?: string;
  replaced_version_id?: string;
  created_by?: string;
  created_at: string;
  updated_at?: string;
  deleted_at?: string;
  // Relations chargées
  source_text?: {
    id: string;
    reference_officielle: string;
    intitule: string;
    type_acte: TypeActe;
    date_publication?: string;
  };
}

export interface StructureCode {
  id: string;
  acte_id: string;
  niveau: NiveauStructure;
  numero: string;
  titre: string;
  parent_id?: string;
  created_at: string;
  updated_at: string;
}

export interface RelationActe {
  id: string;
  source_id: string;
  relation: TypeRelation;
  cible_id: string;
  details?: string;
  created_at: string;
  cible?: {
    numero_officiel?: string;
    intitule: string;
  };
}

export interface ChangelogEntry {
  id: string;
  acte_id: string;
  type_changement: "ajout" | "modification" | "abrogation";
  description: string;
  date_changement: string;
  version?: number;
  created_at: string;
}

export type TypeEffet = 
  | "AJOUTE" 
  | "MODIFIE" 
  | "ABROGE" 
  | "REMPLACE" 
  | "RENUMEROTE";

export interface ArticleEffetJuridique {
  id: string;
  article_source_id: string;
  type_effet: TypeEffet;
  texte_cible_id?: string;
  article_cible_id?: string;
  nouvelle_numerotation?: string;
  date_effet: string;
  date_fin_effet?: string;
  reference_citation?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Relations chargées
  texte_cible?: {
    id: string;
    reference_officielle: string;
    intitule: string;
    type: string;
  };
  article_cible?: {
    id: string;
    numero_article: string;
    titre_court?: string;
  };
  article_source?: {
    id: string;
    numero_article: string;
    titre_court?: string;
    texte: {
      reference_officielle: string;
      intitule: string;
    };
  };
}
