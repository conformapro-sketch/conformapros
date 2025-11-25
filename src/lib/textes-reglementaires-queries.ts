// Query helpers for textes_reglementaires (new regulatory architecture)
import { supabaseAny as supabase } from "@/lib/supabase-any";

export interface TexteReglementaire {
  id: string;
  type: 'loi' | 'decret' | 'arrete' | 'circulaire';
  reference: string;
  titre: string;
  autorite_emettrice?: string; // Deprecated, use autorite_emettrice_id
  autorite_emettrice_id?: string;
  date_publication?: string;
  source_url?: string;
  pdf_url?: string;
  created_at: string;
  created_by?: string;
  updated_at: string;
}

export interface DomaineReglementaire {
  id: string;
  code: string;
  libelle: string;
  description?: string;
  couleur?: string;
  icone?: string;
  actif: boolean;
}

export const textesReglementairesQueries = {
  async getAll(filters?: {
    searchTerm?: string;
    typeFilter?: string;
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }) {
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 25;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("textes_reglementaires")
      .select(`
        *,
        articles:articles(count)
      `, { count: "exact" });

    if (filters?.searchTerm) {
      query = query.or(
        `reference.ilike.%${filters.searchTerm}%,titre.ilike.%${filters.searchTerm}%`
      );
    }

    if (filters?.typeFilter && filters.typeFilter !== "all") {
      query = query.eq("type", filters.typeFilter);
    }

    const sortBy = filters?.sortBy || "date_publication";
    const sortOrder = filters?.sortOrder || "desc";
    query = query.order(sortBy, { ascending: sortOrder === "asc", nullsFirst: false });

    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;
    
    return { 
      data: data || [], 
      count: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    };
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from("textes_reglementaires")
      .select(`
        *,
        articles:articles(*)
      `)
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async create(texte: Omit<TexteReglementaire, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from("textes_reglementaires")
      .insert([texte])
      .select()
      .single();
    if (error) throw error;
    return data as TexteReglementaire;
  },

  async update(id: string, texte: Partial<TexteReglementaire>) {
    const { data, error } = await supabase
      .from("textes_reglementaires")
      .update(texte)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as TexteReglementaire;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from("textes_reglementaires")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },

  async uploadPDF(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('textes-reglementaires-pdf')
      .upload(filePath, file);

    if (uploadError) {
      throw new Error(`Erreur lors de l'upload: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('textes-reglementaires-pdf')
      .getPublicUrl(filePath);

    return publicUrl;
  },

  async deletePDF(pdfUrl: string) {
    // Extract file path from URL
    const urlParts = pdfUrl.split('/textes-reglementaires-pdf/');
    if (urlParts.length < 2) return;
    
    const filePath = urlParts[1];
    
    const { error } = await supabase.storage
      .from('textes-reglementaires-pdf')
      .remove([filePath]);

    if (error) {
      console.error('Error deleting PDF:', error);
    }
  }
};

export const domainesQueries = {
  async getActive() {
    const { data, error } = await supabase
      .from("domaines_reglementaires")
      .select("*")
      .eq("actif", true)
      .is("deleted_at", null)
      .order("libelle");
    if (error) throw error;
    return data as DomaineReglementaire[];
  },
};

// Article queries for textes_reglementaires
export const articlesQueries = {
  async getById(id: string) {
    const { data, error } = await supabase
      .from("articles")
      .select(`
        *,
        sous_domaines:article_sous_domaines(
          sous_domaine:sous_domaines_application(*)
        )
      `)
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async getByTexteId(texteId: string) {
    const { data, error } = await supabase
      .from("articles")
      .select(`
        *,
        sous_domaines:article_sous_domaines(
          sous_domaine:sous_domaines_application(*)
        )
      `)
      .eq("texte_id", texteId)
      .order("numero");
    if (error) throw error;
    return data || [];
  },

  async getActiveVersions(articleIds: string[]) {
    if (articleIds.length === 0) return [];
    const { data, error } = await supabase
      .from("v_articles_versions_actives")
      .select("*")
      .in("article_id", articleIds);
    if (error) throw error;
    return data || [];
  },

  async create(article: {
    texte_id: string;
    numero: string;
    titre: string;
    resume?: string;
    est_introductif?: boolean;
    porte_exigence?: boolean;
  }) {
    const { data, error } = await supabase
      .from("articles")
      .insert([article])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, article: Partial<{
    numero: string;
    titre: string;
    resume: string;
    est_introductif: boolean;
    porte_exigence: boolean;
  }>) {
    const { data, error } = await supabase
      .from("articles")
      .update(article)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from("articles")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },
};

// Article versions queries
export const articleVersionsQueries = {
  async getByArticleId(articleId: string) {
    const { data, error } = await supabase
      .from("article_versions")
      .select(`
        *,
        source_texte:textes_reglementaires!article_versions_source_texte_id_fkey(
          id,
          reference,
          titre,
          type
        )
      `)
      .eq("article_id", articleId)
      .order("numero_version", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async create(version: {
    article_id: string;
    contenu: string;
    date_effet: string;
    numero_version: number;
    source_texte_id: string;
    statut?: 'en_vigueur' | 'remplacee' | 'abrogee';
    notes_modifications?: string;
  }) {
    const { data, error } = await supabase
      .from("article_versions")
      .insert([{
        ...version,
        statut: version.statut || 'en_vigueur',
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, version: Partial<{
    contenu: string;
    date_effet: string;
    statut: 'en_vigueur' | 'remplacee' | 'abrogee';
    notes_modifications: string;
  }>) {
    const { data, error } = await supabase
      .from("article_versions")
      .update(version)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from("article_versions")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },

  async updateOldVersionsStatus(articleId: string, newVersionId: string, newStatus: 'remplacee' | 'abrogee') {
    const { error } = await supabase
      .from("article_versions")
      .update({ statut: newStatus })
      .eq("article_id", articleId)
      .eq("statut", "en_vigueur")
      .neq("id", newVersionId);
    if (error) throw error;
  },
};
