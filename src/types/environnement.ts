// Types et constantes pour le module Environnement & Déchets

export const CATEGORIES_DECHETS = [
  "Papier / Carton",
  "Plastique",
  "Verre",
  "Métaux",
  "Bois",
  "Huiles usagées",
  "Solvants",
  "Peintures",
  "Produits chimiques",
  "DEEE", // Déchets d'Équipements Électriques et Électroniques
  "Piles et batteries",
  "Déchets verts",
  "DIB", // Déchets Industriels Banals
  "DIS", // Déchets Industriels Spéciaux
  "Autre",
] as const;

export const TYPES_ZONES = [
  "interieur",
  "exterieur",
  "conteneur",
  "benne",
  "local_dedie",
] as const;

export const DESTINATIONS_DECHETS = [
  "valorisation",
  "recyclage",
  "elimination",
  "incineration",
  "enfouissement",
] as const;

export const TYPES_POINTS_MESURE = [
  "eau",
  "air",
  "bruit",
  "sol",
  "rejets",
] as const;

export const FREQUENCES_CONTROLE = [
  "hebdomadaire",
  "mensuel",
  "trimestriel",
  "semestriel",
  "annuel",
  "ponctuel",
] as const;

export const TYPES_PRESTATAIRES = [
  "collecteur",
  "laboratoire",
  "transporteur",
] as const;

export const TYPES_DOCUMENTS_PRESTATAIRES = [
  "agrement",
  "attestation",
  "contrat",
  "assurance",
  "certification",
] as const;

// Paramètres courants par type de point
export const PARAMETRES_PAR_TYPE: Record<string, string[]> = {
  eau: ["pH", "DCO", "DBO5", "MES", "NOx", "NTK", "Phosphore", "Température"],
  air: ["SO2", "NOx", "CO", "COV", "Poussières", "PM10", "PM2.5"],
  bruit: ["dB(A) jour", "dB(A) nuit", "dB(A) émergence"],
  sol: ["pH", "Métaux lourds", "Hydrocarbures", "HAP"],
  rejets: ["Débit", "Température", "pH", "Conductivité"],
};

export const UNITES_MESURE = [
  "mg/L",
  "mg/Nm3",
  "µg/m3",
  "dB(A)",
  "°C",
  "µS/cm",
  "m3/h",
  "%",
] as const;

// Statut colors
export const STATUT_STOCK_COLORS = {
  ok: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  attention: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  critique: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

export const CONFORMITE_COLORS = {
  conforme: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  non_conforme: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  a_verifier: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
};

export interface FluxDechet {
  id: string;
  site_id: string;
  code_ced: string;
  libelle: string;
  categorie: string;
  dangereux: boolean;
  unite: string;
  observations?: string;
  actif: boolean;
  created_at: string;
  updated_at: string;
  sites?: {
    nom_site: string;
  };
}

export interface ZoneStockage {
  id: string;
  site_id: string;
  nom: string;
  type_zone: string;
  localisation?: string;
  capacite_max: number;
  unite: string;
  confinement: boolean;
  retention: boolean;
  observations?: string;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

export interface StockDechet {
  id: string;
  flux_id: string;
  zone_id: string;
  quantite_actuelle: number;
  date_debut_stockage?: string;
  jours_en_stock?: number;
  observations?: string;
  updated_at: string;
  env_flux_dechets?: FluxDechet;
  env_zones_stockage?: ZoneStockage;
}

export interface Enlevement {
  id: string;
  site_id: string;
  flux_id: string;
  zone_id?: string;
  date_enlevement: string;
  prestataire_id?: string;
  prestataire_nom?: string;
  quantite: number;
  unite: string;
  destination: string;
  type_destination?: string;
  numero_bordereau?: string;
  bordereau_url?: string;
  bordereau_complet: boolean;
  observations?: string;
  created_at: string;
  env_flux_dechets?: FluxDechet;
  env_prestataires?: Prestataire;
}

export interface PointMesure {
  id: string;
  site_id: string;
  code: string;
  libelle: string;
  type_point: string;
  localisation?: string;
  frequence_controle?: string;
  jour_controle_attendu?: number;
  observations?: string;
  actif: boolean;
  created_at: string;
  sites?: {
    nom_site: string;
  };
}

export interface ParametreLimite {
  id: string;
  point_id: string;
  parametre: string;
  unite: string;
  limite_min?: number;
  limite_max?: number;
  valeur_cible?: number;
  reference_reglementaire?: string;
  observations?: string;
  actif: boolean;
  created_at: string;
}

export interface Mesure {
  id: string;
  point_id: string;
  parametre_id: string;
  date_mesure: string;
  heure_mesure?: string;
  valeur: number;
  unite: string;
  methode_analyse?: string;
  laboratoire_id?: string;
  laboratoire_nom?: string;
  conforme?: boolean;
  observations?: string;
  rapport_analyse_url?: string;
  action_id?: string;
  created_at: string;
  env_points_mesure?: PointMesure;
  env_parametres_limites?: ParametreLimite;
}

export interface Prestataire {
  id: string;
  client_id?: string;
  raison_sociale: string;
  type_prestataire: string;
  siret?: string;
  adresse?: string;
  code_postal?: string;
  telephone?: string;
  email?: string;
  contact_principal?: string;
  agrement_numero?: string;
  agrement_date_validite?: string;
  observations?: string;
  actif: boolean;
  created_at: string;
}

export interface PrestataireDocument {
  id: string;
  prestataire_id: string;
  type_document: string;
  titre: string;
  numero_document?: string;
  date_emission?: string;
  date_validite?: string;
  file_url: string;
  file_name?: string;
  observations?: string;
  created_at: string;
}
