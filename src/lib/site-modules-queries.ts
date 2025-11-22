import { supabase } from "@/integrations/supabase/client";

export const siteModulesQueries = {
  // Get all modules enabled for a specific site
  async getEnabledModules(siteId: string) {
    const { data, error } = await supabase
      .from("site_modules")
      .select(`
        *,
        modules_systeme:module_id (
          id,
          code,
          nom,
          libelle,
          description,
          icon,
          couleur,
          ordre,
          actif
        )
      `)
      .eq("site_id", siteId)
      .eq("actif", true)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data;
  },

  // Get all modules for a site (enabled and disabled)
  async getAllModulesForSite(siteId: string) {
    const { data, error } = await supabase
      .from("site_modules")
      .select(`
        *,
        modules_systeme:module_id (
          id,
          code,
          nom,
          libelle,
          description,
          icon,
          couleur,
          ordre,
          actif
        )
      `)
      .eq("site_id", siteId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data;
  },

  // Enable a module for a site
  async enableModule(siteId: string, moduleId: string) {
    // Check if association already exists
    const { data: existing } = await supabase
      .from("site_modules")
      .select("*")
      .eq("site_id", siteId)
      .eq("module_id", moduleId)
      .single();

    if (existing) {
      // Update existing record
      const { data, error } = await supabase
        .from("site_modules")
        .update({ 
          actif: true, 
          enabled_at: new Date().toISOString(),
          disabled_at: null 
        })
        .eq("site_id", siteId)
        .eq("module_id", moduleId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Create new record
      const { data, error } = await supabase
        .from("site_modules")
        .insert({
          site_id: siteId,
          module_id: moduleId,
          actif: true,
          enabled_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  },

  // Disable a module for a site
  async disableModule(siteId: string, moduleId: string) {
    const { data, error } = await supabase
      .from("site_modules")
      .update({ 
        actif: false,
        disabled_at: new Date().toISOString()
      })
      .eq("site_id", siteId)
      .eq("module_id", moduleId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Bulk update modules for a site
  async updateSiteModules(siteId: string, moduleIds: string[]) {
    // Get current site modules
    const { data: currentModules } = await supabase
      .from("site_modules")
      .select("module_id")
      .eq("site_id", siteId);

    const currentModuleIds = currentModules?.map(m => m.module_id) || [];

    // Determine which to add and which to disable
    const toAdd = moduleIds.filter(id => !currentModuleIds.includes(id));
    const toDisable = currentModuleIds.filter(id => !moduleIds.includes(id));
    const toEnable = moduleIds.filter(id => currentModuleIds.includes(id));

    // Add new modules
    if (toAdd.length > 0) {
      const { error: insertError } = await supabase
        .from("site_modules")
        .insert(
          toAdd.map(moduleId => ({
            site_id: siteId,
            module_id: moduleId,
            actif: true,
            enabled_at: new Date().toISOString(),
          }))
        );

      if (insertError) throw insertError;
    }

    // Enable existing modules
    if (toEnable.length > 0) {
      const { error: enableError } = await supabase
        .from("site_modules")
        .update({ 
          actif: true, 
          enabled_at: new Date().toISOString(),
          disabled_at: null 
        })
        .eq("site_id", siteId)
        .in("module_id", toEnable);

      if (enableError) throw enableError;
    }

    // Disable removed modules
    if (toDisable.length > 0) {
      const { error: disableError } = await supabase
        .from("site_modules")
        .update({ 
          actif: false,
          disabled_at: new Date().toISOString()
        })
        .eq("site_id", siteId)
        .in("module_id", toDisable);

      if (disableError) throw disableError;
    }

    return { success: true };
  },

  // Check if a module is enabled for a site
  async isModuleEnabled(siteId: string, moduleId: string) {
    const { data } = await supabase
      .rpc("is_module_enabled_for_site", {
        _site_id: siteId,
        _module_id: moduleId,
      });

    return data;
  },

  // Get all available modules (for selection) - only business modules, not system modules
  async getAllAvailableModules() {
    const { data, error } = await supabase
      .from("modules_systeme")
      .select("*")
      .eq("actif", true)
      .eq("type", "metier") // Only show business modules assignable to sites
      .order("ordre", { ascending: true });

    if (error) throw error;
    return data;
  },
};
