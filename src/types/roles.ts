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

export const MODULES = [
  'bibliotheque',
  'veille',
  'evaluation',
  'matrice',
  'plan_action',
  'audits',
  'incidents',
  'equipements',
  'formations',
  'clients',
  'sites',
  'factures',
  'abonnements',
  'utilisateurs',
  'roles',
  'rapports',
] as const;

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
  audits: 'Audits',
  incidents: 'Incidents HSE',
  equipements: 'Équipements & EPI',
  formations: 'Formations',
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
