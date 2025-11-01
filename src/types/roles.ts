export type RoleType = 'team' | 'client';
export type PermissionDecision = 'allow' | 'deny' | 'inherit';
export type PermissionScope = 'global' | 'tenant' | 'site';

export interface Role {
  id: string;
  type: RoleType;
  name: string;
  description?: string;
  is_system: boolean;
  tenant_id?: string;
  created_at: string;
  updated_at: string;
  archived_at?: string;
  user_count?: number;
}

export interface RolePermission {
  id: string;
  role_id: string;
  module: string;
  action: string;
  decision: PermissionDecision;
  scope: PermissionScope;
  created_at: string;
}

export interface UserRoleAssignment {
  id: string;
  user_id: string;
  role_uuid: string;
  role?: Role;
  client_id?: string;
  site_scope?: string[];
  created_at: string;
}

export interface RoleAuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  changes: Record<string, any>;
  tenant_id?: string;
  created_at: string;
}

// Client-facing operational modules
export const CLIENT_MODULES = [
  'bibliotheque',
  'veille',
  'evaluation',
  'matrice',
  'plan_action',
  'dossier',
  'controles',
  'audits',
  'incidents',
  'equipements',
  'formations',
  'visites_medicales',
  'epi',
  'prestataires',
  'permis',
  'environnement',
  'rapports',
] as const;

// Admin/ConformaPro only modules
export const ADMIN_MODULES = [
  'clients',
  'sites',
  'factures',
  'abonnements',
  'utilisateurs',
  'roles',
] as const;

// All modules combined
export const MODULES = [...CLIENT_MODULES, ...ADMIN_MODULES] as const;

export const ACTIONS = [
  'view',
  'create',
  'edit',
  'delete',
  'export',
  'assign',
  'bulk_edit',
  'upload_proof',
] as const;

export const MODULE_LABELS: Record<string, string> = {
  bibliotheque: 'Bibliothèque Réglementaire',
  veille: 'Veille Réglementaire',
  evaluation: 'Évaluation de Conformité',
  matrice: 'Matrice d\'Applicabilité',
  plan_action: 'Plan d\'Action',
  dossier: 'Dossier Réglementaire',
  controles: 'Contrôles Techniques',
  audits: 'Audits & Inspections',
  incidents: 'Incidents HSE',
  equipements: 'Équipements',
  formations: 'Formations',
  visites_medicales: 'Visites Médicales',
  epi: 'EPI & Équipements',
  prestataires: 'Prestataires & Sous-traitants',
  permis: 'Permis de Travail',
  environnement: 'Environnement',
  clients: 'Clients',
  sites: 'Sites',
  factures: 'Factures',
  abonnements: 'Abonnements',
  utilisateurs: 'Utilisateurs',
  roles: 'Rôles & Permissions',
  rapports: 'Rapports',
};

export const ACTION_LABELS: Record<string, string> = {
  view: 'Voir',
  create: 'Créer',
  edit: 'Modifier',
  delete: 'Supprimer',
  export: 'Exporter',
  assign: 'Assigner',
  bulk_edit: 'Modification en masse',
  upload_proof: 'Télécharger preuve',
};
