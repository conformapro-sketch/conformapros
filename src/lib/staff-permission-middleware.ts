import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

/**
 * Permission check result interface
 */
export interface PermissionCheckResult {
  authorized: boolean;
  reason?: string;
  message?: string;
  role?: string;
  permission?: string;
  user_id?: string;
}

/**
 * Batch permission check result interface
 */
export interface BatchPermissionCheckResult {
  authorized: boolean;
  reason?: string;
  message?: string;
  role?: string;
  user_id?: string;
  total_permissions?: number;
  authorized_permissions?: number;
  permissions?: Array<{
    permission: string;
    authorized: boolean;
  }>;
}

/**
 * Available staff permissions
 */
export const STAFF_PERMISSIONS = {
  MANAGE_TEXTES: 'manage_textes',
  MANAGE_ARTICLES: 'manage_articles',
  MANAGE_VERSIONS: 'manage_versions',
  MANAGE_CLIENTS: 'manage_clients',
  MANAGE_MODULES: 'manage_modules',
  MANAGE_USERS: 'manage_users',
  MANAGE_SITES: 'manage_sites',
  VIEW_ALL_SITES: 'view_all_sites',
  EDIT_DOMAINS: 'edit_domains',
  MANAGE_AUTORITES: 'manage_autorites',
  MANAGE_CODES: 'manage_codes',
  MANAGE_TAGS: 'manage_tags',
  MANAGE_STAFF: 'manage_staff',
} as const;

export type StaffPermission = typeof STAFF_PERMISSIONS[keyof typeof STAFF_PERMISSIONS];

/**
 * Staff Permission Middleware
 * Verifies staff session, role, and exact permissions before authorizing actions
 */
export const staffPermissionMiddleware = {
  /**
   * Check if current user has a specific staff permission
   * @param permission - The permission key to check
   * @returns Permission check result
   */
  async checkPermission(permission: StaffPermission): Promise<PermissionCheckResult> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        authorized: false,
        reason: 'not_authenticated',
        message: 'User is not authenticated'
      };
    }

    const { data, error } = await supabase.rpc('check_staff_permission', {
      _user_id: user.id,
      _permission_key: permission
    });

    if (error) {
      console.error('Permission check error:', error);
      return {
        authorized: false,
        reason: 'error',
        message: 'Failed to check permission'
      };
    }

    return (data as unknown) as PermissionCheckResult;
  },

  /**
   * Check multiple permissions at once
   * @param permissions - Array of permission keys to check
   * @returns Batch permission check result
   */
  async checkPermissionsBatch(permissions: StaffPermission[]): Promise<BatchPermissionCheckResult> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        authorized: false,
        reason: 'not_authenticated',
        message: 'User is not authenticated',
        permissions: []
      };
    }

    const { data, error } = await supabase.rpc('check_staff_permissions_batch', {
      _user_id: user.id,
      _permission_keys: permissions
    });

    if (error) {
      console.error('Batch permission check error:', error);
      return {
        authorized: false,
        reason: 'error',
        message: 'Failed to check permissions',
        permissions: []
      };
    }

    return (data as unknown) as BatchPermissionCheckResult;
  },

  /**
   * Guard function - throws error if permission not granted
   * Use this in functions that require specific permissions
   * @param permission - The required permission
   * @throws Error if permission is not granted
   */
  async requirePermission(permission: StaffPermission): Promise<void> {
    const result = await this.checkPermission(permission);
    
    if (!result.authorized) {
      throw new Error(result.message || 'Permission denied');
    }
  },

  /**
   * Check if user is staff (without checking specific permission)
   * @returns True if user is staff
   */
  async isStaff(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return false;

    const { data, error } = await supabase.rpc('is_staff_user', {
      _user_id: user.id
    });

    if (error) {
      console.error('Staff check error:', error);
      return false;
    }

    return data as boolean;
  },

  /**
   * Get current staff user's role
   * @returns Role ID or null if not staff
   */
  async getStaffRole(): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;

    const { data, error } = await supabase.rpc('get_staff_role', {
      _user_id: user.id
    });

    if (error) {
      console.error('Get staff role error:', error);
      return null;
    }

    return data as string | null;
  }
};

/**
 * React hook for checking staff permissions
 */
export const useStaffPermission = (permission: StaffPermission) => {
  const [result, setResult] = useState<PermissionCheckResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPerm = async () => {
      setLoading(true);
      const res = await staffPermissionMiddleware.checkPermission(permission);
      setResult(res);
      setLoading(false);
    };

    checkPerm();
  }, [permission]);

  return {
    authorized: result?.authorized ?? false,
    loading,
    result
  };
};
