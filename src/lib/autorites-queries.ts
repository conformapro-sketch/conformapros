import { supabase } from "@/integrations/supabase/client";

export interface AutoriteEmettrice {
  id: string;
  nom: string;
  nom_court?: string;
  type?: 'legislatif' | 'executif' | 'ministeriel' | 'agence' | 'autre';
  description?: string;
  pays?: string;
  actif: boolean;
  ordre: number;
  created_at?: string;
  created_by?: string;
  updated_at?: string;
}

export const autoritesQueries = {
  /**
   * Fetch all active authorities
   */
  async fetchAll() {
    const { data, error } = await supabase
      .from('autorites_emettrices')
      .select('*')
      .eq('actif', true)
      .order('ordre', { ascending: true })
      .order('nom', { ascending: true });

    if (error) throw error;
    return data as AutoriteEmettrice[];
  },

  /**
   * Fetch all authorities (including inactive) - staff only
   */
  async fetchAllForManagement() {
    const { data, error } = await supabase
      .from('autorites_emettrices')
      .select('*')
      .order('ordre', { ascending: true })
      .order('nom', { ascending: true });

    if (error) throw error;
    return data as AutoriteEmettrice[];
  },

  /**
   * Fetch authority by ID
   */
  async fetchById(id: string) {
    const { data, error } = await supabase
      .from('autorites_emettrices')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as AutoriteEmettrice;
  },

  /**
   * Search authorities by name
   */
  async search(searchTerm: string) {
    const { data, error } = await supabase
      .from('autorites_emettrices')
      .select('*')
      .eq('actif', true)
      .or(`nom.ilike.%${searchTerm}%,nom_court.ilike.%${searchTerm}%`)
      .order('ordre', { ascending: true })
      .order('nom', { ascending: true })
      .limit(20);

    if (error) throw error;
    return data as AutoriteEmettrice[];
  },

  /**
   * Create new authority
   */
  async create(autorite: Omit<AutoriteEmettrice, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('autorites_emettrices')
      .insert({
        ...autorite,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data as AutoriteEmettrice;
  },

  /**
   * Update authority
   */
  async update(id: string, updates: Partial<AutoriteEmettrice>) {
    const { data, error } = await supabase
      .from('autorites_emettrices')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as AutoriteEmettrice;
  },

  /**
   * Soft delete authority (set actif to false)
   */
  async delete(id: string) {
    const { error } = await supabase
      .from('autorites_emettrices')
      .update({ actif: false })
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Hard delete authority (permanent)
   */
  async hardDelete(id: string) {
    const { error } = await supabase
      .from('autorites_emettrices')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
