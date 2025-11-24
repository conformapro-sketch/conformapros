import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/types/db";

type SiteRow = Database["public"]["Tables"]["sites"]["Row"];
type SiteInsert = Database["public"]["Tables"]["sites"]["Insert"];
type SiteUpdate = Database["public"]["Tables"]["sites"]["Update"];

/**
 * Centralized query service for sites
 * Provides all site-related database operations
 */
export const sitesQueryService = {
  /**
   * Fetch all sites
   */
  async fetchAll() {
    const { data, error } = await supabase
      .from("sites")
      .select(`
        *,
        clients:client_id (
          id,
          nom,
          nom_legal,
          logo_url
        )
      `)
      .order("nom", { ascending: true });

    if (error) throw error;
    return data as (SiteRow & { clients: any })[];
  },

  /**
   * Fetch sites for a specific client
   */
  async fetchByClient(clientId: string) {
    const { data, error } = await supabase
      .from("sites")
      .select("*")
      .eq("client_id", clientId)
      .order("nom", { ascending: true });

    if (error) throw error;
    return data as SiteRow[];
  },

  /**
   * Fetch a single site by ID
   */
  async fetchById(id: string) {
    const { data, error } = await supabase
      .from("sites")
      .select(`
        *,
        clients:client_id (
          id,
          nom,
          nom_legal
        )
      `)
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Create a new site
   */
  async create(siteData: SiteInsert) {
    const { data, error } = await supabase
      .from("sites")
      .insert(siteData)
      .select()
      .single();

    if (error) throw error;
    return data as SiteRow;
  },

  /**
   * Update an existing site
   */
  async update(id: string, siteData: SiteUpdate) {
    const { data, error } = await supabase
      .from("sites")
      .update(siteData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as SiteRow;
  },

  /**
   * Delete a site
   */
  async delete(id: string) {
    const { error } = await supabase
      .from("sites")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  /**
   * Get site modules
   */
  async getModules(siteId: string) {
    const { data, error } = await supabase
      .from("site_modules")
      .select(`
        *,
        modules_systeme:module_id (
          id,
          code,
          libelle,
          icon,
          couleur
        )
      `)
      .eq("site_id", siteId)
      .eq("actif", true);

    if (error) throw error;
    return data;
  },

  /**
   * Get site statistics
   */
  async getStats(siteId: string) {
    // Fetch users count
    const { count: usersCount, error: usersError } = await supabase
      .from("access_scopes")
      .select("*", { count: "exact", head: true })
      .eq("site_id", siteId);

    if (usersError) throw usersError;

    // Fetch modules count
    const { count: modulesCount, error: modulesError } = await supabase
      .from("site_modules")
      .select("*", { count: "exact", head: true })
      .eq("site_id", siteId)
      .eq("actif", true);

    if (modulesError) throw modulesError;

    return {
      usersCount: usersCount || 0,
      modulesCount: modulesCount || 0,
    };
  },

  /**
   * Upload site logo
   */
  async uploadLogo(siteId: string, file: File) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${siteId}-${Date.now()}.${fileExt}`;
    const filePath = `sites/${siteId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("logos")
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from("logos")
      .getPublicUrl(filePath);

    return publicUrl;
  },
};
