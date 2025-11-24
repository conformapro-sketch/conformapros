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
};
