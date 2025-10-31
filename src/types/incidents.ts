export type TypeIncident =
  | "accident_travail"
  | "quasi_accident"
  | "incident_environnemental"
  | "incident_materiel"
  | "incendie"
  | "pollution"
  | "autre";

export type CategorieIncident =
  | "securite"
  | "incendie"
  | "environnement"
  | "hygiene"
  | "materiel"
  | "autre";

export type GraviteIncident = "mineure" | "moyenne" | "majeure";

export type StatutIncident = "en_cours" | "cloture";

export interface Incident {
  id: string;
  numero_incident: string;
  
  // Informations de base
  date_incident: string;
  heure_incident?: string;
  site_id: string;
  zone?: string;
  batiment?: string;
  atelier?: string;
  
  // Type et classification
  type_incident: TypeIncident;
  categorie?: CategorieIncident;
  gravite: GraviteIncident;
  
  // Personnes impliquées
  personne_impliquee_id?: string;
  personne_impliquee_nom?: string;
  declarant_id?: string;
  declarant_nom?: string;
  declarant_fonction?: string;
  
  // Description
  description: string;
  circonstances?: string;
  
  // Analyse
  facteur_humain?: boolean;
  facteur_materiel?: boolean;
  facteur_organisationnel?: boolean;
  facteur_environnemental?: boolean;
  analyse_causes?: string;
  
  // Suivi
  responsable_suivi_id?: string;
  mesures_correctives?: string;
  statut: StatutIncident;
  date_cloture?: string;
  validateur_id?: string;
  date_validation?: string;
  
  // Flags
  est_recurrent?: boolean;
  arret_travail?: boolean;
  jours_arret?: number;
  hospitalisation?: boolean;
  
  // Metadata
  created_at: string;
  updated_at: string;
  created_by?: string;
  
  // Relations (joined)
  sites?: {
    nom_site: string;
  };
  employes?: {
    nom: string;
    prenom: string;
  };
}

export interface IncidentCause {
  id: string;
  incident_id: string;
  niveau: number;
  question: string;
  reponse: string;
  created_at: string;
}

export interface IncidentPhoto {
  id: string;
  incident_id: string;
  file_url: string;
  file_name?: string;
  file_type?: string;
  description?: string;
  uploaded_by?: string;
  created_at: string;
}

export const TYPE_INCIDENT_LABELS: Record<TypeIncident, string> = {
  accident_travail: "Accident du travail",
  quasi_accident: "Quasi-accident",
  incident_environnemental: "Incident environnemental",
  incident_materiel: "Incident matériel",
  incendie: "Incendie",
  pollution: "Pollution",
  autre: "Autre",
};

export const CATEGORIE_INCIDENT_LABELS: Record<CategorieIncident, string> = {
  securite: "Sécurité",
  incendie: "Incendie",
  environnement: "Environnement",
  hygiene: "Hygiène",
  materiel: "Matériel",
  autre: "Autre",
};

export const GRAVITE_INCIDENT_LABELS: Record<GraviteIncident, string> = {
  mineure: "Mineure",
  moyenne: "Moyenne",
  majeure: "Majeure",
};

export const GRAVITE_INCIDENT_COLORS: Record<GraviteIncident, string> = {
  mineure: "text-success",
  moyenne: "text-warning",
  majeure: "text-destructive",
};

export const STATUT_INCIDENT_LABELS: Record<StatutIncident, string> = {
  en_cours: "En cours",
  cloture: "Clôturé",
};
