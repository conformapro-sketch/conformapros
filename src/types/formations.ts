export const DOMAINES_FORMATION = [
  "Sécurité",
  "Incendie",
  "Hygiène",
  "Environnement",
  "Premiers secours",
  "Travail en hauteur",
  "Électricité",
  "Équipements de protection",
  "Gestes et postures",
  "Autre",
] as const;

export const TYPES_FORMATION = [
  "obligatoire",
  "interne",
  "recyclage",
] as const;

export const STATUTS_FORMATION = [
  "planifiee",
  "realisee",
  "expiree",
  "annulee",
] as const;

export const TYPES_DOCUMENT_FORMATION = [
  "feuille_emargement",
  "rapport",
  "certificat_global",
  "support_formation",
  "autre",
] as const;

export const FORMATION_STATUS_COLORS = {
  planifiee: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  realisee: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  expiree: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  annulee: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
};

export const FORMATION_STATUS_LABELS = {
  planifiee: "Planifiée",
  realisee: "Réalisée",
  expiree: "Expirée",
  annulee: "Annulée",
};
