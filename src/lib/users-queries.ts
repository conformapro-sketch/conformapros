import { supabaseAny as supabase } from "@/lib/supabase-any";

export const usersQueries = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        user_roles(
          id,
          role_uuid,
          client_id,
          roles(
            id,
            name,
            description,
            type
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  getConformaTeam: async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        user_roles(
          id,
          role_uuid,
          roles(
            id,
            name,
            description,
            type
          )
        )
      `)
      .eq('user_roles.roles.type', 'team')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        user_roles!inner(
          id,
          role_uuid,
          roles!inner(
            id,
            name,
            description,
            type
          )
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  create: async (userData: {
    email: string;
    password: string;
    nom?: string;
    prenom?: string;
    role_uuid: string;
    telephone?: string;
  }) => {
    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          nom: userData.nom,
          prenom: userData.prenom,
        },
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('User creation failed');

    // 2. Update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        nom: userData.nom,
        prenom: userData.prenom,
        telephone: userData.telephone,
      })
      .eq('id', authData.user.id);

    if (profileError) throw profileError;

    // 3. Create user_roles record
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: authData.user.id,
        role_uuid: userData.role_uuid,
      });

    if (roleError) throw roleError;

    return authData.user;
  },

  update: async (id: string, userData: {
    nom?: string;
    prenom?: string;
    email?: string;
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

  updateRole: async (userId: string, roleUuid: string) => {
    // Delete old role assignments
    await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    // Insert new role
    const { data, error } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role_uuid: roleUuid,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  toggleActive: async (id: string, actif: boolean) => {
    const { error } = await supabase
      .from('profiles')
      .update({ actif })
      .eq('id', id);
    
    if (error) throw error;
  },

  resetPassword: async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    
    if (error) throw error;
  },
};

export const rolesQueries = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data;
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  create: async (roleData: {
    name: string;
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

  update: async (id: string, roleData: {
    name?: string;
    description?: string;
    permissions?: Record<string, string[]>;
    archived_at?: string | null;
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

  delete: async (id: string) => {
    const { error } = await supabase
      .from('roles')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },
};
