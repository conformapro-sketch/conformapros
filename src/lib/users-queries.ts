import { supabaseAny as supabase } from "@/lib/supabase-any";

export const usersQueries = {
  // Get all users with roles
  getAll: async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        roles (
          id,
          nom,
          description,
          permissions
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Get Conforma Pro internal team members (no client association)
  getConformaTeam: async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        roles (
          id,
          nom,
          description,
          permissions
        )
      `)
      .is('client_id', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get user by ID
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        roles (
          id,
          nom,
          description,
          permissions
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Create user
  create: async (userData: {
    email: string;
    password: string;
    nom?: string;
    prenom?: string;
    role_id?: string;
    client_id?: string;
    site_id?: string;
  }) => {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          nom: userData.nom,
          prenom: userData.prenom,
        },
      },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('User creation failed');

    // Update profile with additional data
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        role_id: userData.role_id,
        client_id: userData.client_id,
        site_id: userData.site_id,
      })
      .eq('id', authData.user.id);

    if (profileError) throw profileError;

    return authData.user;
  },

  // Update user
  update: async (id: string, userData: {
    nom?: string;
    prenom?: string;
    email?: string;
    role_id?: string;
    actif?: boolean;
    client_id?: string;
    site_id?: string;
    fonction?: string;
    telephone?: string;
  }) => {
    const { data, error } = await supabase
      .from('profiles')
      .update(userData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Toggle user active status
  toggleActive: async (id: string, actif: boolean) => {
    const { data, error } = await supabase
      .from('profiles')
      .update({ actif })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Reset password (admin function)
  resetPassword: async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    
    if (error) throw error;
  },
};

export const rolesQueries = {
  // Get all roles
  getAll: async () => {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .order('nom');
    
    if (error) throw error;
    return data;
  },

  // Get role by ID
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Create role
  create: async (roleData: {
    nom: string;
    description?: string;
    permissions: Record<string, string[]>;
  }) => {
    const { data, error } = await supabase
      .from('roles')
      .insert([roleData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update role
  update: async (id: string, roleData: {
    nom?: string;
    description?: string;
    permissions?: Record<string, string[]>;
    actif?: boolean;
  }) => {
    const { data, error } = await supabase
      .from('roles')
      .update(roleData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete role
  delete: async (id: string) => {
    const { error } = await supabase
      .from('roles')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },
};
