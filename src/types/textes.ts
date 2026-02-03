/**
 * Types pour les Textes Réglementaires (Regulatory Texts)
 * 
 * ARCHITECTURE CORRECTE:
 *   textes_reglementaires (métadonnées des textes)
 *     └─> articles (subdivisions normatives)
 *          └─> article_versions (historique du contenu)
 *     └─> textes_domaines → domaines_reglementaires
 * 
 * CONVENTIONS DE NOMMAGE:
 *   - Table articles: numero, titre, porte_exigence, est_introductif
 *   - Table article_versions: contenu, date_effet, statut, source_texte_id
 *   - Table textes_reglementaires: type, reference, titre, date_publication
 *   - Table domaines_reglementaires: code, libelle, actif
 */

// ============= ENUMS & TYPES =============

export type TypeTexte = "loi" | "decret-loi" | "decret" | "arrete" | "circulaire";

export type StatutVersion = "en_vigueur" | "remplacee" | "abrogee";

export type TypeEffet = 
  | "AJOUTE" 
  | "MODIFIE" 
  | "ABROGE" 
  | "REMPLACE" 
  | "RENUMEROTE"
  | "COMPLETE";

export type PorteeEffet = "article" | "alinea" | "point";

export type NiveauStructure = "livre" | "titre" | "chapitre" | "section";

export type EtatConformite = "conforme" | "partiel" | "non_conforme" | "non_evalue";

export type TypePreuve = "procedure" | "rapport" | "certificat" | "photo" | "autre";

// ============= INTERFACES PRINCIPALES =============

/**
 * Texte réglementaire (Loi, Décret, Arrêté, Circulaire)
 * Table: textes_reglementaires
 */
export interface TexteReglementaire {
  id: string;
  type: TypeTexte;
  reference: string;
  titre: string;
  autorite_emettrice?: string;
  autorite_emettrice_id?: string;
  date_publication?: string;
  source_url?: string;
  pdf_url?: string;
  annee?: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
  deleted_at?: string;
  // Relations chargées
  domaines?: Array<{
    domaine: DomaineReglementaire;
  }>;
  articles?: Article[];
  // Legacy aliases for backward compatibility
  /** @deprecated Use 'reference' instead */
  reference_officielle?: string;
  /** @deprecated Use 'titre' instead */
  intitule?: string;
  /** @deprecated Use 'date_publication' instead */
  date_publication_jort?: string;
  /** @deprecated Use 'type' instead */
  type_acte?: TypeTexte;
  /** @deprecated */
  statut_vigueur?: StatutVigueur;
  /** @deprecated */
  numero_officiel?: string;
  /** @deprecated */
  jort_numero?: string;
  /** @deprecated */
  jort_page_debut?: string;
  /** @deprecated */
  jort_page_fin?: string;
  /** @deprecated */
  date_signature?: string;
  /** @deprecated */
  objet_resume?: string;
  /** @deprecated */
  mots_cles?: string[];
  /** @deprecated */
  url_pdf_ar?: string;
  /** @deprecated */
  url_pdf_fr?: string;
  /** @deprecated */
  notes_editoriales?: string;
  /** @deprecated */
  version?: number;
  /** @deprecated */
  types_acte?: TypeActeRow;
}

/**
 * Article d'un texte réglementaire
 * Table: articles
 */
export interface Article {
  id: string;
  texte_id: string;
  numero: string;
  titre: string;
  resume?: string;
  est_introductif: boolean;
  porte_exigence: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  // Relations chargées
  texte?: TexteReglementaire;
  versions?: ArticleVersion[];
  sous_domaines?: Array<{
    sous_domaine: SousDomaineApplication;
  }>;
  // Legacy aliases for backward compatibility - these will be removed
  /** @deprecated Use 'numero' instead */
  numero_article?: string;
  /** @deprecated Use 'titre' instead */
  titre_court?: string;
  /** @deprecated Use 'porte_exigence' instead */
  is_exigence?: boolean;
  /** @deprecated Content is now in article_versions table */
  contenu?: string;
  /** @deprecated Use texte_id instead */
  acte_id?: string;
  /** @deprecated Not in schema */
  ordre?: number;
  /** @deprecated Not in schema - content now in article_versions */
  contenu_ar?: string;
  /** @deprecated Not in schema - content now in article_versions */
  contenu_fr?: string;
  /** @deprecated Use 'resume' instead */
  notes?: string;
}

/**
 * Version d'un article (historique des modifications)
 * Table: article_versions
 */
export interface ArticleVersion {
  id: string;
  article_id: string;
  numero_version: number;
  contenu: string;
  date_effet: string;
  statut: StatutVersion;
  source_texte_id: string;
  notes_modifications?: string;
  created_at: string;
  updated_at?: string;
  created_by?: string;
  // Relations chargées
  source_texte?: {
    id: string;
    reference: string;
    titre: string;
    type: TypeTexte;
    date_publication?: string;
  };
  article?: Article;
}

/**
 * Domaine réglementaire (SST, ENV, SOCIAL, etc.)
 * Table: domaines_reglementaires
 */
export interface DomaineReglementaire {
  id: string;
  code: string;
  libelle: string;
  description?: string;
  couleur?: string;
  icone?: string;
  actif: boolean;
  created_at: string;
  deleted_at?: string;
}

/**
 * Sous-domaine d'application
 * Table: sous_domaines_application
 */
export interface SousDomaineApplication {
  id: string;
  domaine_id: string;
  code: string;
  libelle: string;
  description?: string;
  actif: boolean;
  ordre: number;
  created_at: string;
  updated_at?: string;
  deleted_at?: string;
  // Relations chargées
  domaine?: DomaineReglementaire;
}

// ============= INTERFACES EFFETS JURIDIQUES =============

/**
 * Effet juridique d'un article sur un autre
 * Table: articles_effets_juridiques
 */
export interface ArticleEffetJuridique {
  id: string;
  article_id: string;
  article_source_id?: string;
  type_effet: TypeEffet;
  date_effet: string;
  textes_articles?: string[];
  created_at: string;
  // Relations chargées
  texte_cible?: {
    id: string;
    reference: string;
    titre: string;
    type: TypeTexte;
  };
  article_cible?: {
    id: string;
    numero: string;
    titre?: string;
  };
  article_source?: {
    id: string;
    numero: string;
    titre?: string;
    texte?: {
      reference: string;
      titre: string;
    };
  };
}

// ============= INTERFACES ANNEXES =============

/**
 * Annexe d'un texte réglementaire
 */
export interface TexteAnnexe {
  id: string;
  texte_id: string;
  label: string;
  file_url: string;
  file_size?: number;
  file_type?: string;
  uploaded_by?: string;
  created_at: string;
  updated_at: string;
  /** @deprecated Use texte_id instead */
  acte_id?: string;
}

/**
 * Structure hiérarchique d'un code juridique
 */
export interface StructureCode {
  id: string;
  code_id: string;
  niveau: NiveauStructure;
  numero: string;
  titre: string;
  parent_id?: string;
  ordre: number;
  created_at: string;
}

/**
 * Entrée du changelog d'un texte
 */
export interface ChangelogEntry {
  id: string;
  acte_id: string;
  type_changement: "ajout" | "modification" | "abrogation" | string;
  description: string;
  date_changement: string;
  version?: string | number;
  created_at: string;
}

// ============= TYPES LEGACY (DEPRECATED) =============
// Ces types sont conservés pour compatibilité avec l'ancien code
// Ils seront supprimés lors du nettoyage final

/** @deprecated Use TypeTexte instead */
export type TypeActe = TypeTexte;

/** @deprecated Use StatutVersion instead */
export type StatutVigueur = "en_vigueur" | "modifie" | "abroge" | "suspendu";

/** @deprecated Use TexteReglementaire instead */
export interface ActeReglementaire extends TexteReglementaire {
  // Alias pour compatibilité
  type_acte?: TypeTexte;
  reference_officielle?: string;
  intitule?: string;
  date_publication_jort?: string;
  statut_vigueur?: StatutVigueur;
}

/** @deprecated Use DomaineReglementaire instead */
export interface DomaineApplication extends DomaineReglementaire {}

/** @deprecated Use TexteAnnexe instead */
export interface ActeAnnexe extends TexteAnnexe {
  acte_id?: string;
}

/** @deprecated */
export interface ApplicabiliteMapping {
  id: string;
  acte_id: string;
  establishment_type: string;
  risk_class?: string;
  sector?: string;
  created_at: string;
}

/** @deprecated */
export type TypeRelation = "modifie" | "abroge" | "complete" | "rend_applicable" | "rectifie" | "renvoi";

/** @deprecated */
export interface RelationActe {
  id: string;
  source_id: string;
  relation: TypeRelation;
  cible_id: string;
  details?: string;
  created_at: string;
}

/** @deprecated */
export interface TypeActeRow {
  id: string;
  code: TypeTexte;
  libelle: string;
  created_at: string;
}

/** @deprecated */
export interface Applicability {
  establishment_types: string[];
  sectors: string[];
  risk_classes: string[];
}

/** @deprecated */
export type ModificationType = 
  | "ajout" 
  | "modification" 
  | "abrogation" 
  | "remplacement" 
  | "insertion";
