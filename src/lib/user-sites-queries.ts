import { supabase } from "@/integrations/supabase/client";

/**
 * @deprecated This file uses the deprecated 'user_sites' table.
 * Use access-scopes-queries.ts instead, which uses the correct 'access_scopes' table.
 * This file is kept for backward compatibility but should not be used in new code.
 */
export const userSitesQueries = {
  // Get all sites for a user
  async getUserSites(userId: string) {
    const { data, error } = await supabase
      .from("user_sites")
      .select(`
        *,
        sites:site_id (
          id,
          nom,
          code_site,
          client_id,
          clients:client_id (
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
      .from("user_sites")
      .select(`
        *,
        profiles:user_id (
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

  // Assign a user to a site
  async assignUserToSite(userId: string, siteId: string) {
    const { data, error } = await supabase
      .from("user_sites")
      .insert({
        user_id: userId,
        site_id: siteId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Remove user from a site
  async removeUserFromSite(userId: string, siteId: string) {
    const { error } = await supabase
      .from("user_sites")
      .delete()
      .eq("user_id", userId)
      .eq("site_id", siteId);

    if (error) throw error;
    return { success: true };
  },

  // Bulk update user sites
  async updateUserSites(userId: string, siteIds: string[]) {
    // Get current assignments
    const { data: currentAssignments } = await supabase
      .from("user_sites")
      .select("site_id")
      .eq("user_id", userId);

    const currentSiteIds = currentAssignments?.map(a => a.site_id) || [];

    // Determine which to add and which to remove
    const toAdd = siteIds.filter(id => !currentSiteIds.includes(id));
    const toRemove = currentSiteIds.filter(id => !siteIds.includes(id));

    // Add new assignments
    if (toAdd.length > 0) {
      const { error: insertError } = await supabase
        .from("user_sites")
        .insert(
          toAdd.map(siteId => ({
            user_id: userId,
            site_id: siteId,
          }))
        );

      if (insertError) throw insertError;
    }

    // Remove old assignments
    if (toRemove.length > 0) {
      const { error: deleteError } = await supabase
        .from("user_sites")
        .delete()
        .eq("user_id", userId)
        .in("site_id", toRemove);

      if (deleteError) throw deleteError;
    }

    return { success: true };
  },

  // Get user's accessible sites using RPC function
  async getUserAccessibleSites(userId: string) {
    const { data, error } = await supabase
      .rpc("get_user_sites", { _user_id: userId });

    if (error) throw error;
    return data;
  },

  // Get sites for a client that a user can be assigned to
  async getClientSites(clientId: string) {
    const { data, error } = await supabase
      .from("sites")
      .select("id, nom, code_site")
      .eq("client_id", clientId)
      .order("nom", { ascending: true });

    if (error) throw error;
    return data;
  },
};
