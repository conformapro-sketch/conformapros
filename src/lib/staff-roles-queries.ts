import { supabase } from "@/integrations/supabase/client";

export interface StaffRole {
  id: string;
  nom_role: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface StaffRolePermission {
  id: string;
  role_id: string;
  permission_key: string;
  autorise: boolean;
  created_at: string;
  updated_at: string;
}

export interface StaffRoleWithPermissions extends StaffRole {
  permissions: StaffRolePermission[];
}

export const staffRolesQueries = {
  /**
   * Get all staff roles
   */
  async getAll(): Promise<StaffRole[]> {
    const { data, error } = await supabase
      .from('staff_roles')
      .select('*')
      .order('nom_role');

    if (error) throw error;
    return data || [];
  },

  /**
   * Get a single staff role with permissions
   */
  async getById(id: string): Promise<StaffRoleWithPermissions | null> {
    const { data: role, error: roleError } = await supabase
      .from('staff_roles')
      .select('*')
      .eq('id', id)
      .single();

    if (roleError) throw roleError;
    if (!role) return null;

    const { data: permissions, error: permError } = await supabase
      .from('staff_role_permissions')
      .select('*')
      .eq('role_id', id);

    if (permError) throw permError;

    return {
      ...role,
      permissions: permissions || []
    };
  },

  /**
   * Create a new staff role
   */
  async create(role: Omit<StaffRole, 'id' | 'created_at' | 'updated_at'>): Promise<StaffRole> {
    const { data, error } = await supabase
      .from('staff_roles')
      .insert([role])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update a staff role
   */
  async update(id: string, updates: Partial<Omit<StaffRole, 'id' | 'created_at' | 'updated_at'>>): Promise<StaffRole> {
    const { data, error } = await supabase
      .from('staff_roles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete a staff role
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('staff_roles')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Get permissions for a role
   */
  async getPermissions(roleId: string): Promise<StaffRolePermission[]> {
    const { data, error } = await supabase
      .from('staff_role_permissions')
      .select('*')
      .eq('role_id', roleId);

    if (error) throw error;
    return data || [];
  },

  /**
   * Set permissions for a role (replaces all existing permissions)
   */
  async setPermissions(roleId: string, permissions: Array<{ permission_key: string; autorise: boolean }>): Promise<void> {
    // Delete existing permissions
    const { error: deleteError } = await supabase
      .from('staff_role_permissions')
      .delete()
      .eq('role_id', roleId);

    if (deleteError) throw deleteError;

    // Insert new permissions
    if (permissions.length > 0) {
      const { error: insertError } = await supabase
        .from('staff_role_permissions')
        .insert(
          permissions.map(p => ({
            role_id: roleId,
            permission_key: p.permission_key,
            autorise: p.autorise
          }))
        );

      if (insertError) throw insertError;
    }
  },

  /**
   * Update a single permission
   */
  async updatePermission(roleId: string, permissionKey: string, autorise: boolean): Promise<void> {
    const { error } = await supabase
      .from('staff_role_permissions')
      .upsert({
        role_id: roleId,
        permission_key: permissionKey,
        autorise
      }, {
        onConflict: 'role_id,permission_key'
      });

    if (error) throw error;
  }
};
