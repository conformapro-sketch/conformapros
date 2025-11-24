// User Management Type Definitions

export interface ClientUser {
  id: string;
  email: string;
  nom: string | null;
  prenom: string | null;
  telephone: string | null;
  actif: boolean;
  is_client_admin: boolean;
  avatar_url: string | null;
  client_id: string;
  created_at: string;
  updated_at: string;
}

export interface UserSiteAssignment {
  id: string;
  user_id: string;
  site_id: string;
  site?: {
    id: string;
    nom: string;
    code_site?: string | null;
    gouvernorat?: string | null;
    delegation?: string | null;
  };
  read_only?: boolean | null;
  created_at: string;
}

export interface UserPermission {
  id: string;
  user_id: string;
  client_id: string;
  site_id: string | null;
  module: string;
  action: string;
  decision: 'allow' | 'deny' | 'inherit';
  scope: 'global' | 'tenant' | 'site';
  created_at: string;
}

export interface UserRole {
  id: string;
  name: string;
  type: 'team' | 'client';
}

export interface UserWithDetails extends ClientUser {
  client?: {
    id: string;
    nom: string;
    logo_url?: string | null;
  };
  sites?: UserSiteAssignment[];
  roles?: { role: UserRole }[];
  permissions?: UserPermission[];
  site_count?: number;
  permission_count?: number;
  total_count?: number;
}

export interface UserManagementStats {
  total: number;
  active: number;
  inactive: number;
  admins: number;
}
