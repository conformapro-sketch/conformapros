// Queries for textes_reglementaires - simple metadata storage
// NO legal status or effects managed here - those are in article_versions
import { supabaseAny as supabase } from "@/lib/supabase-any";

export interface TexteMetadata {
  id: string;
  type: 'loi' | 'decret' | 'arrete' | 'circulaire';
  reference: string; // e.g., "Loi n°2016-10"
  titre: string;
  date_publication: string;
  source_url?: string;
  pdf_url?: string;
  created_at: string;
  created_by?: string;
  updated_at: string;
}

export const textesMetadataQueries = {
  /**
   * Get all textes with optional filtering
   */
  async getAll(filters?: {
    searchTerm?: string;
    type?: string;
    yearFilter?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 25;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('textes_reglementaires')
      .select('*', { count: 'exact' });

    // Search filter
    if (filters?.searchTerm) {
      const term = filters.searchTerm.trim();
      query = query.or(`reference.ilike.%${term}%,titre.ilike.%${term}%`);
    }

    // Type filter
    if (filters?.type && filters.type !== 'all') {
      query = query.eq('type', filters.type);
    }

    // Year filter
    if (filters?.yearFilter && filters.yearFilter !== 'all') {
      const year = parseInt(filters.yearFilter);
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;
      query = query.gte('date_publication', startDate).lte('date_publication', endDate);
    }

    // Pagination and sorting
    query = query
      .order('date_publication', { ascending: false })
      .range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      textes: data || [],
      count: count || 0,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  },

  /**
   * Get texte by ID
   */
  async getById(id: string): Promise<TexteMetadata | null> {
    const { data, error } = await supabase
      .from('textes_reglementaires')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Create new texte
   */
  async create(texte: Omit<TexteMetadata, 'id' | 'created_at' | 'updated_at' | 'created_by'>): Promise<TexteMetadata> {
    const { data, error } = await supabase
      .from('textes_reglementaires')
      .insert([texte])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update existing texte
   */
  async update(id: string, texte: Partial<Omit<TexteMetadata, 'id' | 'created_at' | 'updated_at' | 'created_by'>>): Promise<TexteMetadata> {
    const { data, error } = await supabase
      .from('textes_reglementaires')
      .update(texte)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete texte
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('textes_reglementaires')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Search textes for autocomplete
   */
  async search(searchTerm: string, limit: number = 10): Promise<TexteMetadata[]> {
    const { data, error } = await supabase
      .from('textes_reglementaires')
      .select('*')
      .or(`reference.ilike.%${searchTerm}%,titre.ilike.%${searchTerm}%`)
      .order('date_publication', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  /**
   * Get textes by IDs (bulk fetch)
   */
  async getByIds(ids: string[]): Promise<TexteMetadata[]> {
    if (ids.length === 0) return [];

    const { data, error } = await supabase
      .from('textes_reglementaires')
      .select('*')
      .in('id', ids)
      .order('date_publication', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get distinct years for filtering
   */
  async getAvailableYears(): Promise<number[]> {
    const { data, error } = await supabase
      .from('textes_reglementaires')
      .select('date_publication')
      .order('date_publication', { ascending: false });

    if (error) throw error;

    const years = new Set<number>();
    data?.forEach((item) => {
      if (item.date_publication) {
        const year = new Date(item.date_publication).getFullYear();
        years.add(year);
      }
    });

    return Array.from(years).sort((a, b) => b - a);
  },
};
