import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/types/db";

type ClientRow = Database["public"]["Tables"]["clients"]["Row"];
type ClientInsert = Database["public"]["Tables"]["clients"]["Insert"];
type ClientUpdate = Database["public"]["Tables"]["clients"]["Update"];

/**
 * Centralized query service for clients
 * Provides all client-related database operations
 */
export const clientsQueryService = {
  /**
   * Fetch all clients
   */
  async fetchAll() {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("nom", { ascending: true });

    if (error) throw error;
    return data as ClientRow[];
  },

  /**
   * Fetch a single client by ID
   */
  async fetchById(id: string) {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as ClientRow;
  },

  /**
   * Create a new client
   */
  async create(clientData: ClientInsert) {
    const { data, error } = await supabase
      .from("clients")
      .insert(clientData)
      .select()
      .single();

    if (error) throw error;
    return data as ClientRow;
  },

  /**
   * Update an existing client
   */
  async update(id: string, clientData: ClientUpdate) {
    const { data, error } = await supabase
      .from("clients")
      .update(clientData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as ClientRow;
  },

  /**
   * Delete a client
   */
  async delete(id: string) {
    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  /**
   * Upload client logo
   */
  async uploadLogo(clientId: string, file: File) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${clientId}-${Date.now()}.${fileExt}`;
    const filePath = `client-logos/${clientId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("client-logos")
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from("client-logos")
      .getPublicUrl(filePath);

    return publicUrl;
  },

  /**
   * Get client statistics
   */
  async getStats(clientId: string) {
    // Fetch sites count
    const { count: sitesCount, error: sitesError } = await supabase
      .from("sites")
      .select("*", { count: "exact", head: true })
      .eq("client_id", clientId);

    if (sitesError) throw sitesError;

    // Fetch users count
    const { count: usersCount, error: usersError } = await supabase
      .from("client_users")
      .select("*", { count: "exact", head: true })
      .eq("client_id", clientId);

    if (usersError) throw usersError;

    return {
      sitesCount: sitesCount || 0,
      usersCount: usersCount || 0,
    };
  },
};
