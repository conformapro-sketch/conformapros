import { supabaseAny as supabase } from "@/lib/supabase-any";

export interface ModuleSysteme {
  id: string;
  code: string;
  libelle: string;
  description?: string;
  actif: boolean;
  icone?: string;
  couleur?: string;
  created_at: string;
  updated_at: string;
}

export interface ModuleFeature {
  id: string;
  module_id: string;
  code: string;
  name: string;
  description?: string;
  actif: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface PermissionAction {
  id: string;
  code: string;
  label: string;
  description?: string;
  display_order: number;
  created_at: string;
}

export const modulesQueries = {
  // ==========================================
  // MODULES
  // ==========================================

  // Get all active modules
  getAll: async () => {
    const { data, error } = await supabase
      .from('modules_systeme')
      .select('*')
      .eq('actif', true)
      .order('libelle');
    
    if (error) throw error;
    return data as ModuleSysteme[];
  },

  // Get all modules (including inactive)
  getAllWithInactive: async () => {
    const { data, error } = await supabase
      .from('modules_systeme')
      .select('*')
      .order('libelle');
    
    if (error) throw error;
    return data as ModuleSysteme[];
  },

  // Get single module by ID
  getById: async (moduleId: string) => {
    const { data, error } = await supabase
      .from('modules_systeme')
      .select('*')
      .eq('id', moduleId)
      .single();
    
    if (error) throw error;
    return data as ModuleSysteme;
  },

  // Get module by code
  getByCode: async (code: string) => {
    const { data, error } = await supabase
      .from('modules_systeme')
      .select('*')
      .eq('code', code)
      .single();
    
    if (error) throw error;
    return data as ModuleSysteme;
  },

  // Create new module (auto-generates permissions via trigger)
  createModule: async (moduleData: {
    code: string;
    libelle: string;
    description?: string;
    icone?: string;
    couleur?: string;
    actif?: boolean;
  }) => {
    const { data, error } = await supabase
      .from('modules_systeme')
      .insert([{ actif: true, ...moduleData }])
      .select()
      .single();
    
    if (error) throw error;
    return data as ModuleSysteme;
  },

  // Update module
  updateModule: async (moduleId: string, updates: Partial<ModuleSysteme>) => {
    const { data, error } = await supabase
      .from('modules_systeme')
      .update(updates)
      .eq('id', moduleId)
      .select()
      .single();
    
    if (error) throw error;
    return data as ModuleSysteme;
  },

  // Delete module (also deletes associated permissions via CASCADE)
  deleteModule: async (moduleId: string) => {
    const { error } = await supabase
      .from('modules_systeme')
      .delete()
      .eq('id', moduleId);
    
    if (error) throw error;
  },

  // ==========================================
  // FEATURES
  // ==========================================

  // Get features for a module
  getFeatures: async (moduleId: string) => {
    const { data, error } = await supabase
      .from('module_features')
      .select('*')
      .eq('module_id', moduleId)
      .eq('actif', true)
      .order('display_order');
    
    if (error) throw error;
    return data as ModuleFeature[];
  },

  // Get all features (including inactive)
  getAllFeatures: async (moduleId?: string) => {
    let query = supabase
      .from('module_features')
      .select('*')
      .order('display_order');

    if (moduleId) {
      query = query.eq('module_id', moduleId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data as ModuleFeature[];
  },

  // Get single feature by ID
  getFeatureById: async (featureId: string) => {
    const { data, error } = await supabase
      .from('module_features')
      .select('*')
      .eq('id', featureId)
      .single();
    
    if (error) throw error;
    return data as ModuleFeature;
  },

  // Create new feature (auto-generates permissions via trigger)
  createFeature: async (featureData: {
    module_id: string;
    code: string;
    name: string;
    description?: string;
    display_order?: number;
    actif?: boolean;
  }) => {
    const { data, error } = await supabase
      .from('module_features')
      .insert([{ actif: true, display_order: 0, ...featureData }])
      .select()
      .single();
    
    if (error) throw error;
    return data as ModuleFeature;
  },

  // Update feature
  updateFeature: async (featureId: string, updates: Partial<ModuleFeature>) => {
    const { data, error } = await supabase
      .from('module_features')
      .update(updates)
      .eq('id', featureId)
      .select()
      .single();
    
    if (error) throw error;
    return data as ModuleFeature;
  },

  // Delete feature (also deletes associated permissions via CASCADE)
  deleteFeature: async (featureId: string) => {
    const { error } = await supabase
      .from('module_features')
      .delete()
      .eq('id', featureId);
    
    if (error) throw error;
  },

  // Reorder features
  reorderFeatures: async (updates: Array<{ id: string; display_order: number }>) => {
    const promises = updates.map(({ id, display_order }) =>
      supabase
        .from('module_features')
        .update({ display_order })
        .eq('id', id)
    );

    await Promise.all(promises);
  },

  // ==========================================
  // PERMISSION ACTIONS
  // ==========================================

  // Get all permission actions
  getActions: async () => {
    const { data, error } = await supabase
      .from('permission_actions')
      .select('*')
      .order('display_order');
    
    if (error) throw error;
    return data as PermissionAction[];
  },

  // Get single action by ID
  getActionById: async (actionId: string) => {
    const { data, error } = await supabase
      .from('permission_actions')
      .select('*')
      .eq('id', actionId)
      .single();
    
    if (error) throw error;
    return data as PermissionAction;
  },

  // Get action by code
  getActionByCode: async (code: string) => {
    const { data, error } = await supabase
      .from('permission_actions')
      .select('*')
      .eq('code', code)
      .single();
    
    if (error) throw error;
    return data as PermissionAction;
  },

  // Create new action
  createAction: async (actionData: {
    code: string;
    label: string;
    description?: string;
    display_order?: number;
  }) => {
    const { data, error } = await supabase
      .from('permission_actions')
      .insert([{ display_order: 0, ...actionData }])
      .select()
      .single();
    
    if (error) throw error;
    return data as PermissionAction;
  },

  // Update action
  updateAction: async (actionId: string, updates: Partial<PermissionAction>) => {
    const { data, error } = await supabase
      .from('permission_actions')
      .update(updates)
      .eq('id', actionId)
      .select()
      .single();
    
    if (error) throw error;
    return data as PermissionAction;
  },

  // Delete action
  deleteAction: async (actionId: string) => {
    const { error } = await supabase
      .from('permission_actions')
      .delete()
      .eq('id', actionId);
    
    if (error) throw error;
  },

  // ==========================================
  // COMBINED QUERIES
  // ==========================================

  // Get modules with their features
  getModulesWithFeatures: async () => {
    const { data, error } = await supabase
      .from('modules_systeme')
      .select(`
        *,
        module_features (*)
      `)
      .eq('actif', true)
      .order('libelle');
    
    if (error) throw error;
    return data as (ModuleSysteme & { module_features: ModuleFeature[] })[];
  },

  // Get complete permission structure (modules -> features -> actions)
  getPermissionStructure: async () => {
    const [modules, actions] = await Promise.all([
      modulesQueries.getModulesWithFeatures(),
      modulesQueries.getActions(),
    ]);

    return {
      modules,
      actions,
    };
  },
};
