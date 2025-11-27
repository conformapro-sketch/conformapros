import { supabase } from "@/integrations/supabase/client";

/**
 * Query service for access_scopes table (user-site relationships)
 * Replaces the deprecated user_sites queries
 */
export const accessScopesQueries = {
  // Get all sites for a user
  async getUserSites(userId: string) {
    const { data, error } = await supabase
      .from("access_scopes")
      .select(`
        *,
        site:sites (
          id,
          nom,
          code_site,
          gouvernorat,
          delegation,
          client_id,
          client:clients (
            id,
            nom
          )
        )
      `)
      .eq("user_id", userId);

    if (error) throw error;
    return data;
  },

  // Get all users assigned to a site
  async getSiteUsers(siteId: string) {
    const { data, error } = await supabase
      .from("access_scopes")
      .select(`
        *,
        user:client_users (
          id,
          email,
          nom,
          prenom
        )
      `)
      .eq("site_id", siteId);

    if (error) throw error;
    return data;
  },

  // Get sites for a client that a user can be assigned to
  async getClientSites(clientId: string) {
    const { data, error } = await supabase
      .from("sites")
      .select("id, nom, code_site, gouvernorat, delegation")
      .eq("client_id", clientId)
      .order("nom", { ascending: true });

    if (error) throw error;
    return data;
  },

  // Bulk update user sites for a given client using access_scopes
  async updateUserSites(userId: string, clientId: string, siteIds: string[]) {
    // Fetch all sites for this client to constrain scope updates
    const { data: clientSites, error: sitesError } = await supabase
      .from("sites")
      .select("id")
      .eq("client_id", clientId);

    if (sitesError) throw sitesError;

    const clientSiteIds = (clientSites || []).map((s) => s.id);

    // Delete existing access_scopes for this user limited to this client's sites
    if (clientSiteIds.length > 0) {
      const { error: deleteError } = await supabase
        .from("access_scopes")
        .delete()
        .eq("user_id", userId)
        .in("site_id", clientSiteIds);

      if (deleteError) throw deleteError;
    }

    // Insert new scopes for selected sites
    if (siteIds && siteIds.length > 0) {
      const scopes = siteIds.map((siteId) => ({
        user_id: userId,
        site_id: siteId,
        read_only: false,
      }));

      const { error: upsertError } = await supabase
        .from("access_scopes")
        .insert(scopes);

      if (upsertError) throw upsertError;
    }

    return { success: true };
  },
};
