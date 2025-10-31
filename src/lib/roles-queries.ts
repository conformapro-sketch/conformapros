import { supabaseAny as supabase } from "@/lib/supabase-any";
import type { Role, RolePermission, UserRoleAssignment, RoleAuditLog } from "@/types/roles";

export const rolesQueries = {
  // Get all roles by type
  getByType: async (type: 'team' | 'client', tenantId?: string) => {
    let query = supabase
      .from('roles')
      .select('*, role_permissions(*)')
      .eq('type', type)
      .is('archived_at', null)
      .order('created_at', { ascending: false });

    if (type === 'client' && tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Get user counts
    const rolesWithCounts = await Promise.all(
      (data || []).map(async (role) => {
        const { count } = await supabase
          .from('user_roles')
          .select('*', { count: 'exact', head: true })
          .eq('role_uuid', role.id);
        
        return { ...role, user_count: count || 0 };
      })
    );

    return rolesWithCounts as (Role & { role_permissions: RolePermission[] })[];
  },

  // Get single role with permissions
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('roles')
      .select('*, role_permissions(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Role & { role_permissions: RolePermission[] };
  },

  // Create role
  create: async (roleData: {
    type: 'team' | 'client';
    name: string;
    description?: string;
    tenant_id?: string;
  }) => {
    const { data, error } = await supabase
      .from('roles')
      .insert([roleData])
      .select()
      .single();

    if (error) throw error;

    // Log audit
    await rolesQueries.logAudit({
      action: 'create_role',
      entity_type: 'role',
      entity_id: data.id,
      changes: roleData,
      tenant_id: roleData.tenant_id,
    });

    return data as Role;
  },

  // Update role
  update: async (id: string, updates: Partial<Role>) => {
    const { data, error } = await supabase
      .from('roles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Log audit
    await rolesQueries.logAudit({
      action: 'update_role',
      entity_type: 'role',
      entity_id: id,
      changes: updates,
    });

    return data as Role;
  },

  // Archive role
  archive: async (id: string) => {
    const { data, error } = await supabase
      .from('roles')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await rolesQueries.logAudit({
      action: 'archive_role',
      entity_type: 'role',
      entity_id: id,
      changes: { archived_at: new Date().toISOString() },
    });

    return data as Role;
  },

  // Restore archived role
  restore: async (id: string) => {
    const { data, error } = await supabase
      .from('roles')
      .update({ archived_at: null })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await rolesQueries.logAudit({
      action: 'restore_role',
      entity_type: 'role',
      entity_id: id,
      changes: { archived_at: null },
    });

    return data as Role;
  },

  // Clone role
  clone: async (id: string, newName: string) => {
    // Get original role
    const original = await rolesQueries.getById(id);

    // Create new role
    const { data: newRole, error: roleError } = await supabase
      .from('roles')
      .insert([{
        type: original.type,
        name: newName,
        description: `Cloned from ${original.name}`,
        tenant_id: original.tenant_id,
        is_system: false,
      }])
      .select()
      .single();

    if (roleError) throw roleError;

    // Clone permissions
    if (original.role_permissions && original.role_permissions.length > 0) {
      const permissions = original.role_permissions.map(p => ({
        role_id: newRole.id,
        module: p.module,
        action: p.action,
        decision: p.decision,
        scope: p.scope,
      }));

      const { error: permError } = await supabase
        .from('role_permissions')
        .insert(permissions);

      if (permError) throw permError;
    }

    await rolesQueries.logAudit({
      action: 'clone_role',
      entity_type: 'role',
      entity_id: newRole.id,
      changes: { cloned_from: id, original_name: original.name },
      tenant_id: original.tenant_id,
    });

    return newRole as Role;
  },

  // Delete role (only if not system and no users)
  delete: async (id: string) => {
    // Check if role is system
    const { data: role } = await supabase
      .from('roles')
      .select('is_system, tenant_id')
      .eq('id', id)
      .single();

    if (role?.is_system) {
      throw new Error('Cannot delete system role');
    }

    // Check if role has users
    const { count } = await supabase
      .from('user_roles')
      .select('*', { count: 'exact', head: true })
      .eq('role_uuid', id);

    if (count && count > 0) {
      throw new Error('Cannot delete role with assigned users');
    }

    const { error } = await supabase
      .from('roles')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await rolesQueries.logAudit({
      action: 'delete_role',
      entity_type: 'role',
      entity_id: id,
      changes: {},
      tenant_id: role?.tenant_id,
    });
  },

  // Get permissions for role
  getPermissions: async (roleId: string) => {
    const { data, error } = await supabase
      .from('role_permissions')
      .select('*')
      .eq('role_id', roleId);

    if (error) throw error;
    return data as RolePermission[];
  },

  // Update permissions for role
  updatePermissions: async (
    roleId: string,
    permissions: Array<{
      module: string;
      action: string;
      decision: 'allow' | 'deny' | 'inherit';
      scope: 'global' | 'tenant' | 'site';
    }>
  ) => {
    // Delete existing permissions
    await supabase
      .from('role_permissions')
      .delete()
      .eq('role_id', roleId);

    // Insert new permissions
    if (permissions.length > 0) {
      const { data, error } = await supabase
        .from('role_permissions')
        .insert(permissions.map(p => ({ ...p, role_id: roleId })))
        .select();

      if (error) throw error;

      await rolesQueries.logAudit({
        action: 'update_permissions',
        entity_type: 'role',
        entity_id: roleId,
        changes: { permissions },
      });

      return data as RolePermission[];
    }

    return [];
  },

  // Get users assigned to role
  getUsersByRole: async (roleId: string) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select(`
        *,
        profiles:user_id (*)
      `)
      .eq('role_uuid', roleId);

    if (error) throw error;
    return data as UserRoleAssignment[];
  },

  // Assign users to role
  assignUsers: async (
    roleId: string,
    userIds: string[],
    clientId?: string,
    siteScope?: string[]
  ) => {
    const assignments = userIds.map(userId => ({
      user_id: userId,
      role_uuid: roleId,
      client_id: clientId,
      site_scope: siteScope,
    }));

    const { data, error } = await supabase
      .from('user_roles')
      .insert(assignments)
      .select();

    if (error) throw error;

    await rolesQueries.logAudit({
      action: 'assign_users',
      entity_type: 'role',
      entity_id: roleId,
      changes: { user_ids: userIds, client_id: clientId, site_scope: siteScope },
      tenant_id: clientId,
    });

    return data;
  },

  // Remove users from role
  removeUsers: async (roleId: string, userIds: string[]) => {
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('role_uuid', roleId)
      .in('user_id', userIds);

    if (error) throw error;

    await rolesQueries.logAudit({
      action: 'remove_users',
      entity_type: 'role',
      entity_id: roleId,
      changes: { user_ids: userIds },
    });
  },

  // Get audit logs
  getAuditLogs: async (entityId?: string, limit: number = 50) => {
    let query = supabase
      .from('role_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (entityId) {
      query = query.eq('entity_id', entityId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as RoleAuditLog[];
  },

  // Log audit entry
  logAudit: async (audit: {
    action: string;
    entity_type: string;
    entity_id: string;
    changes: Record<string, any>;
    tenant_id?: string;
  }) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('role_audit_logs')
      .insert([{
        ...audit,
        user_id: user?.id,
      }]);

    if (error) console.error('Audit log error:', error);
  },
};
