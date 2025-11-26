import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type StaffUserInsert = Database['public']['Tables']['staff_users']['Insert'];

export interface StaffUser {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role_id: string;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

export interface StaffUserWithRole extends StaffUser {
  role: {
    id: string;
    nom_role: string;
    description: string | null;
  } | null;
}

export const staffUsersQueries = {
  /**
   * Get all staff users with their roles
   */
  async getAll(): Promise<StaffUserWithRole[]> {
    const { data, error } = await supabase
      .from('staff_users')
      .select(`
        *,
        role:staff_roles(id, nom_role, description)
      `)
      .order('nom');

    if (error) throw error;
    return data || [];
  },

  /**
   * Get a single staff user by ID
   */
  async getById(id: string): Promise<StaffUserWithRole | null> {
    const { data, error } = await supabase
      .from('staff_users')
      .select(`
        *,
        role:staff_roles(id, nom_role, description)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Create a new staff user
   */
  async create(user: StaffUserInsert): Promise<StaffUser> {
    const { data, error } = await supabase
      .from('staff_users')
      .insert([user])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update a staff user
   */
  async update(id: string, updates: Partial<Omit<StaffUser, 'id' | 'created_at' | 'updated_at'>>): Promise<StaffUser> {
    const { data, error } = await supabase
      .from('staff_users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete a staff user
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('staff_users')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Toggle user active status
   */
  async toggleActive(id: string, actif: boolean): Promise<StaffUser> {
    return this.update(id, { actif });
  },

  /**
   * Change user role
   */
  async changeRole(id: string, role_id: string): Promise<StaffUser> {
    return this.update(id, { role_id });
  },

  /**
   * Send password reset email
   */
  async resetPassword(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;
  }
};
